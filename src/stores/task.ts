
import { defineStore } from 'pinia'
import type { Priority } from '../types/index.ts'
import { useHistoryStore } from './history'

import { ref, computed, watch } from 'vue'
import type { Task, DailyStats, TimerState, DailyFocusState, TaskTimer } from '../types/index.ts'
import { loadState, saveState, resetDailyTasks } from '../utils/storage.ts'

type NotificationCallback = (task?: Task | null) => void
const notificationCallbacks: Set<NotificationCallback> = new Set()

export const onTimerComplete = (callback: NotificationCallback) => {
  notificationCallbacks.add(callback)
  return () => notificationCallbacks.delete(callback)
}



export const useTaskStore = defineStore('tasks', () => {

  const historyStore = useHistoryStore()

  // State
  const tasks = ref<Task[]>([])
  const dailyStats = ref<DailyStats>({
    date: new Date().toDateString(),
    tasksCompleted: 0,
    totalTasks: 0,
    totalTimeSpent: 0,
    completionRate: 0
  })
  const today = ref(new Date().toDateString())
  const timer = ref<TimerState>({
    activeTaskId: null,
    timeRemaining: 1500,
    isRunning: false
  })

  // Timer interval reference
  let timerInterval: number | null = null

  // Computed

  const activeTimers = ref<Map<string, TaskTimer>>(new Map())

  const completedTasks = computed(() =>
    tasks.value.filter(task => task.completed).length
  )

  const totalTimeSpent = computed(() =>
    tasks.value.reduce((sum, task) => sum + task.timeSpent, 0)
  )

  const averageTimePerTask = computed(() =>
    completedTasks.value > 0 ? totalTimeSpent.value / completedTasks.value : 0
  )

  const sortedTasks = computed(() =>
    [...tasks.value].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  )

  const activeTask = computed(() =>
    timer.value.activeTaskId
      ? tasks.value.find(task => task.id === timer.value.activeTaskId)
      : null
  )

  const isTaskTimerRunning = (taskId: string) => {
    return activeTimers.value.has(taskId)
  }

  const getTaskTimeRemaining = (taskId: string): number => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return 0

    const timer = activeTimers.value.get(taskId)
    if (!timer) return task.estimatedTime

    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000)
    return Math.max(0, task.estimatedTime - elapsed)
  }

  const initialize = () => {
    const savedState = loadState()

    if (savedState) {
      const resetState = resetDailyTasks(savedState)

      tasks.value = resetState.tasks
      dailyStats.value = resetState.dailyStats
      today.value = resetState.today
      timer.value = resetState.timer
    }

    // Restore active timers
    const savedTimers = localStorage.getItem('activeTimers')

    if (savedTimers) {
      try {
        const timerData: Array<{ taskId: string; startTime: number }> =
          JSON.parse(savedTimers)

        timerData.forEach(({ taskId, startTime }) => {
          const task = tasks.value.find(t => t.id === taskId)

          if (!task || task.completed) return

          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          const remaining = task.estimatedTime - elapsed

          if (remaining > 0) {
            // Restart timer with correct remaining time
            startTaskTimer(taskId, remaining)

            // Restore UI state
            timer.value.activeTaskId = taskId
            timer.value.isRunning = true
          }
        })
      } catch (err) {
        console.error('Failed to restore timers:', err)
      }
    }

    requestNotificationPermission()
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }

  const addTask = (title: string, description: string, priority: Priority) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      completed: false,
      priority,
      timeSpent: 0,
      estimatedTime: 1500,
      createdAt: new Date()
    }

    tasks.value.unshift(newTask)
    updateStats()
    saveToStorage()
  }

  const updateTask = (updatedTask: Task) => {
    const index = tasks.value.findIndex(t => t.id === updatedTask.id)
    if (index !== -1) {
      tasks.value[index] = updatedTask
      updateStats()
      saveToStorage()
    }
  }

  const deleteTask = (taskId: string) => {
    if (activeTimers.value.has(taskId)) {
      stopTaskTimer(taskId)
    }
    tasks.value = tasks.value.filter(task => task.id !== taskId)

    if (timer.value.activeTaskId === taskId) {
      timer.value.activeTaskId = null
    }

    updateStats()
    saveToStorage()
  }


  const toggleTaskCompletion = (taskId: string) => {
    console.log('toggle called for:', taskId)

    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    console.log('BEFORE toggle:', task.completed, typeof task.completed)

    const wasCompleted = Boolean(task.completed)
    const completedAtBeforeToggle = task.completedAt // store the date before toggle

    // Toggle completion
    task.completed = !wasCompleted
    task.completedAt = task.completed ? new Date() : undefined

    console.log('AFTER toggle:', task.completed)

    if (task.completed) {
      // Task marked as completed
      console.log('completed task done:', task)
      historyStore.addCompletedTask({ ...task })
    } else {
      // Task unmarked (remove from history)
      console.log('removing task from history:', task)

      // Remove from completed tasks
      historyStore.removeCompletedTask(taskId)

      // Remove from daily history
      if (completedAtBeforeToggle) {
        const completedDateStr = completedAtBeforeToggle.toDateString()
        const dayEntry = historyStore.history.find(h => h.date === completedDateStr)
        if (dayEntry) {
          // Remove the task from day's tasks
          dayEntry.tasks = dayEntry.tasks.filter(t => t.id !== taskId)

          // Update stats
          dayEntry.totalTasks = Math.max(0, dayEntry.totalTasks - 1)
          dayEntry.tasksCompleted = Math.max(0, dayEntry.tasksCompleted - 1)
          dayEntry.totalTimeSpent = dayEntry.tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
          dayEntry.completionRate =
            dayEntry.totalTasks > 0
              ? Math.round((dayEntry.tasksCompleted / dayEntry.totalTasks) * 100)
              : 0

          // If no tasks remain for the day, remove the day entirely
          if (dayEntry.tasks.length === 0) {
            historyStore.history = historyStore.history.filter(h => h.date !== dayEntry.date)
          }

          // Save updated history
          historyStore.saveHistory()
        }
      }
    }

    if (task.completed && activeTimers.value.has(taskId)) {
      stopTaskTimer(taskId)
    }

    updateStats()
    saveToStorage()
  }


  const startTaskTimer = (taskId: string, duration?: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    if (task.completed) return

    if (activeTimers.value.has(taskId)) return

    if (duration) {
      task.estimatedTime = duration
    }

    const startTime = Date.now()
    let secondsElapsed = 0

    const interval = setInterval(() => {
      secondsElapsed++

      const taskIndex = tasks.value.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        const currentTask = tasks.value[taskIndex]
        if (currentTask) {
          currentTask.timeSpent++

          if (secondsElapsed >= task.estimatedTime) {
            stopTaskTimer(taskId)
            notifyTimerComplete(currentTask)
          }
        }
      }

      if (secondsElapsed % 10 === 0) {
        saveToStorage()
      }
    }, 1000)

    activeTimers.value.set(taskId, {
      taskId,
      interval: interval as unknown as number,
      startTime
    })

    saveToStorage()
  }

  const stopTaskTimer = (taskId: string) => {
    const timer = activeTimers.value.get(taskId)
    if (timer) {
      clearInterval(timer.interval)
      activeTimers.value.delete(taskId)
      saveToStorage()
    }
  }

  const toggleTaskTimer = (taskId: string, duration?: number) => {
    if (activeTimers.value.has(taskId)) {
      stopTaskTimer(taskId)
    } else {
      startTaskTimer(taskId, duration || 1500)
    }
  }

  // Stop all timers
  const stopAllTimers = () => {
    activeTimers.value.forEach((timer) => {
      clearInterval(timer.interval)
    })
    activeTimers.value.clear()
    saveToStorage()
  }

  const startTimer = () => {
    if (timer.value.activeTaskId) {
      startTaskTimer(timer.value.activeTaskId, timer.value.timeRemaining)
      timer.value.isRunning = true
    }
  }

  const stopTimer = () => {
    if (timer.value.activeTaskId) {
      stopTaskTimer(timer.value.activeTaskId)
    }
    timer.value.isRunning = false
  }

  const toggleTimer = (taskId?: string) => {
    if (taskId) {
      toggleTaskTimer(taskId)
      timer.value.activeTaskId = taskId
      timer.value.isRunning = activeTimers.value.has(taskId)
    } else if (timer.value.activeTaskId) {
      toggleTaskTimer(timer.value.activeTaskId)
      timer.value.isRunning = activeTimers.value.has(timer.value.activeTaskId)
    }
  }

  const setTimerDuration = (minutes: number) => {
    timer.value.timeRemaining = minutes * 60
    saveToStorage()
  }

  const resetTimer = () => {
    if (timer.value.activeTaskId) {
      stopTaskTimer(timer.value.activeTaskId)
    }
    timer.value.timeRemaining = 1500
    timer.value.activeTaskId = null
    timer.value.isRunning = false
    saveToStorage()
  }
  const notifyTimerComplete = (task?: Task | null) => {
    playNotificationSound()

    notificationCallbacks.forEach(callback => callback(task))

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const taskTitle = task?.title || 'Focus session'
        const notification = new Notification('⏰ Timer Complete!', {
          body: `Time's up for "${taskTitle}"!\n\nGreat work! Take a short break.`,
          icon: '/daily_reminder.png',
          badge: '/daily_reminder.png',
          tag: `timer-complete-${task?.id || 'general'}`,
          requireInteraction: true,
          data: {
            taskId: task?.id,
            taskTitle: task?.title,
            timestamp: new Date().toISOString()
          }
        })

        setTimeout(() => {
          notification.close()
        }, 30000)

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } else if (Notification.permission === 'default') {
        // Request permission and retry
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            notifyTimerComplete(task)
          }
        })
      }
    }

  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        oscillator2.frequency.value = 1000
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.5)
      }, 100)
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }



  const updateStats = () => {
    const completed = tasks.value.filter(task => task.completed).length
    const total = tasks.value.length

    dailyStats.value = {
      date: today.value,
      tasksCompleted: completed,
      totalTasks: total,
      totalTimeSpent: totalTimeSpent.value,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    }
  }

  const saveToStorage = () => {
    // Save active timer info for persistence
    const activeTimerData = Array.from(activeTimers.value.entries()).map(([taskId, timer]) => ({
      taskId,
      startTime: timer.startTime
    }))

    const state: DailyFocusState = {
      tasks: tasks.value,
      dailyStats: dailyStats.value,
      today: today.value,
      timer: timer.value
    }

    saveState(state)

    // Save active timers separately
    localStorage.setItem('activeTimers', JSON.stringify(activeTimerData))
  }

  const resetDay = () => {
    const state: DailyFocusState = {
      tasks: tasks.value,
      dailyStats: dailyStats.value,
      today: today.value,
      timer: timer.value
    }

    historyStore.addToHistory(dailyStats.value, tasks.value)


    const resetState = resetDailyTasks(state)
    tasks.value = resetState.tasks
    dailyStats.value = resetState.dailyStats
    today.value = resetState.today
    timer.value = resetState.timer



    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    stopAllTimers()

    saveToStorage()
  }

  const clearAllData = () => {
    tasks.value = []
    dailyStats.value = {
      date: new Date().toDateString(),
      tasksCompleted: 0,
      totalTasks: 0,
      totalTimeSpent: 0,
      completionRate: 0
    }
    today.value = new Date().toDateString()

    stopAllTimers()
    timer.value = {
      activeTaskId: null,
      timeRemaining: 1500,
      isRunning: false
    }

    saveToStorage()
  }

  // window.addEventListener('beforeunload', () => {
  //   stopAllTimers()
  // })

  const checkAndResetIfNewDay = () => {
    const currentDay = new Date().toDateString()
    if (today.value !== currentDay) {
      resetDay()
    }
  }

  setInterval(checkAndResetIfNewDay, 60000)


  return {
    tasks,
    dailyStats,
    today,
    timer,

    // Computed

    isTaskTimerRunning,
    getTaskTimeRemaining,
    completedTasks,
    totalTimeSpent,
    averageTimePerTask,
    sortedTasks,
    activeTask,

    // Actions
    initialize,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    startTimer,
    stopTimer,
    toggleTimer,
    setTimerDuration,
    resetTimer,
    resetDay,
    clearAllData,
    notifyTimerComplete,
    startTaskTimer,
    stopTaskTimer,
    toggleTaskTimer,
    stopAllTimers,
    saveToStorage
  }
})
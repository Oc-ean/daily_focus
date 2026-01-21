import type  { DailyFocusState, Task } from '../types/index.ts'

const STORAGE_KEY = 'dailyFocusBoard'

export const loadState = (): DailyFocusState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) {
      return null
    }
    return JSON.parse(serializedState, (key, value) => {
      if (key === 'createdAt' || key === 'completedAt') {
        return value ? new Date(value) : undefined
      }
      return value
    })
  } catch (err) {
    console.error('Error loading state:', err)
    return null
  }
}

export const saveState = (state: DailyFocusState): void => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serializedState)
  } catch (err) {
    console.error('Error saving state:', err)
  }
}

export const resetDailyTasks = (state: DailyFocusState): DailyFocusState => {
  const today = new Date().toDateString()
  
  if (state.today !== today) {
    // Move unfinished tasks to tomorrow
    const unfinishedTasks = state.tasks
      .filter(task => !task.completed)
      .map(task => ({
        ...task,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        timeSpent: 0,
        completed: false
      }))

    // Update daily stats
    const completedTasks = state.tasks.filter(task => task.completed)
    const newStats = {
      date: state.today,
      tasksCompleted: completedTasks.length,
      totalTasks: state.tasks.length,
      totalTimeSpent: state.tasks.reduce((sum, task) => sum + task.timeSpent, 0),
      completionRate: state.tasks.length > 0 ? (completedTasks.length / state.tasks.length) * 100 : 0
    }

    // Save yesterday's stats to history
    const history = JSON.parse(localStorage.getItem('taskHistory') || '[]')
    history.push(newStats)
    localStorage.setItem('taskHistory', JSON.stringify(history))

    return {
      tasks: unfinishedTasks,
      dailyStats: {
        date: today,
        tasksCompleted: 0,
        totalTasks: unfinishedTasks.length,
        totalTimeSpent: 0,
        completionRate: 0
      },
      today,
      timer: {
        activeTaskId: null,
        timeRemaining: 0,
        isRunning: false
      }
    }
  }
  
  return state
}
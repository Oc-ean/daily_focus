import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, DailyStats } from '../types'

export interface DailyHistory extends DailyStats {
    tasks: Task[]
}

export const useHistoryStore = defineStore('history', () => {
    const history = ref<DailyHistory[]>([])
    const completedTasks = ref<Task[]>([])

    // Computed properties
    const totalCompletedTasks = computed(() => completedTasks.value.length)

    const averageCompletionRate = computed(() => {
        if (history.value.length === 0) return 0
        const sum = history.value.reduce((acc, day) => acc + day.completionRate, 0)
        return Math.round(sum / history.value.length)
    })

    const totalFocusTime = computed(() =>
        history.value.reduce((acc, day) => acc + day.totalTimeSpent, 0)
    )

    const currentStreak = computed(() => {
        let streak = 0

        const sortedHistory = [...history.value].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        for (let i = 0; i < sortedHistory.length; i++) {
            const day = sortedHistory[i]
            if (!day) break

            if (day.tasksCompleted > 0) {
                streak++

                const nextDay = sortedHistory[i + 1]
                if (!nextDay) break

                const currentDate = new Date(day.date)
                const nextDate = new Date(nextDay.date)

                const dayDiff =
                    (currentDate.getTime() - nextDate.getTime()) /
                    (1000 * 60 * 60 * 24)

                if (dayDiff > 1) break
            } else {
                if (i === 0) continue
                break
            }
        }

        return streak
    })


    const bestStreak = computed(() => {
        let best = 0
        let current = 0

        const sortedHistory = [...history.value].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        for (let i = 0; i < sortedHistory.length; i++) {
            const day = sortedHistory[i]
            if (!day) break

            if (day.tasksCompleted > 0) {
                current++
                best = Math.max(best, current)

                const nextDay = sortedHistory[i + 1]
                if (!nextDay) continue

                const currentDate = new Date(day.date)
                const nextDate = new Date(nextDay.date)

                const dayDiff =
                    (nextDate.getTime() - currentDate.getTime()) /
                    (1000 * 60 * 60 * 24)

                // If gap is more than 1 day, reset streak
                if (dayDiff > 1) {
                    current = 0
                }
            } else {
                current = 0
            }
        }

        return best
    })


    const weeklyStats = computed(() => {
        const last7Days = history.value.slice(-7)
        return {
            totalTasks: last7Days.reduce((sum, day) => sum + day.totalTasks, 0),
            completedTasks: last7Days.reduce((sum, day) => sum + day.tasksCompleted, 0),
            totalTime: last7Days.reduce((sum, day) => sum + day.totalTimeSpent, 0),
            averageCompletionRate: last7Days.length > 0
                ? Math.round(last7Days.reduce((sum, day) => sum + day.completionRate, 0) / last7Days.length)
                : 0
        }
    })

    const monthlyStats = computed(() => {
        const last30Days = history.value.slice(-30)
        return {
            totalTasks: last30Days.reduce((sum, day) => sum + day.totalTasks, 0),
            completedTasks: last30Days.reduce((sum, day) => sum + day.tasksCompleted, 0),
            totalTime: last30Days.reduce((sum, day) => sum + day.totalTimeSpent, 0),
            averageCompletionRate: last30Days.length > 0
                ? Math.round(last30Days.reduce((sum, day) => sum + day.completionRate, 0) / last30Days.length)
                : 0
        }
    })

    const productiveDays = computed(() =>
        history.value.filter(day => day.completionRate >= 70).length
    )

    const averageTasksPerDay = computed(() => {
        if (history.value.length === 0) return 0
        const totalTasks = history.value.reduce((sum, day) => sum + day.totalTasks, 0)
        return Math.round(totalTasks / history.value.length)
    })

    // Actions
    const loadHistory = () => {
        const saved = localStorage.getItem('taskHistory')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Validate and sanitize data
                history.value = Array.isArray(parsed) ? parsed.map(day => ({
                    date: day.date || new Date().toDateString(),
                    tasksCompleted: day.tasksCompleted || 0,
                    totalTasks: day.totalTasks || 0,
                    totalTimeSpent: day.totalTimeSpent || 0,
                    completionRate: day.completionRate || 0,
                    tasks: Array.isArray(day.tasks) ? day.tasks : []
                })) : []
            } catch (error) {
                console.error('Error loading history:', error)
                history.value = []
            }
        }

        const savedTasks = localStorage.getItem('completedTasks')
        if (savedTasks) {
            try {
                completedTasks.value = JSON.parse(savedTasks, (key, value) => {
                    if (key === 'createdAt' || key === 'completedAt') {
                        return value ? new Date(value) : undefined
                    }
                    return value
                })
            } catch (error) {
                console.error('Error loading completed tasks:', error)
                completedTasks.value = []
            }
        }
    }

    const addToHistory = (dayStats: DailyStats, tasks: Task[]) => {
        const dateStr = dayStats.date

        // Check if entry for this date already exists
        const existingIndex = history.value.findIndex(h => h.date === dateStr)

        const historyEntry: DailyHistory = {
            ...dayStats,
            tasks: tasks.filter(t => t.completed) // Only store completed tasks
        }

        if (existingIndex >= 0) {
            // Update existing entry
            history.value[existingIndex] = historyEntry
        } else {
            // Add new entry
            history.value.push(historyEntry)
        }

        // Sort history by date (oldest to newest)
        history.value.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Keep only last 365 days
        if (history.value.length > 365) {
            history.value = history.value.slice(-365)
        }

        saveHistory()
    }

    const addCompletedTask = (task: Task) => {
        // Ensure task has completedAt date
        const completedTask = {
            ...task,
            completedAt: task.completedAt || new Date()
        }

        // Update completedTasks list
        const existingIndex = completedTasks.value.findIndex(t => t.id === task.id)
        if (existingIndex >= 0) {
            completedTasks.value[existingIndex] = completedTask
        } else {
            completedTasks.value.unshift(completedTask)
        }

        // Keep only last 500 completed tasks
        if (completedTasks.value.length > 500) {
            completedTasks.value = completedTasks.value.slice(0, 500)
        }

        // Save completed tasks to localStorage
        saveCompletedTasks()

        // --- Update daily history ---
        const dateStr = completedTask.completedAt!.toDateString()

        const existingDay = history.value.find(h => h.date === dateStr)

        if (existingDay) {
            // Merge task into existing day
            existingDay.tasksCompleted += 1
            existingDay.totalTasks += 1
            existingDay.totalTimeSpent += completedTask.timeSpent || 0
            existingDay.completionRate = Math.round(
                (existingDay.tasksCompleted / existingDay.totalTasks) * 100
            )
            existingDay.tasks.push(completedTask)
        } else {
            // Create new day entry
            const dayStats: DailyHistory = {
                date: dateStr,
                tasksCompleted: 1,
                totalTasks: 1,
                totalTimeSpent: completedTask.timeSpent || 0,
                completionRate: 100,
                tasks: [completedTask]
            }
            history.value.push(dayStats)
        }

        // Keep history sorted by date (oldest → newest) and limit 365 days
        history.value.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        if (history.value.length > 365) {
            history.value = history.value.slice(-365)
        }

        // Save updated history
        saveHistory()
    }


    const removeCompletedTask = (taskId: string) => {
        completedTasks.value = completedTasks.value.filter(t => t.id !== taskId)
        saveCompletedTasks()
    }

    const clearHistory = () => {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            history.value = []
            completedTasks.value = []
            localStorage.removeItem('taskHistory')
            localStorage.removeItem('completedTasks')
        }
    }

    const clearOldHistory = (daysToKeep: number = 90) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

        history.value = history.value.filter(day =>
            new Date(day.date).getTime() >= cutoffDate.getTime()
        )

        completedTasks.value = completedTasks.value.filter(task => {
            const completedDate = task.completedAt ? new Date(task.completedAt) : new Date()
            return completedDate.getTime() >= cutoffDate.getTime()
        })

        saveHistory()
        saveCompletedTasks()
    }

    const getHistoryByDateRange = (startDate: Date, endDate: Date) => {
        return history.value.filter(day => {
            const dayDate = new Date(day.date)
            return dayDate >= startDate && dayDate <= endDate
        })
    }

    const exportData = (format: 'csv' | 'json') => {
        const data = {
            history: history.value,
            completedTasks: completedTasks.value,
            exportDate: new Date().toISOString(),
            stats: {
                totalCompletedTasks: totalCompletedTasks.value,
                averageCompletionRate: averageCompletionRate.value,
                totalFocusTime: totalFocusTime.value,
                currentStreak: currentStreak.value,
                bestStreak: bestStreak.value
            }
        }

        const timestamp = new Date().toISOString().split('T')[0]

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `daily-focus-export-${timestamp}.json`
            a.click()
            URL.revokeObjectURL(url)
        } else if (format === 'csv') {
            // Export history as CSV
            let csvContent = 'Date,Total Tasks,Completed Tasks,Completion Rate (%),Total Time (minutes)\n'

            history.value.forEach(day => {
                const timeInMinutes = Math.round(day.totalTimeSpent / 60)
                csvContent += `${day.date},${day.totalTasks},${day.tasksCompleted},${day.completionRate},${timeInMinutes}\n`
            })

            // Export completed tasks as separate CSV
            let tasksCSV = 'Task Title,Description,Priority,Time Spent (minutes),Completed Date\n'

            completedTasks.value.forEach(task => {
                const timeInMinutes = Math.round(task.timeSpent / 60)
                const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'
                const title = `"${task.title.replace(/"/g, '""')}"` // Escape quotes
                const description = `"${(task.description || '').replace(/"/g, '""')}"`

                tasksCSV += `${title},${description},${task.priority},${timeInMinutes},${completedDate}\n`
            })

            // Create ZIP-like download with both CSVs
            // For simplicity, we'll download history CSV
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `daily-focus-history-${timestamp}.csv`
            a.click()
            URL.revokeObjectURL(url)

            // Download tasks CSV separately
            setTimeout(() => {
                const blob2 = new Blob([tasksCSV], { type: 'text/csv' })
                const url2 = URL.createObjectURL(blob2)
                const a2 = document.createElement('a')
                a2.href = url2
                a2.download = `daily-focus-tasks-${timestamp}.csv`
                a2.click()
                URL.revokeObjectURL(url2)
            }, 100)
        }
    }

    const importData = (jsonData: string) => {
        try {
            const data = JSON.parse(jsonData)

            if (data.history && Array.isArray(data.history)) {
                history.value = data.history
                saveHistory()
            }

            if (data.completedTasks && Array.isArray(data.completedTasks)) {
                completedTasks.value = data.completedTasks.map((task: any) => ({
                    ...task,
                    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                    completedAt: task.completedAt ? new Date(task.completedAt) : undefined
                }))
                saveCompletedTasks()
            }

            return true
        } catch (error) {
            console.error('Error importing data:', error)
            return false
        }
    }

    // Private save functions
    const saveHistory = () => {
        localStorage.setItem('taskHistory', JSON.stringify(history.value))
    }

    const saveCompletedTasks = () => {
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks.value))
    }

    // Initialize on creation
    loadHistory()

    return {
        // State
        history,
        completedTasks,

        // Computed
        totalCompletedTasks,
        averageCompletionRate,
        totalFocusTime,
        currentStreak,
        bestStreak,
        weeklyStats,
        monthlyStats,
        productiveDays,
        averageTasksPerDay,

        // Actions
        loadHistory,
        addToHistory,
        addCompletedTask,
        removeCompletedTask,
        clearHistory,
        clearOldHistory,
        getHistoryByDateRange,
        exportData,
        importData,
        saveHistory
    }
})
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Task } from '../types'
import { useHistoryStore } from '@/stores/history'

const historyStore = useHistoryStore()

/* --------------------
   Store bindings
-------------------- */

// Raw history (daily stats)
const history = computed(() => historyStore.history)

console.log('History data:', history.value);

// Last 7 days for the bar chart
const monthlyHistory = computed(() => {
    return history.value.slice(-7).map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        completedTasks: day.tasksCompleted,
        totalTasks: day.totalTasks,
        completionRate: Math.round(day.completionRate)
    }));
});

// Completed tasks list
const completedTasks = computed<Task[]>(() => historyStore.completedTasks)

// Statistics
const totalCompletedTasks = computed(() => historyStore.totalCompletedTasks)
const averageCompletionRate = computed(() => historyStore.averageCompletionRate)
const totalFocusTime = computed(() => historyStore.totalFocusTime)
const currentStreak = computed(() => historyStore.currentStreak)
const bestStreak = computed(() => historyStore.bestStreak)

/* --------------------
   Helpers
-------------------- */
const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

const formatSeconds = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}

const formatTime = (seconds: number) => formatSeconds(seconds)

/* --------------------
   Actions
-------------------- */
const exportData = (format: 'csv' | 'json') => {
    historyStore.exportData(format)
}

const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        historyStore.clearHistory()
    }
}

/* --------------------
   Init
-------------------- */
onMounted(() => {
    historyStore.loadHistory()
})
</script>

<template>
    <div class="max-w-6xl mx-auto">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Task History</h1>
            <p class="text-gray-600 dark:text-gray-300">
                Track your productivity and completion trends over time
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Stats Overview -->
            <div class="lg:col-span-2 space-y-8">
                <div class="card mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                        Completion History
                    </h2>

                    <div v-if="monthlyHistory.length === 0" class="text-center py-8">
                        <p class="text-gray-500 dark:text-gray-400 mt-2">No history available</p>
                    </div>
                    <div v-else class="h-64 flex items-end space-x-1">

                        <div v-for="(day, index) in monthlyHistory" :key="index"
                            class="flex-1 flex flex-col items-center group relative">
                            <div class="w-full rounded-t-lg transition-all duration-300 hover:opacity-80" :class="day.completionRate >= 75
                                ? 'bg-green-500'
                                : day.completionRate >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'" :style="{ height: `${day.completionRate}%` }">
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ day.date }}</div>

                            <div
                                class="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white dark:bg-gray-700 text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                {{ day.completionRate }}% completed<br>
                                {{ day.completedTasks }}/{{ day.totalTasks }} tasks
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Completed Tasks -->
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                        Recently Completed Tasks
                    </h2>
                    <div v-if="completedTasks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        No completed tasks yet
                    </div>
                    <div v-else class="space-y-4">
                        <div v-for="task in completedTasks" :key="task.id"
                            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-semibold text-gray-800 dark:text-white">{{ task.title }}</h3>
                                <span class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ formatDate(task.completedAt!) }}
                                </span>
                            </div>
                            <p v-if="task.description" class="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                {{ task.description }}
                            </p>
                            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Time spent: {{ formatSeconds(task.timeSpent) }}</span>
                                <span
                                    class="px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs">
                                    Completed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistics -->
            <div class="space-y-8">
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Statistics</h2>
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <div class="text-gray-600 dark:text-gray-300">Total Tasks Completed</div>
                            <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ totalCompletedTasks }}
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="text-gray-600 dark:text-gray-300">Average Completion Rate</div>
                            <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ averageCompletionRate }}%
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="text-gray-600 dark:text-gray-300">Total Focus Time</div>
                            <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ formatTime(totalFocusTime)
                            }}</div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="text-gray-600 dark:text-gray-300">Current Streak</div>
                            <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ currentStreak }} days
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="text-gray-600 dark:text-gray-300">Best Streak</div>
                            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ bestStreak }} days
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Export Data</h2>
                    <div class="space-y-3">
                        <button @click="exportData('csv')"
                            class="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                            <span>Export as CSV</span>
                            <span>📥</span>
                        </button>
                        <button @click="exportData('json')"
                            class="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                            <span>Export as JSON</span>
                            <span>📥</span>
                        </button>
                        <button @click="clearHistory"
                            class="w-full py-3 bg-red-50 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-100 dark:hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                            <span>Clear History</span>
                            <span>🗑</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

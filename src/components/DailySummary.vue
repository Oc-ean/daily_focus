<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    completedTasks: number
    totalTasks: number
    totalTimeSpent: number
    averageTimePerTask: number
    streak: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'view-details': []
}>()

const formattedDate = computed(() => {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    })
})

const stats = computed(() => [
    {
        label: 'Completion Rate',
        description: 'Tasks completed today',
        value: `${Math.round((props.completedTasks / props.totalTasks) * 100) || 0}%`,
        icon: '✓',
        color: 'bg-green-100 text-green-600'
    },
    {
        label: 'Total Focus Time',
        description: 'Time spent on tasks',
        value: formatTime(props.totalTimeSpent),
        icon: '⏱',
        color: 'bg-blue-100 text-blue-600'
    },
    {
        label: 'Avg. per Task',
        description: 'Average time spent per task',
        value: formatTime(props.averageTimePerTask),
        icon: '📈',
        color: 'bg-purple-100 text-purple-600'
    },
    {
        label: 'Current Streak',
        description: 'Consecutive productive days',
        value: `${props.streak} days`,
        icon: '🔥',
        color: 'bg-orange-100 text-orange-600'
    }
])

const weeklyData = computed(() => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
        label: day,
        value: Math.min(80, Math.max(20, Math.random() * 100)),
        color: index === 3 ? 'bg-indigo-500' : 'bg-gray-300'
    }))
})

const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)

    if (hrs > 0) {
        return `${hrs}h ${mins}m`
    }
    return `${mins}m`
}
</script>

<template>
    <div class="card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Daily Summary</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ formattedDate }}</p>
            </div>
            <div
                class="w-10 h-10 bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-indigo-200 rounded-lg flex items-center justify-center">
                📊
            </div>
        </div>

        <!-- Stats -->
        <div class="space-y-4">
            <div v-for="stat in stats" :key="stat.label"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="stat.color">
                        <span class="text-lg">{{ stat.icon }}</span>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-300">{{ stat.label }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ stat.description }}</div>
                    </div>
                </div>
                <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ stat.value }}</div>
            </div>
        </div>

        <!-- Weekly Trend -->
        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Weekly Progress</h4>
            <div class="h-32 flex items-end space-x-2">
                <div v-for="day in weeklyData" :key="day.label" class="flex-1 flex flex-col items-center">
                    <div class="w-full rounded-t-lg transition-all duration-300 hover:opacity-80" :class="day.color"
                        :style="{ height: `${day.value}%` }"></div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ day.label }}</div>
                </div>
            </div>
        </div>

        <!-- View Details Button -->
        <button @click="emit('view-details')"
            class="mt-6 w-full py-3 bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
            <span>View Detailed History</span>
            <span>→</span>
        </button>

    </div>
</template>

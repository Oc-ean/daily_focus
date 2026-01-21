<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    completedTasks: number
    totalTasks: number
    totalTime: number
    maxTime?: number
}

const props = withDefaults(defineProps<Props>(), {
    maxTime: 28800
})

const progress = computed(() => {
    if (props.totalTasks === 0) return 0
    return Math.round((props.completedTasks / props.totalTasks) * 100)
})

const pendingTasks = computed(() => {
    return props.totalTasks - props.completedTasks
})

const timePercentage = computed(() => {
    return Math.min(Math.round((props.totalTime / props.maxTime) * 100), 100)
})

const progressColor = computed(() => {
    if (progress.value >= 75) return 'text-green-600'
    if (progress.value >= 50) return 'text-yellow-600'
    if (progress.value >= 25) return 'text-orange-600'
    return 'text-red-600'
})

const progressBarClass = computed(() => {
    if (progress.value >= 75) return 'bg-green-500'
    if (progress.value >= 50) return 'bg-yellow-500'
    if (progress.value >= 25) return 'bg-orange-500'
    return 'bg-red-500'
})

const motivationalMessage = computed(() => {
    if (progress.value === 0) return 'Start your day strong! Focus on your first task.'
    if (progress.value < 25) return 'Great start! Keep the momentum going.'
    if (progress.value < 50) return 'You\'re making progress! Every task counts.'
    if (progress.value < 75) return 'Over halfway there! You can do this.'
    if (progress.value < 100) return 'Almost done! Finish strong.'
    return 'Amazing! You completed all your tasks for today!'
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
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Daily Progress</h3>
            <span class="text-2xl font-bold" :class="progressColor">
                {{ progress }}%
            </span>
        </div>

        <!-- Completion Bar -->
        <div class="mb-2">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Completion</span>
                <span>{{ completedTasks }} of {{ totalTasks }} tasks</span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500 ease-out" :class="progressBarClass"
                    :style="{ width: `${progress}%` }"></div>
            </div>
        </div>

        <!-- Time Spent -->
        <div class="mt-4">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Time Spent Today</span>
                <span>{{ formatTime(totalTime) }}</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500 ease-out"
                    :style="{ width: `${timePercentage}%` }"></div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="mt-6 grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ completedTasks }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Completed</div>
            </div>
            <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ pendingTasks }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Pending</div>
            </div>
        </div>

        <!-- Motivational Message -->
        <div class="mt-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-200 text-center">
                {{ motivationalMessage }}
            </p>
        </div>

    </div>
</template>

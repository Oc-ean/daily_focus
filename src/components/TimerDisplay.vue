<script setup lang="ts">
import { computed, ref, watch, onUnmounted, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'

const taskStore = useTaskStore()

const activeTask = computed(() => {
    if (selectedTaskId.value) {
        return taskStore.tasks.find(t => t.id === selectedTaskId.value) || null
    }
    return null
})
const availableTasks = computed(() =>
    taskStore.tasks.filter(t => !t.completed)
)

const timeRemaining = ref(0)

let intervalId: number | null = null
const updateTimeRemaining = () => {
    timeRemaining.value = taskStore.getTaskTimeRemaining(selectedTaskId.value!)
}

onMounted(() => {
    updateTimeRemaining()
    intervalId = setInterval(updateTimeRemaining, 1000) as unknown as number
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})

const isRunning = computed(() => {
    if (!selectedTaskId.value) return false
    return taskStore.isTaskTimerRunning(selectedTaskId.value)
})
const selectedTaskId = ref<string | null>(null)

watch(() => taskStore.timer.activeTaskId, (newTaskId) => {
    if (newTaskId && newTaskId !== selectedTaskId.value) {
        selectedTaskId.value = newTaskId
    }
})

const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})



const progressPercentage = computed(() => {
    if (!activeTask.value) return 0
    const total = activeTask.value.estimatedTime || 1500
    return ((total - timeRemaining.value) / total) * 100
})

const startTimer = () => {
    if (selectedTaskId.value) {
        taskStore.startTaskTimer(selectedTaskId.value)
    }
}

const pauseTimer = () => {
    if (selectedTaskId.value) {
        taskStore.stopTaskTimer(selectedTaskId.value)
    }
}
const resetTimer = () => {
    if (selectedTaskId.value) {
        taskStore.stopTaskTimer(selectedTaskId.value)
        const task = taskStore.tasks.find(t => t.id === selectedTaskId.value)
        if (task) {
            task.estimatedTime = 1500
        }
    }
}
const setDuration = (minutes: number) => {
    if (selectedTaskId.value) {
        const task = taskStore.tasks.find(t => t.id === selectedTaskId.value)
        if (task) {
            taskStore.stopTaskTimer(selectedTaskId.value)
            task.estimatedTime = minutes * 60
            taskStore.saveToStorage()
        }
    }
}

const selectTask = (taskId: string) => {
    selectedTaskId.value = taskId
    taskStore.timer.activeTaskId = taskId
}

// Expose method to parent
const setSelectedTask = (taskId: string) => {
    selectedTaskId.value = taskId
}

defineExpose({
    setSelectedTask
})
</script>

<template>
    <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white">Focus Timer</h2>
            <div class="flex items-center gap-2">
                <span v-if="isRunning" class="flex items-center gap-1 text-sm">
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live
                </span>
            </div>
        </div>

        <div class="mb-4">
            <select v-model="selectedTaskId" @change="selectTask(selectedTaskId!)" class="w-full px-4 py-3 rounded-xl font-medium transition-all
           bg-white text-gray-800 border border-gray-300
           focus:outline-none focus:ring-2 focus:ring-indigo-500

           dark:bg-gray-800 dark:text-white dark:border-gray-700
           dark:focus:ring-indigo-400" :class="!selectedTaskId ? 'text-gray-400 dark:text-gray-400' : ''">
                <option :value="null" disabled class="bg-white text-gray-400
             dark:bg-gray-800 dark:text-gray-400">
                    Select a task to focus on...
                </option>

                <option v-for="task in availableTasks" :key="task.id" :value="task.id" class="bg-white text-gray-800
             dark:bg-gray-800 dark:text-white">
                    {{ task.title }}
                </option>
            </select>
        </div>


        <!-- Active Task Display -->
        <div v-if="activeTask" class="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Working on:</p>
            <p class="font-medium text-gray-800 dark:text-white truncate">{{ activeTask.title }}</p>

        </div>

        <!-- Timer Display -->
        <div class="relative mb-6">
            <!-- Circular Progress -->
            <div class="relative w-48 h-48 mx-auto">
                <svg class="transform -rotate-90 w-48 h-48">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" class="text-gray-200 dark:text-gray-700"
                        stroke-width="8" fill="none" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor"
                        :class="isRunning ? 'text-indigo-600' : 'text-gray-400'" stroke-width="8" fill="none"
                        :stroke-dasharray="`${2 * Math.PI * 88}`"
                        :stroke-dashoffset="`${2 * Math.PI * 88 * (1 - progressPercentage / 100)}`"
                        class="transition-all duration-1000" />
                </svg>

                <!-- Time Display -->
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                        <div class="text-4xl font-bold text-gray-800 dark:text-white tabular-nums">
                            {{ formattedTime }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {{ isRunning ? 'Focus Time' : 'Paused' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Timer Controls -->
        <div class="flex items-center justify-center gap-3 mb-4">
            <button v-if="!isRunning" @click="startTimer"
                class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
                Start
            </button>

            <button v-else @click="pauseTimer"
                class="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
            </button>

            <button @click="resetTimer"
                class="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                title="Reset Timer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>

        <!-- Preset Durations -->
        <div class="border-t border-white/20 pt-4">
            <p class="text-sm opacity-90 mb-3 text-center">Quick Duration Presets</p>
            <div class="grid grid-cols-3 gap-2">
                <button @click="setDuration(5)" :disabled="!activeTask"
                    class="py-3 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    5m
                </button>
                <button @click="setDuration(15)" :disabled="!activeTask"
                    class="py-3 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    15m
                </button>
                <button @click="setDuration(25)" :disabled="!activeTask"
                    class="py-3 px-3 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    25m ⭐
                </button>
                <button @click="setDuration(30)" :disabled="!activeTask"
                    class="py-3 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    30m
                </button>
                <button @click="setDuration(45)" :disabled="!activeTask"
                    class="py-3 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    45m
                </button>

            </div>
        </div>

        <!-- Task Selection Hint -->
        <div v-if="!activeTask" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-blue-700 dark:text-blue-300">
                💡 Tip: Click the timer icon on a task to link it to the focus timer
            </p>
        </div>
    </div>
</template>

<style scoped>
.tabular-nums {
    font-variant-numeric: tabular-nums;
}
</style>
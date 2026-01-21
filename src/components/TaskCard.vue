<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Task } from '../types'
import { useTaskStore } from '@/stores/task'

const props = defineProps<{
    task: Task
    activeTimerId?: string | null
}>()

const emit = defineEmits<{
    'update:task': [task: Task]
    delete: [taskId: string]
    'toggle-timer': [taskId: string]
    'select-task': [taskId: string]

}>()

const taskStore = useTaskStore()
const isEditing = ref(false)
const editTitle = ref(props.task.title)
const editDescription = ref(props.task.description)
const showDurationPicker = ref(false)
const customDuration = ref(25)

const isTimerRunning = computed(() => taskStore.isTaskTimerRunning(props.task.id))
const timeRemaining = ref(0)

let intervalId: number | null = null

const updateTimeRemaining = () => {
    timeRemaining.value = taskStore.getTaskTimeRemaining(props.task.id)
}

onMounted(() => {
    updateTimeRemaining()
    intervalId = setInterval(updateTimeRemaining, 1000) as unknown as number
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
})

const formattedTimeRemaining = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const timerProgress = computed(() => {
    if (props.task.estimatedTime === 0) return 0
    return ((props.task.estimatedTime - timeRemaining.value) / props.task.estimatedTime) * 100
})

const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    high: 'bg-red-100 text-red-700 border-red-300'
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
}

const toggleComplete = () => {
    taskStore.toggleTaskCompletion(props.task.id)
}

const startEdit = () => {
    isEditing.value = true
    editTitle.value = props.task.title
    editDescription.value = props.task.description
}

const saveEdit = () => {
    if (editTitle.value.trim()) {
        emit('update:task', {
            ...props.task,
            title: editTitle.value,
            description: editDescription.value
        })
        isEditing.value = false
    }
}

const cancelEdit = () => {
    isEditing.value = false
    editTitle.value = props.task.title
    editDescription.value = props.task.description
}

const deleteTask = () => {
    emit('delete', props.task.id)

}

const toggleTimer = () => {
    emit('toggle-timer', props.task.id)
}

const startTimerWithDuration = (minutes: number) => {
    taskStore.toggleTaskTimer(props.task.id, minutes * 60)
    showDurationPicker.value = false
}

const selectTask = () => {
    emit('select-task', props.task.id)
}

const quickStartTimer = (minutes: number) => {
    taskStore.startTaskTimer(props.task.id, minutes * 60)
}
</script>

<template>
    <div class="card bg-white dark:bg-gray-800 p-4 rounded-lg border-2 transition-all" :class="[
        task.completed ? 'border-green-200 dark:border-green-800 opacity-75' : 'border-gray-200 dark:border-gray-700',
        isTimerRunning ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
    ]">
        <!-- Edit Mode -->
        <div v-if="isEditing" class="space-y-3">
            <input v-model="editTitle" type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Task title" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
            <textarea v-model="editDescription"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg h-20 dark:bg-gray-700 dark:text-white"
                placeholder="Description" />
            <div class="flex gap-2">
                <button @click="saveEdit" class="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm">
                    Save
                </button>
                <button @click="cancelEdit"
                    class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                    Cancel
                </button>
            </div>
        </div>

        <!-- View Mode -->
        <div v-else>
            <div class="flex items-start gap-3">
                <!-- Checkbox -->
                <button @click="toggleComplete" class="flex-shrink-0 mt-1 w-5 h-5 rounded border-2 transition-colors"
                    :class="task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'">
                    <svg v-if="task.completed" class="w-full h-full text-white" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                </button>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <h3 class="text-base font-semibold text-gray-800 dark:text-white"
                            :class="task.completed ? 'line-through text-gray-500' : ''">
                            {{ task.title }}
                        </h3>

                        <!-- Priority Badge -->
                        <span class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full border"
                            :class="priorityColors[task.priority]">
                            {{ task.priority }}
                        </span>
                    </div>

                    <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3"
                        :class="task.completed ? 'line-through' : ''">
                        {{ task.description }}
                    </p>

                    <!-- Timer Progress Bar (when timer is running) -->
                    <div v-if="isTimerRunning" class="mb-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                ⏱️ {{ formattedTimeRemaining }} remaining
                            </span>
                            <span class="text-xs text-gray-500">
                                {{ Math.round(timerProgress) }}%
                            </span>
                        </div>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                                :style="{ width: `${timerProgress}%` }"></div>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ formatTime(task.timeSpent) }} spent
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ formatTime(task.estimatedTime) }} estimated
                        </span>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 flex-wrap" @click.stop>
                        <!-- Timer Button with Dropdown -->
                        <div class="relative">
                            <button v-if="!isTimerRunning" @click="showDurationPicker = !showDurationPicker"
                                :disabled="task.completed"
                                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                                :class="task.completed
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md'">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Start Timer
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clip-rule="evenodd" />
                                </svg>
                            </button>

                            <button v-else @click="toggleTimer"
                                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-md hover:scale-105">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                                Pause Timer
                            </button>

                            <!-- Duration Picker Dropdown -->
                            <div v-if="showDurationPicker && !task.completed"
                                class="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-10 min-w-[200px]">
                                <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Select Duration</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <button @click="startTimerWithDuration(5)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors">
                                        5 min
                                    </button>
                                    <button @click="startTimerWithDuration(10)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors">
                                        10 min
                                    </button>
                                    <button @click="startTimerWithDuration(15)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors">
                                        15 min
                                    </button>
                                    <button @click="startTimerWithDuration(25)"
                                        class="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                                        25 min
                                    </button>
                                    <button @click="startTimerWithDuration(30)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors">
                                        30 min
                                    </button>
                                    <button @click="startTimerWithDuration(45)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-900/30 rounded-lg text-sm font-medium transition-colors">
                                        45 min
                                    </button>
                                </div>
                                <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div class="flex gap-2">
                                        <input v-model.number="customDuration" type="number" min="1" max="120"
                                            class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                            placeholder="Custom" />
                                        <button @click="startTimerWithDuration(customDuration)"
                                            class="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm font-medium transition-colors">
                                            Start
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button @click="startEdit"
                            class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Edit task">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>

                        <button @click="deleteTask"
                            class="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                            title="Delete task">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-through {
    text-decoration: line-through;
}
</style>
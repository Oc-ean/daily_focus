<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TaskCard from '../components/TaskCard.vue'
import ProgressBar from '../components/ProgressBar.vue'
import TimerDisplay from '../components/TimerDisplay.vue'
import DailySummary from '../components/DailySummary.vue'
import type { Priority, Task } from '../types'
import { useTaskStore } from '@/stores/task'
import { useHistoryStore } from '@/stores/history'
import Dialog from '@/components/Dialog.vue'


const router = useRouter()
const taskStore = useTaskStore()
const historyStore = useHistoryStore()

const newTaskTitle = ref('')
const newTaskDescription = ref('')
const newTaskPriority = ref<Priority>('medium')
const showAddTask = ref(false)
const deleteTaskPopUp = ref(false)
const currentTaskIdToDelete = ref<string | null>(null)
const activeTab = ref<'tasks' | 'stats'>('tasks')

const priorities = ['low', 'medium', 'high'] as const
const timerRef = ref<InstanceType<typeof TimerDisplay> | null>(null)

const tasks = computed(() => taskStore.tasks)
const sortedTasks = computed(() => taskStore.sortedTasks)
const completedTasks = computed(() => taskStore.completedTasks)
const totalTimeSpent = computed(() => taskStore.totalTimeSpent)
const averageTimePerTask = computed(() => taskStore.averageTimePerTask)
const activeTimerId = computed(() => taskStore.timer.activeTaskId)
const currentStreak = computed(() => historyStore.currentStreak ?? 0)
const isMobile = ref(window.innerWidth < 768)

const priorityButtonClasses: Record<Priority, string> = {
    low: 'bg-gray-600 text-white',
    medium: 'bg-yellow-600 text-white',
    high: 'bg-red-600 text-white'
}

const addTask = () => {
    if (!newTaskTitle.value.trim()) return

    taskStore.addTask(
        newTaskTitle.value,
        newTaskDescription.value,
        newTaskPriority.value
    )

    newTaskTitle.value = ''
    newTaskDescription.value = ''
    newTaskPriority.value = 'medium'
    showAddTask.value = false
}

const updateTask = (task: Task) => {
    taskStore.updateTask(task)
}

const showDeleteConfirmation = (taskId: string) => {
    currentTaskIdToDelete.value = taskId
    deleteTaskPopUp.value = true
}

const deleteTask = (taskId: string) => {

    taskStore.deleteTask(taskId)
    deleteTaskPopUp.value = false

}

const toggleTaskTimer = (taskId: string) => {
    taskStore.toggleTimer(taskId)
}

const handleTimerComplete = () => {
    // handled inside store
}

const viewHistory = () => {
    router.push('/history')
}



const handleResize = () => { isMobile.value = window.innerWidth < 768 }

onMounted(() => {
    taskStore.initialize()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => { window.removeEventListener('resize', handleResize) })
</script>


<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
        <!-- Mobile Header -->
        <div v-if="isMobile" class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 md:relative">
            <div class="px-4 py-4 md:px-6">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Daily Focus</h1>
                        <p class="text-xs md:text-sm text-gray-500 mt-1">{{ tasks.length }} tasks • {{ completedTasks }}
                            done</p>
                    </div>
                    <button @click="viewHistory"
                        class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>

                <!-- Mobile Tabs -->
                <div class="flex gap-2 md:hidden">
                    <button @click="activeTab = 'tasks'"
                        class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                        :class="activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
                        Tasks
                    </button>
                    <button @click="activeTab = 'stats'"
                        class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                        :class="activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
                        Stats
                    </button>
                </div>
            </div>

            <!-- Progress Bar - Always visible on mobile -->
            <div class="px-4 pb-4 md:hidden" v-show="activeTab === 'tasks'">
                <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                        <span class="text-sm font-bold text-indigo-600">{{ tasks.length > 0 ? Math.round((completedTasks
                            / tasks.length) * 100) : 0 }}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            :style="{ width: tasks.length > 0 ? `${(completedTasks / tasks.length) * 100}%` : '0%' }">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Desktop Layout -->
        <div class="hidden md:block max-w-7xl mx-auto px-6 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-6">
                    <!-- Add Task Card -->
                    <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add New Task</h2>
                        <div class="space-y-4">
                            <input v-model="newTaskTitle" type="text"
                                class="input-field  dark:bg-transparent dark:text-white"
                                placeholder="What's your most important task?" @keyup.enter="addTask" />
                            <textarea v-model="newTaskDescription"
                                class="input-field h-24 dark:bg-transparent dark:text-white"
                                placeholder="Description (optional)" />
                            <div class="flex items-center justify-between">
                                <div class="flex space-x-2">
                                    <button v-for="priority in priorities" :key="priority"
                                        @click="newTaskPriority = priority"
                                        class="px-4 py-2 rounded-lg transition-colors"
                                        :class="newTaskPriority === priority ? priorityButtonClasses[priority] : 'bg-gray-100 text-gray-600'">
                                        {{ priority.charAt(0).toUpperCase() + priority.slice(1) }}
                                    </button>
                                </div>
                                <button @click="addTask" class="btn-primary" :disabled="!newTaskTitle.trim()">
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks List -->
                    <div>
                        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
                            <!-- Heading: always visible -->
                            <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-2 lg:mb-0">
                                Today's Tasks
                            </h2>

                            <!-- Task count: hidden on mobile, visible on lg -->
                            <p class="text-xs md:text-sm text-gray-500 mt-1 lg:mt-0 lg:block hidden">
                                {{ tasks.length }} tasks • {{ completedTasks }} done
                            </p>
                        </div>

                        <div v-if="tasks.length === 0" class="card text-center py-12 dark:bg-gray-800">
                            <div class="text-gray-400 mb-4 text-6xl">📝</div>
                            <h3 class="text-lg font-semibold text-gray-600  mb-2">No tasks yet</h3>
                            <p class="text-gray-500">Add your first task to get started!</p>
                        </div>
                        <div v-else class="space-y-4">
                            <TaskCard v-for="task in sortedTasks" :key="task.id" :task="task"
                                :active-timer-id="activeTimerId" @update:task="updateTask"
                                @delete="showDeleteConfirmation(task.id)" @toggle-timer="toggleTaskTimer" />
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <ProgressBar :completed-tasks="completedTasks" :total-tasks="tasks.length"
                        :total-time="totalTimeSpent" />
                    <!-- <TimerDisplay ref="timerRef" @time-up="handleTimerComplete" /> -->
                    <DailySummary :completed-tasks="completedTasks" :total-tasks="tasks.length"
                        :total-time-spent="totalTimeSpent" :average-time-per-task="averageTimePerTask"
                        :streak="currentStreak" @view-details="viewHistory" />
                </div>
            </div>
        </div>

        <!-- Mobile Content -->
        <div class="md:hidden px-4 pt-4">
            <!-- Tasks Tab -->
            <div v-show="activeTab === 'tasks'" class="space-y-4">
                <!-- MIT Banner -->
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="font-bold text-lg mb-1">Focus on 3 MITs</h3>
                            <p class="text-sm opacity-90">Complete your Most Important Tasks first</p>
                        </div>
                        <div class="text-3xl">🎯</div>
                    </div>
                </div>

                <!-- Tasks List -->
                <div v-if="tasks.length === 0" class="text-center py-16">
                    <div class="text-gray-400 mb-4 text-6xl">📝</div>
                    <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No tasks yet</h3>
                    <p class="text-gray-500 dark:text-gray-400 mb-6">Add your first task to get started!</p>
                    <button @click="showAddTask = true" class="btn-primary">
                        + Add Your First Task
                    </button>
                </div>

                <div v-else class="space-y-3 pb-4">
                    <TaskCard v-for="task in sortedTasks" :key="task.id" :task="task" :active-timer-id="activeTimerId"
                        @update:task="updateTask" @delete="showDeleteConfirmation(task.id)"
                        @toggle-timer="toggleTaskTimer" />
                </div>
            </div>

            <!-- Stats Tab -->
            <div v-show="activeTab === 'stats'" class="space-y-4 pb-4">
                <ProgressBar :completed-tasks="completedTasks" :total-tasks="tasks.length"
                    :total-time="totalTimeSpent" />
                <!-- <TimerDisplay ref="timerRef" /> -->
                <DailySummary :completed-tasks="completedTasks" :total-tasks="tasks.length"
                    :total-time-spent="totalTimeSpent" :average-time-per-task="averageTimePerTask"
                    :streak="currentStreak" @view-details="viewHistory" />
            </div>
        </div>

        <!-- Mobile FAB -->
        <button v-show="activeTab === 'tasks'" @click="showAddTask = true"
            class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
        </button>

        <!-- Mobile Add Task Modal -->
        <div v-if="showAddTask" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
            @click.self="showAddTask = false">
            <div class="bg-white dark:bg-gray-800 rounded-t-3xl w-full p-6 animate-slide-up">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Add New Task</h2>
                    <button @click="showAddTask = false" class="p-2 text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <input v-model="newTaskTitle" type="text"
                        class="input-field text-base dark:bg-transparent dark:text-white"
                        placeholder="What's your task?" @keyup.enter="addTask" autofocus />
                    <textarea v-model="newTaskDescription"
                        class="input-field h-24 text-base dark:bg-transparent dark:text-white"
                        placeholder="Add description (optional)" />

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button v-for="priority in priorities" :key="priority" @click="newTaskPriority = priority"
                                class="py-3 rounded-xl font-medium transition-all active:scale-95"
                                :class="newTaskPriority === priority ? priorityButtonClasses[priority] : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
                                {{ priority.charAt(0).toUpperCase() + priority.slice(1) }}
                            </button>
                        </div>
                    </div>

                    <button @click="addTask" class="btn-primary w-full py-4 text-lg" :disabled="!newTaskTitle.trim()">
                        Add Task
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->

        <Dialog :show="deleteTaskPopUp" title="Delete Task?"
            description="Are you sure you want to delete this task? This action cannot be undone." actionText="Delete"
            :action="() => deleteTask(currentTaskIdToDelete!)" @close="deleteTaskPopUp = false" />
    </div>
</template>

<style scoped>
@keyframes slide-up {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

.animate-slide-up {
    animation: slide-up 0.3s ease-out;
}
</style>
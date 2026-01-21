<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore, onTimerComplete } from './stores/task'
import ToastNotifications from './components/ToastNotifications.vue'
import type { Task } from './types'

const taskStore = useTaskStore()
const toastRef = ref<InstanceType<typeof ToastNotifications> | null>(null)

onMounted(() => {
  taskStore.initialize()

  const unsubscribe = onTimerComplete((task?: Task | null) => {
    if (toastRef.value) {
      const taskTitle = task?.title || 'Focus session'

      toastRef.value.show({
        type: 'timer',
        title: '🎉 Timer Complete!',
        message: `Great work on "${taskTitle}"! Time for a break.`,
        duration: 8000,
        action: {
          label: 'Mark as Complete',
          onClick: () => {
            if (task && !task.completed) {
              taskStore.toggleTaskCompletion(task.id)

              // Show success notification
              toastRef.value?.show({
                type: 'success',
                title: 'Task Completed!',
                message: `"${task.title}" marked as done.`,
                duration: 3000
              })
            }
          }
        }
      })
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })
})

const showNotification = (
  type: 'success' | 'info' | 'warning' | 'error' | 'timer',
  title: string,
  message: string,
  duration = 5000
) => {
  toastRef.value?.show({
    type,
    title,
    message,
    duration
  })
}

const handleTaskDelete = (taskId: string) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  taskStore.deleteTask(taskId)

  if (task) {
    showNotification(
      'info',
      'Task Deleted',
      `"${task.title}" has been removed.`,
      3000
    )
  }
}

const handleTaskComplete = (taskId: string) => {
  const task = taskStore.tasks.find(t => t.id === taskId)
  taskStore.toggleTaskCompletion(taskId)

  if (task && !task.completed) {
    showNotification(
      'success',
      'Well Done! 🎯',
      `"${task.title}" completed!`,
      3000
    )
  }
}

const handleTaskAdd = (title: string, description: string, priority: any) => {
  taskStore.addTask(title, description, priority)

  showNotification(
    'success',
    'Task Added',
    `"${title}" has been added to your list.`,
    3000
  )
}
</script>


<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <ToastNotifications ref="toastRef" />

    <NavigationBar />
    <div class="container mx-auto px-4 py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <!-- <button @click="showNotification('info', 'Test', 'This is a test notification')"
      class="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
      Test Notification
    </button> -->
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
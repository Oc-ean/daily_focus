<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface Notification {
    id: string
    type: 'success' | 'info' | 'warning' | 'error' | 'timer'
    title: string
    message: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

const notifications = ref<Notification[]>([])

const show = (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID()
    const newNotification: Notification = {
        id,
        duration: 5000,
        ...notification
    }

    notifications.value.push(newNotification)

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
            remove(id)
        }, newNotification.duration)
    }

    return id
}

const remove = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
        notifications.value.splice(index, 1)
    }
}

const getIcon = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return '✓'
        case 'error':
            return '✕'
        case 'warning':
            return '⚠'
        case 'timer':
            return '⏰'
        default:
            return 'ℹ'
    }
}

const getColor = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return 'bg-green-500'
        case 'error':
            return 'bg-red-500'
        case 'warning':
            return 'bg-yellow-500'
        case 'timer':
            return 'bg-purple-500'
        default:
            return 'bg-blue-500'
    }
}

defineExpose({
    show,
    remove
})
</script>

<template>
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full px-4 md:px-0">
        <transition-group name="toast">
            <div v-for="notification in notifications" :key="notification.id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-in">
                <div class="flex items-start p-4">
                    <!-- Icon -->
                    <div :class="getColor(notification.type)"
                        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">
                        {{ getIcon(notification.type) }}
                    </div>

                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {{ notification.title }}
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            {{ notification.message }}
                        </p>

                        <button v-if="notification.action"
                            @click="notification.action.onClick(); remove(notification.id)"
                            class="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                            {{ notification.action.label }}
                        </button>
                    </div>

                    <button @click="remove(notification.id)"
                        class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div v-if="notification.duration && notification.duration > 0" class="h-1 bg-gray-200 dark:bg-gray-700">
                    <div :class="getColor(notification.type)" class="h-full animate-shrink"
                        :style="{ animationDuration: `${notification.duration}ms` }"></div>
                </div>
            </div>
        </transition-group>
    </div>
</template>

<style scoped>
@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes shrink {
    from {
        width: 100%;
    }

    to {
        width: 0%;
    }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out;
}

.animate-shrink {
    animation: shrink linear;
}

.toast-enter-active {
    animation: slide-in 0.3s ease-out;
}

.toast-leave-active {
    animation: slide-in 0.3s ease-out reverse;
}

.toast-move {
    transition: transform 0.3s ease;
}
</style>
<script setup lang="ts">
defineProps<{
    show: boolean
    title: string
    description: string
    actionText: string
    action: () => void
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()
</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="emit('close')">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {{ title }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 mb-6">
                {{ description }}
            </p>

            <div class="flex justify-end space-x-3">
                <button @click="emit('close')"
                    class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    Cancel
                </button>

                <button @click="action" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    {{ actionText }}
                </button>
            </div>
        </div>
    </div>
</template>

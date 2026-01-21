<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from '@/components/Dialog.vue'

const router = useRouter()
const showResetConfirm = ref(false)
const mobileMenuOpen = ref(false)


const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/history', name: 'History' },
    { path: '/settings', name: 'Settings' }
]

const formattedDate = computed(() => {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})

const resetDay = () => {
    console.log('Resetting day...')
    showResetConfirm.value = false
}
</script>
<template>
    <nav
        class="bg-white border-b border-gray-800 text-gray-900 shadow-lg dark:bg-gray-900 sticky top-0 z-40 dark:text-white">
        <div class="container mx-auto px-4 py-2">
            <div class="flex justify-between items-center h-14">

                <!-- Logo -->
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <img src="/daily_reminder.png" alt="Daily Focus Logo" class="w-5 h-5 object-contain">
                    </div>

                    <span class="text-lg font-bold text-gray-800 dark:text-white">Daily Focus</span>
                </div>

                <!-- Desktop Links -->
                <div class="hidden md:flex items-center space-x-8">

                    <router-link v-for="route in routes" :key="route.path" :to="route.path" class="transition" :class="router.currentRoute.value.path === route.path
                        ? 'text-indigo-600  font-semibold'
                        : 'text-gray-600 dark:text-white hover:text-indigo-600 dark:hover:text-white'">
                        {{ route.name }}
                    </router-link>
                </div>



                <!-- Right Actions -->
                <div class="flex items-center space-x-3">
                    <!-- Date (desktop only) -->
                    <span class="hidden md:block text-sm text-gray-600">
                        {{ formattedDate }}
                    </span>

                    <!-- Reset (desktop) -->
                    <button @click="showResetConfirm = true"
                        class="hidden md:inline px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
                        Reset Day
                    </button>

                    <!-- Hamburger -->
                    <button class="md:hidden p-2 rounded-lg hover:bg-gray-800"
                        @click="mobileMenuOpen = !mobileMenuOpen">
                        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" stroke-width="2"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div v-if="mobileMenuOpen"
            class="md:hidden border-t border-gray-200 bg-white dark:bg-gray-900 border-b dark:border-gray-600">
            <div class="px-4 py-3 space-y-2">
                <router-link v-for="route in routes" :key="route.path" :to="route.path" @click="mobileMenuOpen = false"
                    class="block py-2 text-gray-700 hover:text-indigo-600" :class="router.currentRoute.value.path === route.path
                        ? 'text-indigo-600  font-semibold'
                        : 'text-gray-600 dark:text-white hover:text-indigo-600 dark:hover:text-white'">
                    {{ route.name }}
                </router-link>

                <div class="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p class="text-xs text-gray-500 mb-2">
                        {{ formattedDate }}
                    </p>
                    <button @click="showResetConfirm = true"
                        class="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                        Reset Day
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <Dialog :show="showResetConfirm" title="Reset Today's Tasks?"
        description="This will move all unfinished tasks to tomorrow and start a fresh day." actionText="Reset Day"
        :action="resetDay" @close="showResetConfirm = false" />
</template>

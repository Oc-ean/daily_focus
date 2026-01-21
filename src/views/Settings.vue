<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

/* --------------------
   Store bindings
-------------------- */

const timerSettings = computed(() => settingsStore.timerSettings)
const taskSettings = computed(() => settingsStore.taskSettings)
const notifications = computed(() => settingsStore.notifications)
const appearanceSettings = computed(() => settingsStore.appearance)

/* --------------------
   Theme options
-------------------- */
const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'blue', name: 'Blue' },
    { id: 'green', name: 'Green' }
]

/* --------------------
   Actions
-------------------- */

const saveSettings = () => {
    settingsStore.saveSettings()
    alert('Settings saved successfully!')
}

const exportAllData = () => {
    alert('Data export feature would be implemented here')
}

const importData = () => {
    alert('Data import feature would be implemented here')
}

const resetAllData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem('dailyFocusBoard')
        localStorage.removeItem('taskHistory')
        localStorage.removeItem('dailyFocusSettings')
        window.location.reload()
    }
}

/* --------------------
   Init
-------------------- */
onMounted(() => {
    settingsStore.loadSettings()
})
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
            <p class="text-gray-600 dark:text-gray-300">Customize your Daily Focus Board experience</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Settings -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Timer Settings -->
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Timer Settings</h2>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Default Timer Duration
                            </label>
                            <input v-model.number="timerSettings.defaultDuration" type="range" min="5" max="90" step="5"
                                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span>5 min</span>
                                <span class="font-semibold">{{ timerSettings.defaultDuration }} min</span>
                                <span>90 min</span>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Auto-start next timer
                            </label>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="timerSettings.autoStartNext" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                                <span class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                                    {{ timerSettings.autoStartNext ? 'Enabled' : 'Disabled' }}
                                </span>
                            </label>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Timer Sounds
                            </label>
                            <select v-model="timerSettings.sound"
                                class="input-field bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg w-full">
                                <option value="bell">Bell</option>
                                <option value="chime">Chime</option>
                                <option value="beep">Beep</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Task Settings -->
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Task Settings</h2>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Maximum Tasks per Day
                            </label>
                            <input v-model.number="taskSettings.maxTasks" type="number" min="1" max="20"
                                class="input-field w-32 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" />
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Recommended: 3-5 for optimal focus
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Auto-move unfinished tasks
                            </label>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="taskSettings.autoMoveUnfinished" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                                <span class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                                    {{ taskSettings.autoMoveUnfinished ? 'Enabled' : 'Disabled' }}
                                </span>
                            </label>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Unfinished tasks will automatically move to the next day
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Daily Reset Time
                            </label>
                            <input v-model="taskSettings.resetTime" type="time"
                                class="input-field w-48 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg" />
                        </div>
                    </div>
                </div>

                <!-- Notification Settings -->
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Notifications</h2>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-gray-700 dark:text-gray-300">Task Reminders</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Remind me about unfinished tasks
                                </div>
                            </div>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="notifications.taskReminders" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-gray-700 dark:text-gray-300">Daily Summary</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Send daily progress report</div>
                            </div>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="notifications.dailySummary" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-gray-700 dark:text-gray-300">Streak Alerts</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Notify about streak milestones
                                </div>
                            </div>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="notifications.streakAlerts" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Panel -->
            <div class="space-y-8">
                <!-- Appearance -->
                <!-- <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Appearance</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="theme in themes" :key="theme.id"
                                    @click="appearanceSettings.theme = theme.id"
                                    class="p-3 border rounded-lg text-sm transition-all"
                                    :class="appearanceSettings.theme === theme.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600 text-indigo-700 dark:text-indigo-100'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'">
                                    {{ theme.name }}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Animations</label>
                            <label class="inline-flex items-center cursor-pointer">
                                <input v-model="appearanceSettings.animations" type="checkbox" class="sr-only peer" />
                                <div
                                    class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                                </div>
                                <span class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                                    {{ appearanceSettings.animations ? 'Enabled' : 'Disabled' }}
                                </span>
                            </label>
                        </div>
                    </div>
                </div> -->

                <!-- Data Management -->
                <div class="card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-6">Data Management</h2>
                    <div class="space-y-3">
                        <button @click="exportAllData"
                            class="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            Export All Data
                        </button>
                        <button @click="importData"
                            class="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            Import Data
                        </button>
                        <button @click="resetAllData"
                            class="w-full py-3 bg-red-50 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-100 dark:hover:bg-red-700 transition-colors">
                            Reset All Data
                        </button>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="sticky top-8">
                    <button @click="saveSettings"
                        class="w-full py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg">
                        Save Settings
                    </button>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Settings are saved automatically in your browser
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

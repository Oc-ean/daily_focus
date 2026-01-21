import { defineStore } from 'pinia'

import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    const timerSettings = ref({
        defaultDuration: 25,
        autoStartNext: true,
        sound: 'bell' as 'bell' | 'chime' | 'beep' | 'none'
    })

    const taskSettings = ref({
        maxTasks: 5,
        autoMoveUnfinished: true,
        resetTime: '00:00'
    })

    const notifications = ref({
        taskReminders: true,
        dailySummary: true,
        streakAlerts: true,
        timerComplete: true
    })

    const appearance = ref({
        theme: 'light',
        animations: true
    })

    const loadSettings = () => {
        const saved = localStorage.getItem('dailyFocusSettings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (parsed.timer) timerSettings.value = { ...timerSettings.value, ...parsed.timer }
                if (parsed.task) taskSettings.value = { ...taskSettings.value, ...parsed.task }
                if (parsed.notifications) notifications.value = { ...notifications.value, ...parsed.notifications }
                if (parsed.appearance) appearance.value = { ...appearance.value, ...parsed.appearance }
            } catch (error) {
                console.error('Error loading settings:', error)
            }
        }
    }

    const saveSettings = () => {
        const settings = {
            timer: timerSettings.value,
            task: taskSettings.value,
            notifications: notifications.value,
            appearance: appearance.value,
            savedAt: new Date().toISOString()
        }

        localStorage.setItem('dailyFocusSettings', JSON.stringify(settings))
    }

    watch([timerSettings, taskSettings, notifications, appearance], () => {
        saveSettings()
    }, { deep: true })



    return {
        timerSettings,
        taskSettings,
        notifications,
        appearance,
        loadSettings,
        saveSettings
    }
})
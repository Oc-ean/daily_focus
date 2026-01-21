export type Priority = 'low' | 'medium' | 'high'

export interface Task {
    id: string
    title: string
    description: string
    completed: boolean
    priority: Priority
    timeSpent: number
    estimatedTime: number
    createdAt: Date
    completedAt?: Date
}

export interface DailyStats {
    date: string
    tasksCompleted: number
    totalTasks: number
    totalTimeSpent: number
    completionRate: number
}

export interface TimerState {
    activeTaskId: string | null
    timeRemaining: number
    isRunning: boolean
}

export interface TaskTimer {
    taskId: string
    interval: number
    startTime: number
}

export interface DailyFocusState {
    tasks: Task[]
    dailyStats: DailyStats
    today: string
    timer: TimerState
}
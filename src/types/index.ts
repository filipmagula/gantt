export interface Resource {
    id: string
    name: string
    avatar?: string
    color?: string // For role labeling
    capacity: number // Percentage (e.g., 100 for 100%)
}

export interface Assignment {
    taskId: string
    resourceId: string
    effort: number // Percentage effort
}

export interface Task {
    id: string
    epicId: string
    name: string
    start: string // ISO Date string YYYY-MM-DD
    end: string   // ISO Date string YYYY-MM-DD
    assignments: Assignment[]
}

export interface Epic {
    id: string
    title: string
    description?: string
    color?: string // For UI visualization
    tasks: Task[]
}

export interface AppState {
    resources: Resource[]
    epics: Epic[]
}

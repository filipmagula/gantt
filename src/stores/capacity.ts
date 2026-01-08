import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Resource, Epic, Task, AppState, Milestone } from '../types'
import { isWithinInterval, parseISO } from 'date-fns'

export const useCapacityStore = defineStore('capacity', () => {
    // --- State ---
    const STORAGE_KEY = 'gantt_capacity_planner_v1'

    // Load from storage or default
    const saved = localStorage.getItem(STORAGE_KEY)
    let initialData = null
    try {
        initialData = saved ? JSON.parse(saved) : null
    } catch (e) {
        console.error("Failed to parse local storage", e)
    }

    // Store initialized
    const resources = ref<Resource[]>(initialData?.resources || [
        { id: 'r1', name: 'Alex Rivera', capacity: 100, color: '#6366f1' },
        { id: 'r2', name: 'Sarah Chen', capacity: 80, color: '#10b981' }, // Part-time example
    ])

    const epics = ref<Epic[]>(initialData?.epics || [
        {
            id: 'e1',
            title: '2026 Q1 Infrastructure',
            color: '#6366f1',
            tasks: [
                {
                    id: 't1',
                    epicId: 'e1',
                    name: 'Server Migration',
                    start: '2026-01-10',
                    end: '2026-01-20',
                    assignments: [
                        { taskId: 't1', resourceId: 'r1', effort: 75 }
                    ]
                },
                {
                    id: 't2',
                    epicId: 'e1',
                    name: 'Database Optimization',
                    start: '2026-01-17',
                    end: '2026-02-20',
                    assignments: [
                        { taskId: 't2', resourceId: 'r1', effort: 30 }, // Overlap with t1 => 105% (RED)
                        { taskId: 't2', resourceId: 'r2', effort: 50 }
                    ]
                }
            ]
        }
    ])

    const milestones = ref<Milestone[]>(initialData?.milestones || [])
    const appName = ref(initialData?.appName || 'My Project')

    // Persistence Watcher
    watch([resources, epics, milestones, appName], () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                resources: resources.value,
                epics: epics.value,
                milestones: milestones.value,
                appName: appName.value
            }))
        } catch (e) {
            console.error("Failed to save to local storage", e)
        }
    }, { deep: true })

    // --- Getters / Logic ---

    // Helper to flatten tasks for easier iteration
    const allTasks = computed(() => {
        return epics.value.flatMap(epic => epic.tasks)
    })

    // Calculate daily load for a specific resource
    function getResourceLoad(resourceId: string, date: Date | string) {
        const targetDate = typeof date === 'string' ? parseISO(date) : date

        // Skip weekends
        const dayOfWeek = targetDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) return 0 // 0=Sun, 6=Sat

        let totalEffort = 0

        allTasks.value.forEach(task => {
            const taskStart = parseISO(task.start)
            const taskEnd = parseISO(task.end)

            // Check if date is within task range
            if (isWithinInterval(targetDate, { start: taskStart, end: taskEnd })) {
                // Find assignment for this resource
                const assignment = task.assignments.find(a => a.resourceId === resourceId)
                if (assignment) {
                    totalEffort += assignment.effort
                }
            }
        })

        return totalEffort
    }

    // Determine status color based on load vs capacity
    function getLoadStatus(load: number, resourceCapacity: number) {
        if (load > resourceCapacity) return 'red'
        if (load > (resourceCapacity * 0.9)) return 'yellow' // >90% warning
        return 'green'
    }

    // Check if a task causes any over-allocation (RED status) 
    // for any assigned resource on any day within the task duration.
    function isTaskOverloaded(taskId: string): boolean {
        const task = allTasks.value.find(t => t.id === taskId)
        if (!task) return false

        const start = parseISO(task.start)
        const end = parseISO(task.end)

        // Iterate days. Simple loop.
        let current = start
        while (current <= end) {
            // Check each assigned resource
            // Optimization: Only check for days where load > capacity
            // But we need to use getResourceLoad(resId, current) which aggregates ALL tasks.
            // So yes, for every day of this task, check if the assigned resources are overloaded (by ANY task).
            for (const assignment of task.assignments) {
                const resource = resources.value.find(r => r.id === assignment.resourceId)
                if (resource) {
                    const load = getResourceLoad(resource.id, current)
                    if (getLoadStatus(load, resource.capacity) === 'red') {
                        return true
                    }
                }
            }

            const nextDate = new Date(current)
            nextDate.setDate(nextDate.getDate() + 1)
            current = nextDate
        }

        return false
    }

    // --- Actions ---

    function updateState(newState: AppState) {
        resources.value = newState.resources
        epics.value = newState.epics
        milestones.value = newState.milestones || []
    }

    function addEpic(epic: Epic) {
        epics.value.push(epic)
    }

    function addTask(epicId: string, task: Task) {
        const epic = epics.value.find(e => e.id === epicId)
        if (epic) {
            epic.tasks.push(task)
        }
    }

    function deleteTask(taskId: string) {
        for (const epic of epics.value) {
            const index = epic.tasks.findIndex(t => t.id === taskId)
            if (index !== -1) {
                epic.tasks.splice(index, 1)
                return
            }
        }
    }

    function updateEpic(updatedEpic: Epic) {
        const index = epics.value.findIndex(e => e.id === updatedEpic.id)
        if (index !== -1) {
            epics.value[index] = updatedEpic
        }
    }

    function deleteEpic(epicId: string) {
        const index = epics.value.findIndex(e => e.id === epicId)
        if (index !== -1) {
            epics.value.splice(index, 1)
        }
    }

    function updateAssignment(taskId: string, resourceId: string, effort: number) {
        // Find task across all epics
        for (const epic of epics.value) {
            const task = epic.tasks.find(t => t.id === taskId)
            if (task) {
                const assignment = task.assignments.find(a => a.resourceId === resourceId)
                if (assignment) {
                    assignment.effort = effort
                } else {
                    task.assignments.push({ taskId, resourceId, effort })
                }
                return
            }
        }
    }

    function addResource(resource: Resource) {
        resources.value.push(resource)
    }

    function updateResource(updatedResource: Resource) {
        const index = resources.value.findIndex(r => r.id === updatedResource.id)
        if (index !== -1) {
            resources.value[index] = updatedResource
        }
    }

    function deleteResource(resourceId: string) {
        // 1. Remove resource from list
        const index = resources.value.findIndex(r => r.id === resourceId)
        if (index !== -1) {
            resources.value.splice(index, 1)
        }

        // 2. Remove assignments for this resource from all tasks
        epics.value.forEach(epic => {
            epic.tasks.forEach(task => {
                const assignIdx = task.assignments.findIndex(a => a.resourceId === resourceId)
                if (assignIdx !== -1) {
                    task.assignments.splice(assignIdx, 1)
                }
            })
        })
    }

    // Milestone Actions
    function addMilestone(milestone: Milestone) {
        milestones.value.push(milestone)
    }

    function updateMilestone(updatedMilestone: Milestone) {
        const index = milestones.value.findIndex(m => m.id === updatedMilestone.id)
        if (index !== -1) {
            milestones.value[index] = updatedMilestone
        }
    }

    function deleteMilestone(milestoneId: string) {
        const index = milestones.value.findIndex(m => m.id === milestoneId)
        if (index !== -1) {
            milestones.value.splice(index, 1)
        }
    }

    // JSON Export
    function exportState(): string {
        return JSON.stringify({
            resources: resources.value,
            epics: epics.value,
            milestones: milestones.value,
            appName: appName.value
        }, null, 2)
    }

    // JSON Import
    function importState(json: string) {
        try {
            const data = JSON.parse(json)
            if (data.appName) appName.value = data.appName
            // Basic validation could go here
            updateState(data)
            return true
        } catch (e) {
            console.error("Invalid JSON", e)
            return false
        }
    }

    function updateAppName(name: string) {
        appName.value = name
    }

    return {
        resources,
        epics,
        milestones,
        appName,
        allTasks,
        getResourceLoad,
        getLoadStatus,
        addEpic,
        updateEpic,
        deleteEpic,
        addTask,
        deleteTask,
        updateAssignment,
        addResource,
        updateResource,
        deleteResource,
        exportState,
        importState,
        isTaskOverloaded,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        updateAppName
    }
})

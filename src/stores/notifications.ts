import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
    id: string
    message: string
    type: NotificationType
    duration?: number
}

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref<Notification[]>([])

    function add(message: string, type: NotificationType = 'info', duration = 3000) {
        const id = `notif_${Date.now()}_${Math.random()}`
        const notification: Notification = { id, message, type, duration }
        notifications.value.push(notification)

        if (duration > 0) {
            setTimeout(() => {
                remove(id)
            }, duration)
        }
    }

    function remove(id: string) {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }

    return {
        notifications,
        add,
        remove
    }
})

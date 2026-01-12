import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addDays, startOfWeek } from 'date-fns'

export const useDateStore = defineStore('date', () => {
    // State
    const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 })) // Start from current week (Monday)
    const weeksToShow = ref(3) // Default to 3 weeks

    // Getters
    const daysToShow = computed(() => weeksToShow.value * 7)

    const timelineDates = computed(() => {
        const dates = []
        for (let i = 0; i < daysToShow.value; i++) {
            dates.push(addDays(startDate.value, i))
        }
        return dates
    })

    // Actions
    function nextWeek() {
        startDate.value = addDays(startDate.value, 7)
    }

    function prevWeek() {
        startDate.value = addDays(startDate.value, -7)
    }

    function scrollToToday() {
        startDate.value = startOfWeek(new Date(), { weekStartsOn: 1 })
    }

    function shiftDays(days: number) {
        startDate.value = addDays(startDate.value, days)
    }

    function setWeeks(weeks: number) {
        if (weeks >= 2 && weeks <= 5) {
            weeksToShow.value = weeks
        }
    }

    return {
        startDate,
        weeksToShow,
        daysToShow,
        timelineDates,
        nextWeek,
        prevWeek,
        shiftDays,
        scrollToToday,
        setWeeks
    }
})

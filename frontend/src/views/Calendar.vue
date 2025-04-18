<template>
  <div class="calendar-page">
    <h1>Journal Calendar</h1>
    
    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="previousMonth">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth">&gt;</button>
      </div>

      <div class="calendar-grid">
        <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="calendar-day"
          :class="{
            'current-month': day.isCurrentMonth,
            'has-entries': day.hasEntries,
            'selected': selectedDate === day.date
          }"
          :style="day.moodColor ? { 
            backgroundColor: day.moodColor + '80',
            border: `2px solid ${day.moodColor}`
          } : {}"
          @click="selectDate(day)"
        >
          {{ day.dayOfMonth }}
          <div v-if="day.mood" class="mood-indicator" :title="day.mood">
            {{ day.moodEmoji }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDate" class="journal-entries">
      <h3>Journal Entries for {{ formatSelectedDate }}</h3>
      <div v-if="loadingEntries" class="loading">Loading entries...</div>
      <div v-else-if="selectedEntries.length === 0" class="no-entries">
        No entries for this date
      </div>
      <div v-else class="entries-list">
        <div v-for="entry in selectedEntries" :key="entry.id" class="entry-card">
          <div class="entry-header">
            <span class="entry-time">{{ formatTime(entry.createdAt) }}</span>
            <span class="entry-mood" :style="{ backgroundColor: entry.moodColor }">
              {{ entry.moodEmoji }}
            </span>
          </div>
          <div class="entry-content">
            <div class="conversation">
              <div v-for="(message, index) in entry.conversation" 
                   :key="index"
                   :class="['message', message.type]">
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import store from '@/store'

export default {
  name: 'CalendarView',
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const currentDate = ref(new Date())
    const selectedDate = ref(null)
    const selectedEntries = ref([])
    const loadingEntries = ref(false)
    const allEntries = ref([])

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const currentMonthName = computed(() => {
      return currentDate.value.toLocaleString('default', { month: 'long' })
    })

    const currentYear = computed(() => {
      return currentDate.value.getFullYear()
    })

    const formatSelectedDate = computed(() => {
      if (!selectedDate.value) return ''
      try {
        const date = new Date(selectedDate.value)
        if (isNaN(date.getTime())) {
          console.warn('Invalid selected date:', selectedDate.value)
          return 'Invalid date'
        }
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (error) {
        console.error('Error formatting selected date:', error)
        return 'Invalid date'
      }
    })

    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      
      // Get first day of the month
      const firstDay = new Date(year, month, 1)
      // Get last day of the month
      const lastDay = new Date(year, month + 1, 0)
      
      // Get the day of week of the first day (0-6)
      const firstDayOfWeek = firstDay.getDay()
      
      // Get the number of days in the month
      const daysInMonth = lastDay.getDate()
      
      // Create array of days
      const days = []
      
      // Add days from previous month
      for (let i = 0; i < firstDayOfWeek; i++) {
        const prevDate = new Date(year, month, -i)
        days.push({
          date: prevDate.toISOString(),
          dayOfMonth: prevDate.getDate(),
          isCurrentMonth: false,
          hasEntries: false
        })
      }
      
      // Add days of current month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i)
        const dateStr = date.toISOString()
        const entry = allEntries.value.find(e => {
          const entryDate = new Date(e.createdAt)
          return entryDate.toDateString() === date.toDateString()
        })
        
        days.push({
          date: dateStr,
          dayOfMonth: i,
          isCurrentMonth: true,
          hasEntries: !!entry,
          mood: entry?.mood,
          moodColor: entry?.moodColor,
          moodEmoji: entry?.moodEmoji
        })
      }
      
      // Add days from next month
      const remainingDays = 42 - days.length // 6 rows * 7 days
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i)
        days.push({
          date: nextDate.toISOString(),
          dayOfMonth: nextDate.getDate(),
          isCurrentMonth: false,
          hasEntries: false
        })
      }
      
      return days
    })

    const previousMonth = () => {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() - 1,
        1
      )
    }

    const nextMonth = () => {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + 1,
        1
      )
    }

    const formatTime = (timestamp) => {
      try {
        let date
        if (timestamp instanceof Date) {
          date = timestamp
        } else if (typeof timestamp === 'string') {
          date = new Date(timestamp)
        } else if (timestamp?.toDate) {
          date = timestamp.toDate()
        } else {
          console.warn('Unexpected timestamp format:', timestamp)
          return 'Invalid time'
        }

        if (isNaN(date.getTime())) {
          console.warn('Invalid timestamp:', timestamp)
          return 'Invalid time'
        }
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      } catch (error) {
        console.error('Error formatting time:', error)
        return 'Invalid time'
      }
    }

    const loadAllEntries = async () => {
      try {
        const entries = await store.dispatch('loadJournalHistory', props.userId)
        console.log('Raw entries from backend:', entries)
        allEntries.value = (entries || []).map(entry => {
          try {
            // Ensure we have a valid date
            let date
            if (entry.createdAt?.toDate) {
              date = entry.createdAt.toDate()
            } else if (entry.createdAt) {
              date = new Date(entry.createdAt)
            } else {
              console.warn('Entry missing createdAt:', entry)
              return null
            }

            if (isNaN(date.getTime())) {
              console.warn('Invalid date in entry:', entry)
              return null
            }

            return {
              ...entry,
              createdAt: date,
              formattedDate: entry.formattedDate || date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }
          } catch (error) {
            console.error('Error processing entry:', error)
            return null
          }
        }).filter(Boolean) // Remove any null entries
      } catch (error) {
        console.error('Error loading entries:', error)
        allEntries.value = []
      }
    }

    const selectDate = async (day) => {
      if (!day.isCurrentMonth) return
      selectedDate.value = day.date
      loadingEntries.value = true
      
      try {
        // Filter entries for the selected date
        const selectedDateObj = new Date(day.date)
        selectedEntries.value = allEntries.value.filter(entry => {
          const entryDate = new Date(entry.createdAt)
          return entryDate.toDateString() === selectedDateObj.toDateString()
        })
      } catch (error) {
        console.error('Error filtering entries:', error)
        selectedEntries.value = []
      } finally {
        loadingEntries.value = false
      }
    }

    onMounted(() => {
      loadAllEntries()
    })

    return {
      currentDate,
      selectedDate,
      selectedEntries,
      loadingEntries,
      weekdays,
      currentMonthName,
      currentYear,
      calendarDays,
      formatSelectedDate,
      previousMonth,
      nextMonth,
      selectDate,
      formatTime
    }
  }
}
</script>

<style scoped>
.calendar-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.calendar-header button {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.calendar-header button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #666;
  padding: 1rem;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  background: white;
  border: 2px solid transparent;
  font-size: 0.9rem;
}

.calendar-day:not(.current-month) {
  opacity: 0.3;
  background: #f8f9fa;
}

.calendar-day.has-entries {
  font-weight: 600;
  border: 2px solid var(--primary-color);
}

.calendar-day.selected {
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

.mood-indicator {
  position: absolute;
  bottom: 0.25rem;
  font-size: 1.2rem;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.journal-entries {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-top: 1rem;
}

.journal-entries h3 {
  margin: 0 0 1.5rem;
  color: #2c3e50;
  font-size: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.entry-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.entry-time {
  color: #666;
  font-size: 0.9rem;
}

.entry-mood {
  padding: 0.5rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.conversation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  max-width: 80%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.message.user {
  align-self: flex-end;
  background: var(--primary-color);
  color: white;
}

.message.ai {
  align-self: flex-start;
  background: #f8f9fa;
  color: #2c3e50;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.no-entries {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}
</style> 
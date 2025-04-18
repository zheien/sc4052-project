<template>
  <div class="wellness-tracker-card">
    <transition name="fade">
      <div v-if="showSaved" class="save-toast">
        <span class="checkmark">✔</span> Wellness data saved!
      </div>
    </transition>
    <div v-if="mode === 'moodTracking' || mode === 'all'" class="mood-tracker">
      <h3 class="section-title">How are you feeling today?</h3>
      <div class="mood-options">
        <button
          v-for="mood in moods"
          :key="mood.value"
          @click="setMood(mood.value)"
          :class="['mood-btn', { active: currentMood === mood.value }]"
          :title="mood.label"
        >
          <span class="mood-emoji" :aria-label="mood.label">{{ mood.emoji }}</span>
          <span class="mood-label">{{ mood.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="mode === 'sleepHours' || mode === 'all'" class="sleep-tracker mt-6">
      <h3 class="section-title">How many hours did you sleep?</h3>
      <div class="sleep-input flex flex-col gap-4 md:flex-row md:items-center">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Hours of Sleep</label>
          <input
            type="number"
            v-model="sleepHours"
            min="0"
            max="24"
            step="0.5"
            class="input-field"
          >
        </div>
      </div>
    </div>

    <div v-if="mode === 'sleepQuality' || mode === 'all'" class="sleep-tracker mt-6">
      <h3 class="section-title">How was the quality of your sleep?</h3>
      <div class="sleep-input flex flex-col gap-4 md:flex-row md:items-center">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Sleep Quality</label>
          <select
            v-model="sleepQuality"
            class="input-field"
          >
            <option value="">Select quality</option>
            <option value="poor">😴 Poor</option>
            <option value="fair">😕 Fair</option>
            <option value="good">😊 Good</option>
            <option value="excellent">🌟 Excellent</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="hasChanges" class="summary-preview mt-6">
      <h4 class="summary-title">Today's Summary</h4>
      <ul>
        <li v-if="currentMood"><strong>Mood:</strong> <span :aria-label="currentMood">{{ moods.find(m=>m.value===currentMood)?.emoji }}</span> {{ moods.find(m=>m.value===currentMood)?.label }}</li>
        <li v-if="sleepHours && mode !== 'sleepQuality'"><strong>Sleep:</strong> {{ sleepHours }}h</li>
        <li v-if="sleepQuality && mode !== 'sleepHours'"><strong>Sleep Quality:</strong> {{ sleepQualityEmoji[sleepQuality] }} {{ sleepQualityLabel[sleepQuality] }}</li>
      </ul>
    </div>

    <button 
      @click="saveWellnessData" 
      class="save-btn mt-6"
      :disabled="!hasChanges"
    >
      <span class="save-btn-label">Save Wellness Data</span>
    </button>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'WellnessTracker',
  props: {
    userId: { type: String, required: true },
    mode: { type: String, default: 'all' }
  },
  setup(props) {
    const store = useStore()
    const mode = props.mode
    const preferences = computed(() => store.getters['preferences/getPreferences'])

    const currentMood = ref('')
    const sleepHours = ref('')
    const sleepQuality = ref('')
    const showSaved = ref(false)

    const moods = [
      { value: 'great', emoji: '😊', label: 'Great' },
      { value: 'good', emoji: '🙂', label: 'Good' },
      { value: 'neutral', emoji: '😐', label: 'Neutral' },
      { value: 'sad', emoji: '😔', label: 'Sad' },
      { value: 'stressed', emoji: '😫', label: 'Stressed' }
    ]

    const sleepQualityEmoji = {
      poor: '😴',
      fair: '😕',
      good: '😊',
      excellent: '🌟'
    }
    const sleepQualityLabel = {
      poor: 'Poor',
      fair: 'Fair',
      good: 'Good',
      excellent: 'Excellent'
    }

    const hasChanges = computed(() => {
      if (mode === 'moodTracking') return currentMood.value
      if (mode === 'sleepHours') return sleepHours.value
      if (mode === 'sleepQuality') return sleepQuality.value
      return currentMood.value || (sleepHours.value && sleepQuality.value)
    })

    const setMood = (mood) => {
      currentMood.value = mood
    }

    const saveWellnessData = async () => {
      const data = {
        userId: props.userId,
        date: new Date().toISOString(),
        mood: currentMood.value,
        sleep: sleepHours.value && sleepQuality.value ? {
          hours: parseFloat(sleepHours.value),
          quality: sleepQuality.value
        } : null
      }

      try {
        await store.dispatch('saveWellnessData', data)
        // Reset form
        currentMood.value = ''
        sleepHours.value = ''
        sleepQuality.value = ''
        showSaved.value = true
        setTimeout(() => (showSaved.value = false), 1800)
      } catch (error) {
        console.error('Error saving wellness data:', error)
        alert('Failed to save wellness data. Please try again.')
      }
    }

    return {
      preferences,
      currentMood,
      sleepHours,
      sleepQuality,
      moods,
      hasChanges,
      setMood,
      saveWellnessData,
      showSaved,
      sleepQualityEmoji,
      sleepQualityLabel,
      mode
    }
  }
}
</script>

<style scoped>
.wellness-tracker-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
  border-radius: 16px;
  padding: 2.4rem 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.mood-options {
  display: flex;
  gap: 1.2rem;
  margin-top: 0.5rem;
  justify-content: space-between;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.85rem;
  padding: 0.7rem 0.6rem 0.3rem 0.6rem;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  transition: all 0.23s cubic-bezier(.4,2,.6,1);
  min-width: 68px;
  min-height: 68px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  position: relative;
}
.mood-btn .mood-emoji {
  font-size: 2.1rem;
  margin-bottom: 0.2rem;
}
.mood-btn .mood-label {
  font-size: 0.82rem;
  color: #444;
  font-weight: 500;
}
.mood-btn.active {
  border-color: #4a90e2;
  background: rgba(74, 144, 226, 0.13);
  transform: scale(1.07);
  box-shadow: 0 2px 8px rgba(74,144,226,0.08);
}
.mood-btn:hover:not(.active) {
  background: #f0f7ff;
  transform: scale(1.04);
}

.sleep-tracker {
  margin-top: 2rem;
}
.input-field {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 7px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.2s;
}
.input-field:focus {
  border-color: #4a90e2;
  outline: none;
}

.summary-preview {
  background: #f3f6fa;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-top: 1.5rem;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.summary-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.summary-preview ul {
  padding-left: 1.1em;
  margin: 0;
}
.summary-preview li {
  margin-bottom: 0.2em;
}

.save-btn {
  background: linear-gradient(90deg, #4a90e2 60%, #357ab8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  width: 100%;
  font-size: 1.07rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(74,144,226,0.08);
  transition: background 0.2s, opacity 0.2s;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
}
.save-btn:disabled {
  background: #b6c7db;
  cursor: not-allowed;
  opacity: 0.7;
}
.save-btn:not(:disabled):hover {
  opacity: 0.93;
  background: linear-gradient(90deg, #357ab8 20%, #4a90e2 100%);
}
.save-btn-label {
  display: flex;
  align-items: center;
  gap: 0.4em;
}

.save-toast {
  position: absolute;
  top: -2.2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #e9fbe7;
  color: #219150;
  border-radius: 7px;
  padding: 0.7em 1.3em;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(34,139,34,0.07);
  display: flex;
  align-items: center;
  gap: 0.5em;
  z-index: 10;
  animation: pop-in 0.3s cubic-bezier(.4,2,.6,1);
}
.checkmark {
  font-size: 1.2em;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@keyframes pop-in {
  0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}

@media (max-width: 600px) {
  .wellness-tracker-card {
    padding: 1.2rem 0.6rem;
  }
  .mood-options {
    gap: 0.5rem;
  }
  .save-btn {
    padding: 0.85rem 0.5rem;
    font-size: 1rem;
  }
  .summary-preview {
    padding: 0.7rem 0.7rem;
  }
}
</style>

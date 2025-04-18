<template>
  <div class="wellness-tracker-card">
    <transition name="fade">
      <div v-if="saved" class="save-toast">
        <span class="checkmark">✔</span> Water intake saved!
      </div>
    </transition>
    <h3 class="section-title">How much water did you drink today?</h3>
    <div class="water-options">
      <button
        v-for="i in maxGlasses"
        :key="i"
        @click="setGlasses(i)"
        :class="['mood-btn', { active: glasses === i }]"
        :title="`${i} glass${i !== 1 ? 'es' : ''}`"
      >
        <span class="mood-emoji">💧</span>
        <span class="mood-label">{{ i }}</span>
      </button>
    </div>
    <div v-if="glasses" class="summary-preview mt-6">
      <h4 class="summary-title">Today's Water Intake</h4>
      <ul>
        <li><strong>Water:</strong> {{ glasses }} glass{{ glasses !== 1 ? 'es' : '' }}</li>
      </ul>
    </div>
    <button 
      @click="save" 
      class="save-btn mt-6" 
      :disabled="!glasses"
    >
      <span class="save-btn-label">Save Water Intake</span>
    </button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'WaterIntakeModule',
  props: { userId: { type: String, required: true } },
  setup() {
    const glasses = ref(0)
    const maxGlasses = 8
    const saved = ref(false)
    const setGlasses = (value) => {
      glasses.value = value
      saved.value = false
    }
    const save = () => {
      saved.value = true
      // TODO: persist water intake
    }
    return { glasses, maxGlasses, saved, setGlasses, save }
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
.water-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.2rem;
  margin-top: 0.5rem;
  justify-items: center;
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
  .save-btn {
    padding: 0.85rem 0.5rem;
    font-size: 1rem;
  }
  .summary-preview {
    padding: 0.7rem 0.7rem;
  }
}
</style>

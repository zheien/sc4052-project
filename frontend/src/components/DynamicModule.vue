<template>
  <div class="wellness-tracker-card" @click="onCardClick">
    <div class="card-header" style="display: flex; align-items: center; margin-bottom: 1.2rem;">
      <span class="module-icon" style="font-size: 2.1rem; margin-right: 0.75rem;">{{ module.icon }}</span>
      <h3 class="section-title" style="margin: 0;">{{ module.name }}</h3>
    </div>
    <div v-show="showToast" class="save-toast">
      <span class="checkmark">✔</span> {{ toastMessage }}
    </div>
    <div class="card-form">
      <div v-for="field in module.fields" :key="field.label" style="margin-bottom: 1.1rem;">
        <label class="field-label" style="font-weight: 600; color: #506690; margin-bottom: 0.2rem;">{{ field.label }}</label>
        <template v-if="field.type === 'emoji'">
          <div class="mood-options" style="gap: 0.5rem;">
            <button
              v-for="opt in field.options"
              :key="opt"
              type="button"
              :class="['mood-btn', { active: (formData[field.label] || []).includes(opt) } ]"
              style="font-size: 1.4rem; min-width: 68px; min-height: 68px;"
              @click="toggleEmoji(field.label, opt)"
            >{{ opt }}</button>
          </div>
        </template>
        <template v-else-if="field.type === 'number'">
          <input
            type="number"
            :min="field.min"
            :max="field.max"
            v-model.number="formData[field.label]"
            class="input-field"
          />
        </template>
        <!-- Add more field types as needed -->
      </div>
      <button type="button" @click="handleSubmit()" class="save-btn" style="margin-top: 1.5rem; width: 100%;">
        <span class="save-btn-label">{{ isCurrentModuleSaved ? 'Update' : 'Save' }}</span>
      </button>
    </div>
  </div>
</template>


<script>
import { saveMoodForToday, getMoodForToday } from '../utils/moodFirebase' // must be after firebase/firestore imports

export default {
  name: "DynamicModule",
  props: {
    module: Object,
    userId: String
  },
  data() {
    return {
      formData: {},
      lastSavedData: null, // Defensive: null by default
      showToast: false,
      toastMessage: '',
      hasSavedDataToday: false
    };
  },
  computed: {
    isCurrentModuleSaved() {
      console.log('[isCurrentModuleSaved] hasSavedDataToday:', this.hasSavedDataToday, 'lastSavedData:', this.lastSavedData, 'formData:', this.formData);
      // If there is no saved data for today, or no lastSavedData, always show 'Save'
      if (!this.hasSavedDataToday || this.lastSavedData === null) return false;
      // If there are no non-empty values in formData, always show 'Save'
      const hasAnyValue = Object.values(this.formData).some(val => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'number') return !isNaN(val);
        return !!val;
      });
      if (!hasAnyValue) return false;
      // Only show 'Update' if formData matches lastSavedData
      return this.deepEqual(this.formData, this.lastSavedData);
    }
  },
  watch: {
    showToast(val) {
      console.log('[Toast watcher] showToast changed to', val, 'with message:', this.toastMessage);
    }
  },
  async mounted() {
    // Load previously saved data for all field types (emoji, number, etc.) if userId is present
    if (this.userId) {
      const savedObj = await getMoodForToday(this.userId);
      console.log('[DynamicModule] getMoodForToday result:', savedObj);

      // Build module-specific saved data object
      let moduleSavedObj = {};
      let hasAnyValue = false;
      if (savedObj && typeof savedObj === 'object') {
        for (const field of this.module.fields) {
          const rawValue = savedObj[field.label];
          let value;
          if (field.type === 'emoji') {
            value = Array.isArray(rawValue) ? [...rawValue] : [];
            if (!hasAnyValue && Array.isArray(rawValue) && rawValue.length > 0) hasAnyValue = true;
          } else if (field.type === 'number') {
            value = (typeof rawValue === 'number' && !isNaN(rawValue)) ? rawValue : '';
            if (!hasAnyValue && typeof rawValue === 'number' && !isNaN(rawValue)) hasAnyValue = true;
          } else {
            value = rawValue || '';
            if (!hasAnyValue && rawValue) hasAnyValue = true;
          }
          moduleSavedObj[field.label] = value;
        }
      }

      if (hasAnyValue) {
        // There is saved data for this module
        this.formData = moduleSavedObj;
        this.lastSavedData = JSON.parse(JSON.stringify(moduleSavedObj));
        this.hasSavedDataToday = true;
        console.log('[DynamicModule] found saved data for this module, setting hasSavedDataToday = true', moduleSavedObj);
      } else {
        // No saved data for this module: initialize empty fields
        this.formData = {};
        for (const field of this.module.fields) {
          this.formData[field.label] = field.type === 'emoji' ? [] : '';
        }
        this.lastSavedData = null;
        this.hasSavedDataToday = false;
        console.log('[DynamicModule] no saved data for this module, setting hasSavedDataToday = false');
      }
    }
  },
  methods: {
    // Log any click inside the card
    onCardClick(event) {
      console.log('[DynamicModule] card @click triggered. Target:', event.target);
    },
    // Deep equality check for objects/arrays
    deepEqual(a, b) {
      if (a === b) return true;
      if (typeof a !== typeof b) return false;
      if (typeof a !== 'object' || a === null || b === null) return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) return false;
        }
        return true;
      }
      const keysA = Object.keys(a), keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    },

    toggleEmoji(label, opt) {
      // Only allow one mood selection per day: clear all emoji fields and set only the clicked one
      const emojiFields = this.module.fields.filter(f => f.type === 'emoji');
      for (const field of emojiFields) {
        this.formData[field.label] = [];
      }
      this.formData[label] = [opt];
      console.log('[DynamicModule] toggleEmoji (single mood):', { label, opt, formData: JSON.parse(JSON.stringify(this.formData)) });
    },
    async handleSubmit(bulkSave = false) {
      console.log('[DynamicModule] handleSubmit called');
      // Support both emoji (mood) and number (e.g., water intake) modules
      if (!this.userId) {
        console.log('[DynamicModule] Early return: missing userId', { userId: this.userId });
        return { success: false, error: 'Missing userId' };
      }
      // Collect all field data
      let dataToSave = {};
      let hasAnyData = false;
      for (const field of this.module.fields) {
        const value = this.formData[field.label];
        if (field.type === 'emoji') {
          if (Array.isArray(value) && value.length > 0) {
            hasAnyData = true;
          }
        } else if (field.type === 'number') {
          if (typeof value === 'number' && !isNaN(value)) {
            hasAnyData = true;
          }
        } else if (value) {
          hasAnyData = true;
        }
        dataToSave[field.label] = value;
      }
      if (!hasAnyData) {
        if (!bulkSave) {
          this.toastMessage = 'Please fill at least one field.';
          this.showToast = true;
          console.log('[DynamicModule] showToast true, message:', this.toastMessage);
          setTimeout(() => { this.showToast = false; }, 2000);
        }
        return { success: false, error: 'No data to save' };
      }
      const result = await saveMoodForToday(this.userId, dataToSave);
      console.log('[DynamicModule] saveMoodForToday result:', result);
      if (!result.success) {
        this.hasSavedDataToday = false;
        if (!bulkSave) {
          this.toastMessage = 'Failed to save data';
          this.showToast = true;
          console.log('[DynamicModule] showToast true, message:', this.toastMessage);
          setTimeout(() => { this.showToast = false; }, 2000);
        }
        return { success: false, error: 'Save failed' };
      }
      this.hasSavedDataToday = true;
      // After successful save, update lastSavedData to current formData
      this.lastSavedData = JSON.parse(JSON.stringify(this.formData));
      if (!bulkSave) {
        this.toastMessage = result.updated ? 'Data updated!' : 'Data saved!';
        this.showToast = true;
        console.log('[DynamicModule] showToast true, message:', this.toastMessage);
        setTimeout(() => { this.showToast = false; }, 2000);
      }
      return { success: true, updated: result.updated };
    }
  }
};
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
.mood-options {
  display: flex;
  gap: 1.2rem;
  margin-top: 0.5rem;
  justify-content: flex-start;
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
@media (max-width: 600px) {
  .wellness-tracker-card {
    padding: 1.2rem 0.6rem;
  }
  .save-btn {
    padding: 0.85rem 0.5rem;
    font-size: 1rem;
  }
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}
.module-icon {
  font-size: 2.2rem;
  margin-right: 0.75rem;
}
.module-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #2d3a4a;
}
.card-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-field-ui {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.field-label {
  font-weight: 600;
  color: #506690;
  margin-bottom: 0.2rem;
}
.emoji-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.emoji-toggle {
  font-size: 1.4rem;
  background: #f3f6fa;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.7rem;
  padding: 0.25rem 0.7rem;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  outline: none;
}
.emoji-toggle.selected {
  background: #4a90e2;
  color: #fff;
  border-color: #4a90e2;
}
.number-input {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
}
.save-btn {
  background: linear-gradient(90deg, #4a90e2 0%, #3578e5 100%);
  color: #fff;
  border: none;
  border-radius: 0.7rem;
  padding: 0.6rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 rgba(80,125,255,0.08);
  transition: background 0.2s;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
}
.save-btn:hover {
  background: linear-gradient(90deg, #3578e5 0%, #4a90e2 100%);
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
</style>

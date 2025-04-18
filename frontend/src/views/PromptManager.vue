<template>
  <div class="prompt-manager">
    <h1>Journal Prompts</h1>
    
    <!-- Frequency Selection -->
    <section class="frequency-section">
      <h2>Prompt Frequency</h2>
      <div class="frequency-options">
        <div class="frequency-option">
          <input 
            type="radio" 
            id="daily" 
            value="daily" 
            v-model="selectedFrequency"
          >
          <label for="daily">Daily</label>
        </div>
        <div class="frequency-option">
          <input 
            type="radio" 
            id="weekly" 
            value="weekly" 
            v-model="selectedFrequency"
          >
          <label for="weekly">Weekly</label>
        </div>
        <div class="frequency-option">
          <input 
            type="radio" 
            id="monthly" 
            value="monthly" 
            v-model="selectedFrequency"
          >
          <label for="monthly">Monthly</label>
        </div>
      </div>
    </section>

    <!-- Default Prompts Section -->
    <section class="default-prompts">
      <h2>Default Prompts</h2>
      <div class="prompt-grid">
        <div v-for="prompt in defaultPrompts" :key="prompt.id" class="prompt-card">
          <h3>{{ prompt.title }}</h3>
          <p>{{ prompt.description }}</p>
          <div class="prompt-actions">
            <button 
              @click="togglePrompt(prompt.id)"
              :class="{ 'active': !isLoading && selectedPrompts.includes(prompt.id) }"
            >
              {{ !isLoading && selectedPrompts.includes(prompt.id) ? 'Selected' : 'Select' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Custom Prompts Section -->
    <section class="custom-prompts">
      <h2>Your Custom Prompts</h2>
      <div class="add-prompt">
        <input 
          v-model="newPrompt.title" 
          placeholder="Prompt Title" 
          class="prompt-input"
        >
        <textarea 
          v-model="newPrompt.description" 
          placeholder="Prompt Description" 
          class="prompt-textarea"
        ></textarea>
        <button @click="addCustomPrompt" class="add-button">Add Custom Prompt</button>
      </div>
      
      <div class="prompt-grid">
        <div v-for="prompt in customPrompts" :key="prompt.id" class="prompt-card">
          <h3>{{ prompt.title }}</h3>
          <p>{{ prompt.description }}</p>
          <div class="prompt-actions">
            <button 
              @click="togglePrompt(prompt.id)"
              :class="{ 'active': !isLoading && selectedPrompts.includes(prompt.id) }"
            >
              {{ !isLoading && selectedPrompts.includes(prompt.id) ? 'Selected' : 'Select' }}
            </button>
            <button @click="deletePrompt(prompt.id)" class="delete-button">Delete</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PromptManager',
  setup() {
    const store = useStore()
    const defaultPrompts = ref([
      {
        id: 'reflection',
        title: 'Daily Reflection',
        description: 'What are three things you learned today?'
      },
      {
        id: 'gratitude',
        title: 'Gratitude',
        description: 'What are you grateful for today?'
      },
      {
        id: 'challenges',
        title: 'Challenges',
        description: 'What challenges did you face today and how did you handle them?'
      },
      {
        id: 'goals',
        title: 'Goals',
        description: 'What progress did you make toward your goals today?'
      }
    ])

    const customPrompts = ref([])
    const selectedPrompts = ref([])
    const isLoading = ref(true)
    const selectedFrequency = ref('daily')
    const newPrompt = ref({
      title: '',
      description: ''
    })

    const loadCustomPrompts = async () => {
      try {
        const prompts = await store.dispatch('prompts/loadCustomPrompts')
        customPrompts.value = prompts
      } catch (error) {
        console.error('Error loading custom prompts:', error)
      }
    }

    const loadSelectedPrompts = async () => {
      try {
        const prompts = await store.dispatch('prompts/loadSelectedPrompts')
        selectedPrompts.value = prompts || []
      } catch (error) {
        console.error('Error loading selected prompts:', error)
        selectedPrompts.value = []
      } finally {
        isLoading.value = false
      }
    }

    const loadFrequency = async () => {
      try {
        const frequency = await store.dispatch('prompts/loadFrequency')
        selectedFrequency.value = frequency || 'daily'
      } catch (error) {
        console.error('Error loading frequency:', error)
      }
    }

    const saveFrequency = async (frequency) => {
      try {
        await store.dispatch('prompts/saveFrequency', frequency)
      } catch (error) {
        console.error('Error saving frequency:', error)
        alert('Failed to save frequency. Please try again.')
      }
    }

    // Watch for frequency changes
    watch(selectedFrequency, (newFrequency) => {
      saveFrequency(newFrequency)
    })

    const addCustomPrompt = async () => {
      if (!newPrompt.value.title || !newPrompt.value.description) {
        alert('Please fill in both title and description')
        return
      }

      try {
        const prompt = await store.dispatch('prompts/addCustomPrompt', newPrompt.value)
        customPrompts.value.push(prompt)
        newPrompt.value = { title: '', description: '' }
      } catch (error) {
        console.error('Error adding custom prompt:', error)
      }
    }

    const deletePrompt = async (promptId) => {
      try {
        await store.dispatch('prompts/deletePrompt', promptId)
        customPrompts.value = customPrompts.value.filter(p => p.id !== promptId)
        selectedPrompts.value = selectedPrompts.value.filter(id => id !== promptId)
      } catch (error) {
        console.error('Error deleting prompt:', error)
      }
    }

    const togglePrompt = async (promptId) => {
      try {
        if (selectedPrompts.value.includes(promptId)) {
          await store.dispatch('prompts/removeSelectedPrompt', promptId)
          selectedPrompts.value = selectedPrompts.value.filter(id => id !== promptId)
        } else {
          await store.dispatch('prompts/addSelectedPrompt', promptId)
          selectedPrompts.value.push(promptId)
        }
        // Save the updated selected prompts to Firestore
        await store.dispatch('prompts/saveSelectedPrompts', selectedPrompts.value)
      } catch (error) {
        console.error('Error toggling prompt:', error)
        alert('Failed to update prompt selection. Please try again.')
      }
    }

    onMounted(() => {
      loadCustomPrompts()
      loadSelectedPrompts()
      loadFrequency()
    })

    return {
      defaultPrompts,
      customPrompts,
      selectedPrompts,
      newPrompt,
      isLoading,
      selectedFrequency,
      addCustomPrompt,
      deletePrompt,
      togglePrompt
    }
  }
}
</script>

<style scoped>
.prompt-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

h2 {
  color: #2c3e50;
  margin: 2rem 0 1rem;
}

.frequency-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.frequency-options {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.frequency-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.frequency-option input[type="radio"] {
  width: 1.2rem;
  height: 1.2rem;
}

.frequency-option label {
  font-size: 1.1rem;
  color: #2c3e50;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.prompt-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.prompt-card:hover {
  transform: translateY(-2px);
}

.prompt-card h3 {
  margin: 0 0 0.5rem;
  color: #2c3e50;
}

.prompt-card p {
  margin: 0 0 1rem;
  color: #666;
}

.prompt-actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button.active {
  background-color: #42b983;
  color: white;
}

.delete-button {
  background-color: #ff4444;
  color: white;
}

.delete-button:hover {
  background-color: #cc0000;
}

.add-prompt {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.prompt-input,
.prompt-textarea {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.prompt-textarea {
  min-height: 100px;
  resize: vertical;
}

.add-button {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}
</style> 
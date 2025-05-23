<template>
  <div class="home">
    <header class="header">
      <h1>Daily Reflection Journal</h1>
      <ModelSelector v-if="preferences.customPrompts" v-model="selectedModel" />
    </header>

    <main class="main-content">
      <div class="modules-list">
        <!-- static conversation card -->
        <ConversationModule
          class="wellness-tracker-card conversation-section"
          :conversation="conversation"
          :userInput="userInput"
          :isProcessing="isProcessing"
          :formatTimestamp="formatTimestamp"
          @submitMessage="submitMessage"
          @endConversation="endConversation"
          @update:userInput="val => userInput = val"
        />
        <!-- loading placeholder -->
        <template v-if="modules.length === 0">
          <div class="wellness-tracker-card loading-card">
            <strong>Loading modules...</strong>
          </div>
        </template>
        <draggable
          v-model="orderedModules"
          item-key="id"
          tag="div"
          style="display: contents;"
          :draggable="'.wellness-tracker-card:not(.conversation-section)'"
        >
          <template #item="{ element }">
            <DynamicModule
              class="wellness-tracker-card"
              :module="element"
              :userId="userId"
              @save="handleModuleSave"
              :key="element.id"
            />
          </template>
        </draggable>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import ModelSelector from '@/components/ModelSelector.vue'
import DynamicModule from '@/components/DynamicModule.vue'
import ConversationModule from '@/components/ConversationModule.vue'
import { fetchModules } from '@/services/modules'
import { defaultPreferences } from '@/store/modules/preferences'

export default {
  name: 'HomeView',
  components: {
    ModelSelector,
    DynamicModule,
    ConversationModule,
    draggable
  },
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const modules = ref([])
    // --- Module Dragging Logic ---
    const store = useStore()
    const preferences = computed(() => store.getters['preferences/getPreferences'])
    // Fetch modules from Firestore on mount
    onMounted(async () => {
      const fetched = await fetchModules();
      modules.value = Array.isArray(fetched)
        ? fetched.filter(m => m && m.id && m.fields)
        : [];
      // --- PATCH: If modules are not valid, use a hardcoded test module ---
      if (!modules.value.length || typeof modules.value[0] === 'string') {
        modules.value = [
          {
            id: 'test-mood',
            name: 'Mood Tracker',
            fields: [
              {
                label: 'Mood',
                type: 'emoji',
                options: ['😊', '😐', '😢', '😠']
              }
            ]
          }
        ];
        console.warn('[Home.vue] Using hardcoded test module. Fix fetchModules or Firestore schema for production.');
      }
      console.log('[Home.vue] modules.value after fetch:', JSON.parse(JSON.stringify(modules.value)));
    })

    // Watch for changes in preferences.moduleOrder and reorder modules accordingly
    watch(() => preferences.value.moduleOrder, (newOrder) => {
      if (Array.isArray(newOrder) && newOrder.length > 0 && modules.value.length > 0) {
        // reorder modules.value to match newOrder
        modules.value = newOrder
          .map(id => modules.value.find(m => m.id === id))
          .filter(Boolean)
      }
    })
    // Default order, can be extended
    const moduleOrder = computed(() => {
      const validModules = modules.value.filter(m => m && m.id && m.fields);
      const validIds = validModules.map(m => m.id);
      const prefOrder = preferences.value && preferences.value.moduleOrder
      if (Array.isArray(prefOrder) && prefOrder.length > 0) {
        // Only include ids that are in validIds
        return prefOrder.filter(id => validIds.includes(id));
      }
      return defaultPreferences.moduleOrder.filter(id => validIds.includes(id));
    })

    // Conversation and input state must be defined before orderedModules
    const selectedModel = ref('mistral')
    const userInput = ref('')
    const isProcessing = ref(false)
    const conversation = ref([])
    const selectedPrompts = ref([])
    const isLoading = ref(true)

    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString()
    }

    const addMessage = (content, type) => {
      if (!Array.isArray(conversation.value)) conversation.value = [];
      conversation.value.push({
        content,
        type,
        timestamp: new Date()
      })
    }

    const submitMessage = async () => {
      if (!userInput.value.trim() || isProcessing.value) return
      if (!props.userId) {
        console.error('User ID is required')
        return
      }
      const userMessage = userInput.value.trim()
      userInput.value = ''
      isProcessing.value = true
      // Add user message to conversation
      addMessage(userMessage, 'user')
      try {
        const response = await store.dispatch('submitJournalEntry', {
          entry: userMessage,
          conversation: conversation.value,
          model: selectedModel.value,
          userId: props.userId
        })
        // Add AI response to conversation
        addMessage(response, 'ai')
        // Save the conversation to journal history
        await store.dispatch('saveConversation', {
          conversation: conversation.value,
          userId: props.userId
        })
      } catch (error) {
        console.error('Error processing message:', error)
        addMessage('Sorry, I encountered an error. Please try again.', 'ai')
      } finally {
        isProcessing.value = false
      }
    }

    const endConversation = async () => {
      if (conversation.value.length <= 1) return
      try {
        // Save the current conversation
        await store.dispatch('saveConversation', {
          conversation: conversation.value,
          userId: props.userId
        })
        // Clear the conversation and start a new one
        conversation.value = [];
        const newPrompt = getRandomPrompt();
        addMessage(newPrompt, 'ai')
      } catch (error) {
        console.error('Error ending conversation:', error)
        alert('Failed to end conversation. Please try again.')
      }
    }

    // Always inject correct props for each module
    const orderedModules = computed(() => {
      // If no moduleOrder, show all modules
      if (!moduleOrder.value || moduleOrder.value.length === 0) {
        return modules.value;
      }
      const result = moduleOrder.value
        .map(id => modules.value.find(m => m.id === id))
        .filter(Boolean)
      return result;
    })



    // Update order in Vuex and backend
    const updateModuleOrder = (modules) => {
      const order = modules.map(m => m.id)
      store.commit('preferences/SET_PREFERENCE', { feature: 'moduleOrder', enabled: order })
      store.dispatch('preferences/saveAllPreferences')
    }
    // --- End Module Dragging Logic ---

    const defaultPrompts = [
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
        description: 'What progress did you made toward your goals today?'
      }
    ]

    const getRandomPrompt = () => {
      if (selectedPrompts.value.length > 0) {
        const promptId = selectedPrompts.value[Math.floor(Math.random() * selectedPrompts.value.length)]
        const prompt = defaultPrompts.find(p => p.id === promptId) || 
                      store.state.prompts.customPrompts.find(p => p.id === promptId)
        return prompt ? prompt.description : 'What are your thoughts today?'
      } else {
        return defaultPrompts[Math.floor(Math.random() * defaultPrompts.length)].description
      }
    }


    const loadSelectedPrompts = async () => {
      try {
        isLoading.value = true
        const prompts = await store.dispatch('prompts/loadSelectedPrompts')
        selectedPrompts.value = prompts || []
        console.log('Loaded selected prompts:', selectedPrompts.value)
      } catch (error) {
        console.error('Error loading selected prompts:', error)
        selectedPrompts.value = []
      } finally {
        isLoading.value = false
      }
    }

    // Watch for changes in the store's selected prompts
    watch(() => store.state.prompts.selectedPrompts, (newPrompts) => {
      console.log('Store selected prompts changed:', newPrompts)
      selectedPrompts.value = newPrompts
    }, { immediate: true })

    // Initialize conversation with a greeting
    onMounted(async () => {
      await loadSelectedPrompts()
      const initialPrompt = getRandomPrompt()
      addMessage(initialPrompt, 'ai')
      // Fix: forcibly set moduleOrder to correct array if not already
      if (!Array.isArray(preferences.value.moduleOrder) || preferences.value.moduleOrder.length === 0) {
        store.commit('preferences/SET_PREFERENCE', { feature: 'moduleOrder', enabled: defaultPreferences.moduleOrder })
        store.dispatch('preferences/saveAllPreferences');
      }
    })

    // Watch for userId changes
    watch(() => props.userId, (newUserId) => {
      if (newUserId) {
        loadSelectedPrompts();
      }
    }, { immediate: true });

    // Save module data handler
    const handleModuleSave = async ({ module, data }) => {
      // TODO: Save user data to Firestore, e.g., in a 'logs' collection
      // await saveModuleLog(props.userId, module, data)
      console.log('Saved', module, data)
    };

    // When user drags and drops modules, update preferences
    function onModuleOrderChange() {
      const newOrder = modules.value.map(m => m.id)
      store.dispatch('preferences/updateModuleOrder', newOrder)
    }






    return {
      selectedModel,
      userInput,
      isProcessing,
      conversation,
      submitMessage,
      endConversation,
      formatTimestamp,
      selectedPrompts,
      preferences,
      modules,
      handleModuleSave,
      onModuleOrderChange,
      handleModuleSave,
      onModuleOrderChange,
      orderedModules,
      // do NOT return dynamicModules
    };
  },
  methods: {

  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.conversation-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.end-conversation-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.end-conversation-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.conversation-box {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.message {
  margin-bottom: 1rem;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
}

.message-content {
  padding: 0.75rem;
  border-radius: 4px;
}

.message.user .message-content {
  background: var(--primary-color);
  color: white;
}

.message.ai .message-content {
  background: white;
}

.message small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.input-section {
  display: flex;
  gap: 1rem;
}

textarea {
  flex: 1;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

button {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.modules-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.modules-list > * {
  width: 100%;
}

/* conversation and loading placeholder span two columns */
.modules-list > .conversation-section,
.modules-list > .loading-card {
  grid-column: span 2;
}

.modules-list .wellness-tracker-card {
  max-width: none;
  width: 100%;
}

.loading-card {
  background: #ffeb3b;
  color: #b26a00;
  padding: 1em;
  border-radius: 8px;
  text-align: center;
}
</style>
<template>
  <div class="wellness-tracker-card conversation-section">
    <div class="conversation-header">
      <h2>Daily Reflection</h2>
      <button 
        @click="$emit('endConversation')" 
        class="end-conversation-btn"
        :disabled="conversation.length <= 1"
      >
        End Conversation
      </button>
    </div>
    <div class="conversation-box">
      <div v-for="(message, index) in (conversation || []).filter(m => m && m.content !== undefined)" :key="index" 
           :class="['message', message.type]">
        <div class="message-content">
          <p>{{ message.content }}</p>
          <small v-if="message.type === 'user'">{{ formatTimestamp(message.timestamp) }}</small>
        </div>
      </div>
      <div v-if="isProcessing" class="message ai">
        <div class="message-content">
          <p>Crafting reply...</p>
        </div>
      </div>
    </div>
    
    <div class="input-section">
      <textarea 
        :value="inputValue"
        @input="onInput"
        placeholder="Write your thoughts here..."
        :disabled="isProcessing"
        @keyup.enter.exact="$emit('submitMessage')"
      ></textarea>
      <button 
        @click="$emit('submitMessage')" 
        :disabled="!userInput.trim() || isProcessing"
      >
        {{ isProcessing ? 'Processing...' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConversationModule',
  props: {
    conversation: Array,
    userInput: String,
    isProcessing: Boolean,
    formatTimestamp: Function
  },
  emits: ['submitMessage', 'endConversation', 'update:userInput'],
  data() {
    return {
      inputValue: this.userInput || ''
    }
  },
  watch: {
    userInput(newVal) {
      this.inputValue = newVal || ''
    }
  },
  methods: {
    onInput(e) {
      this.inputValue = e.target.value
      this.$emit('update:userInput', this.inputValue)
    }
  }
}
</script>

<style scoped>
.wellness-tracker-card.conversation-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.conversation-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.end-conversation-btn {
  background: linear-gradient(90deg, #4a90e2 60%, #357ab8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(74,144,226,0.08);
  transition: background 0.2s, opacity 0.2s;
}
.end-conversation-btn:disabled {
  background: #b6c7db;
  cursor: not-allowed;
  opacity: 0.7;
}
.end-conversation-btn:not(:disabled):hover {
  opacity: 0.93;
  background: linear-gradient(90deg, #357ab8 20%, #4a90e2 100%);
}

.conversation-box {
  min-height: 160px;
  max-height: 320px;
  overflow-y: auto;
  padding: 1rem;
  background: #f3f6fa;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
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
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  font-size: 1rem;
}

.message.user .message-content {
  background: var(--primary-color, #4a90e2);
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
  margin-top: 1rem;
}

.input-section textarea {
  flex: 1;
  min-height: 60px;
  padding: 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 7px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.2s;
  resize: vertical;
}
.input-section textarea:focus {
  border-color: #4a90e2;
  outline: none;
}
.input-section button {
  background: linear-gradient(90deg, #4a90e2 60%, #357ab8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.85rem 1.3rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(74,144,226,0.08);
  transition: background 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.input-section button:disabled {
  background: #b6c7db;
  cursor: not-allowed;
  opacity: 0.7;
}
.input-section button:not(:disabled):hover {
  opacity: 0.93;
  background: linear-gradient(90deg, #357ab8 20%, #4a90e2 100%);
}

@media (max-width: 600px) {
  .wellness-tracker-card.conversation-section {
    padding: 1.2rem 0.6rem;
  }
  .conversation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }
  .conversation-box {
    padding: 0.5rem;
    margin-bottom: 1rem;
  }
  .input-section button {
    padding: 0.85rem 0.5rem;
    font-size: 1rem;
  }
}
</style>

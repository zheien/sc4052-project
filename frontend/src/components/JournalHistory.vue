<template>
  <div class="history-section">
    <h2>Journal History</h2>
    <div class="history-box">
      <div v-for="entry in entries" :key="entry.id" class="journal-entry">
        <h3>{{ entry.prompt }}</h3>
        <div class="conversation">
          <div v-for="(message, index) in entry.conversation" 
               :key="index"
               :class="['message', message.type]">
            <p>{{ message.content }}</p>
          </div>
        </div>
        <div class="date">{{ entry.formattedDate || formatDate(entry.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JournalHistory',
  props: {
    entries: {
      type: Array,
      required: true
    }
  },
  methods: {
    formatDate(timestamp) {
      if (!timestamp) return '';
      
      try {
        // Handle Firestore Timestamp
        if (timestamp.toDate) {
          return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        // Handle regular Date object or string
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', timestamp);
          return '';
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    }
  }
}
</script>

<style scoped>
.history-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.history-box {
  max-height: 400px;
  overflow-y: auto;
}

.journal-entry {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.journal-entry:last-child {
  border-bottom: none;
}

.journal-entry h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.conversation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.message {
  padding: 0.5rem;
  border-radius: 4px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  background: var(--primary-color);
  color: white;
}

.message.ai {
  align-self: flex-start;
  background: #f5f5f5;
}

.journal-entry .date {
  font-size: 0.8rem;
  color: #666;
}
</style>
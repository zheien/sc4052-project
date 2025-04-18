<template>
  <div class="model-selector">
    <label for="model">Select AI Model:</label>
    <select v-model="selectedModel" id="model">
      <option value="mistral">Mistral</option>
      <option value="llama2">LLaMA 2</option>
      <option value="mixtral">Mixtral</option>
      <option value="gemma">Gemma</option>
    </select>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ModelSelector',
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selectedModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    return {
      selectedModel
    }
  }
}
</script>

<style scoped>
.model-selector {
  margin-bottom: 1.5rem;
}

select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}
</style> 
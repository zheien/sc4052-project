<template>
  <div class="module-card-ui">
    <div class="card-header">
      <span class="module-icon">{{ module.icon }}</span>
      <span class="module-name">{{ module.name }}</span>
    </div>
    <form @submit.prevent="handleSubmit" class="card-form">
      <div v-for="field in module.fields" :key="field.label" class="form-field-ui">
        <label class="field-label">{{ field.label }}</label>
        <template v-if="field.type === 'emoji'">
          <div class="emoji-options">
            <button
              v-for="opt in field.options"
              :key="opt"
              type="button"
              :class="['emoji-toggle', { selected: formData[field.label] === opt } ]"
              @click="formData[field.label] = opt"
            >{{ opt }}</button>
          </div>
        </template>
        <template v-else-if="field.type === 'number'">
          <input
            type="number"
            :min="field.min"
            :max="field.max"
            v-model.number="formData[field.label]"
            class="number-input"
          />
        </template>
        <!-- Add more field types as needed -->
      </div>
      <button type="submit" class="save-btn">Save</button>
    </form>
  </div>
</template>


<script>
export default {
  name: "DynamicModule",
  props: {
    module: Object
  },
  data() {
    return {
      formData: {}
    };
  },
  methods: {
    handleSubmit() {
      // Emit data to parent (Home.vue)
      this.$emit("save", { module: this.module.name, data: this.formData });
      this.formData = {};
    }
  }
};
</script>

<style scoped>
.module-card-ui {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px 0 rgba(80,125,255,0.08), 0 1.5px 6px 0 rgba(80,125,255,0.04);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  margin-bottom: 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  transition: box-shadow 0.2s;
}
.module-card-ui:hover {
  box-shadow: 0 6px 32px 0 rgba(80,125,255,0.13), 0 2px 8px 0 rgba(80,125,255,0.06);
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
}
.save-btn:hover {
  background: linear-gradient(90deg, #3578e5 0%, #4a90e2 100%);
}
</style>

<template>
  <draggable v-model="internalModules" @end="onDragEnd" item-key="id" class="draggable-modules" :animation="200">
    <template #item="{ element }">
      <component
        :is="element.component"
        v-bind="element.props"
        v-on="element.listeners || {}"
      />
    </template>
  </draggable>
</template>

<script>
import draggable from 'vuedraggable';
import WellnessTracker from './WellnessTracker.vue';
import ConversationModule from './ConversationModule.vue';
import WaterIntakeModule from './WaterIntakeModule.vue';
import WeatherModule from './WeatherModule.vue';

export default {
  name: 'ModuleDraggable',
  components: { draggable, WellnessTracker, ConversationModule, WaterIntakeModule, WeatherModule },
  props: {
    modules: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modules'],
  data() {
    return {
      internalModules: [...this.modules]
    };
  },
  watch: {
    modules(newVal) {
      this.internalModules = [...newVal];
    }
  },
  methods: {
    onDragEnd() {
      this.$emit('update:modules', this.internalModules);
    }
  }
};
</script>

<style scoped>
.draggable-modules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
}
.draggable-modules > * {
  width: 100%;
}
</style>

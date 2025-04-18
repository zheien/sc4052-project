<template>
  <div class="feature-settings p-4">
    <h2 class="text-xl font-bold mb-4">Select Modules</h2>
    <div class="grid grid-cols-2 gap-6">
      <!-- Available Modules -->
      <div>
        <h3 class="font-semibold mb-2">Available</h3>
        <draggable
          :list="availableModules"
          :group="{ name: 'modules', pull: 'clone', put: false }"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          animation="200"
          class="modules-list grid grid-cols-2 gap-4 p-4 border-dashed border-2 border-gray-300 rounded bg-white shadow-sm"
        >
          <template #item="{ element }">
            <span class="block px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full cursor-move transition">
              {{ formatFeatureName(element) }}
            </span>
          </template>
        </draggable>
      </div>
      <!-- Selected Modules -->
      <div>
        <h3 class="font-semibold mb-2">Selected</h3>
        <draggable
          v-model="moduleOrder"
          :group="{ name: 'modules', pull: false, put: true }"
          @end="onModuleOrderChange"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          animation="200"
          class="modules-list grid grid-cols-2 gap-4 p-4 border border-gray-300 rounded bg-white shadow-sm min-h-[100px] relative"
        >
          <template #item="{ element }">
            <div class="flex items-center justify-between px-4 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full transition">
              <span>{{ formatFeatureName(element) }}</span>
              <button @click.stop="remove(element)" class="ml-2 text-red-500 hover:text-red-700">&times;</button>
            </div>
          </template>
          <!-- Placeholder when empty -->
          <div v-if="moduleOrder.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span class="text-gray-400 italic">Drag modules here</span>
          </div>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { defaultPreferences } from '@/store/modules/preferences'

export default {
  components: { draggable },
  name: 'FeatureSettings',
  setup() {
    const store = useStore()
    const preferences = computed(() => store.getters['preferences/getPreferences'])
    const defaultModules = [...defaultPreferences.moduleOrder]
    const moduleOrder = ref(
      Array.isArray(preferences.value.moduleOrder)
        ? [...preferences.value.moduleOrder]
        : [...defaultModules]
    )
    watch(preferences, () => {
      moduleOrder.value =
        Array.isArray(preferences.value.moduleOrder)
          ? [...preferences.value.moduleOrder]
          : [...defaultModules]
    })

    // compute available modules excluding selected
    const availableModules = computed(() => defaultPreferences.moduleOrder.filter(m => !moduleOrder.value.includes(m)))

    const formatFeatureName = (feature) =>
      feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()

    const onModuleOrderChange = () => {
      store.dispatch('preferences/updateModuleOrder', moduleOrder.value)
    }

    function remove(module) {
      moduleOrder.value = moduleOrder.value.filter(m => m !== module)
      onModuleOrderChange()
    }

    return {
      preferences,
      formatFeatureName,
      moduleOrder,
      onModuleOrderChange,
      availableModules,
      remove
    }
  }
}
</script>

<style scoped>
.switch {
  margin-left: auto;

  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.modules-list {
  min-height: 6rem;
}

.drag-ghost {
  opacity: 0.5;
}

.drag-chosen {
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.7);
}
</style>

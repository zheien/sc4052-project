<template>
  <div class="admin-module-manager p-4 border rounded bg-gray-50 mt-8">
    <h2 class="text-lg font-bold mb-4 flex items-center">
      <span class="mr-2">🛠️</span> Manage Global Modules
    </h2>
    <div v-if="loading" class="text-gray-500">Loading modules...</div>
    <div v-else>
      <div class="mb-6">
        <form @submit.prevent="onSubmit">
          <div class="flex flex-wrap gap-4 mb-2">
            <input v-model="form.id" placeholder="Module ID (e.g. mood)" class="input" required />
            <input v-model="form.name" placeholder="Name" class="input" required />
            <div class="flex items-center gap-2">
  <label class="font-semibold">Icon:</label>
  <span v-if="form.icon" class="text-2xl">{{ form.icon }}</span>
  <div class="flex flex-wrap gap-1">
    <button v-for="emoji in emojiKeyboard.slice(0, 30)" :key="emoji" type="button" class="emoji-btn" @click="form.icon = emoji">{{ emoji }}</button>
  </div>
</div>
            <input v-model.number="form.order" placeholder="Order" type="number" class="input w-24" required />
            <label class="flex items-center">
              <input type="checkbox" v-model="form.enabled" class="mr-1" /> Enabled
            </label>
          </div>
          <div class="mb-2">
            <label class="block font-semibold mb-1">Fields</label>
            <div v-for="(field, idx) in form.fields" :key="idx" class="flex flex-wrap items-center gap-2 mb-1">
              <select v-model="field.type" class="input w-28">
                <option value="emoji">Emoji</option>
                <option value="number">Number</option>
                <!-- Add more types as needed -->
              </select>
              <input v-model="field.label" placeholder="Label" class="input w-32" required />
              <template v-if="field.type === 'emoji'">
                <div class="flex flex-col">
                  <div class="flex flex-wrap gap-1 mb-1">
                    <span v-for="(emoji, eidx) in getEmojiOptions(field)" :key="eidx" class="inline-flex items-center px-2 py-1 bg-yellow-100 rounded-full text-lg">
                      {{ emoji }}
                      <button type="button" class="ml-1 text-red-500 hover:text-red-700" @click="removeEmojiOption(field, emoji)">&times;</button>
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <button v-for="emoji in emojiKeyboard" :key="emoji" type="button" class="emoji-btn" @click="addEmojiOption(field, emoji)">{{ emoji }}</button>
                  </div>
                </div>
              </template>
              <template v-if="field.type === 'number'">
                <input v-model.number="field.min" type="number" placeholder="Min" class="input w-16" />
                <input v-model.number="field.max" type="number" placeholder="Max" class="input w-16" />
              </template>
              <button type="button" class="btn btn-sm btn-red" @click="removeField(idx)">&times;</button>
            </div>
            <button type="button" class="btn btn-sm btn-blue mt-1" @click="addField">+ Add Field</button>
          </div>
          <button type="submit" class="btn btn-blue mr-2">{{ editMode ? 'Update' : 'Add' }} Module</button>
          <button v-if="editMode" type="button" class="btn btn-gray" @click="resetForm">Cancel</button>
        </form>
      </div>
      <div class="mt-8">
        <h3 class="font-semibold mb-2">Preview</h3>
        <div class="module-card-ui">
          <div class="card-header">
            <span class="module-icon">{{ form.icon }}</span>
            <span class="module-name">{{ form.name }}</span>
          </div>
          <form class="card-form" @submit.prevent>
            <div v-for="field in form.fields" :key="field.label" class="form-field-ui">
              <label class="field-label">{{ field.label }}</label>
              <template v-if="field.type === 'emoji'">
                <div class="emoji-options">
                  <button v-for="opt in getEmojiOptions(field)" :key="opt" type="button" class="emoji-toggle">{{ opt }}</button>
                </div>
              </template>
              <template v-else-if="field.type === 'number'">
                <input type="number" :min="field.min" :max="field.max" class="number-input" disabled />
              </template>
            </div>
            <button type="button" class="save-btn" disabled>Save</button>
          </form>
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-2">Existing Modules</h3>
        <table class="w-full text-left border-t">
          <thead>
            <tr>
              <th class="py-1">ID</th>
              <th>Name</th>
              <th>Icon</th>
              <th>Order</th>
              <th>Enabled</th>
              <th>Fields</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mod in modules" :key="mod.id">
              <td class="py-1">{{ mod.id }}</td>
              <td>{{ mod.name }}</td>
              <td>{{ mod.icon }}</td>
              <td>{{ mod.order }}</td>
              <td>{{ mod.enabled ? 'Yes' : 'No' }}</td>
              <td><pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(mod.fields, null, 1) }}</pre></td>
              <td>
                <button class="btn btn-sm btn-yellow mr-1" @click="editModule(mod)">Edit</button>
                <button class="btn btn-sm btn-red" @click="deleteModule(mod.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase'
import {
  collection, getDocs, setDoc, doc, deleteDoc, updateDoc
} from 'firebase/firestore'

export default {
  name: 'AdminModuleManager',
  setup() {
    // Emoji keyboard for field creation
    const emojiKeyboard = [
      '😀','😐','😢','😂','😍','😡','😴','😱','🤔','👍','👎','🙏','🥳','😇','😎','😭','😤','🤗','😬','😅','😆','😃','😊','😔','😕','😲','😳','😞','😩','😡','😜','🤩','🥰','😏','😶','😷','🤒','🤕','🤠','😇','😈','👻','💩','🤡','👽','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','🙈','🙉','🙊','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦓','🦍','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦥','🦦','🦨','🦡','🐁','🐀','🐇','🐿️','🦔'
    ];
    function addEmojiOption(field, emoji) {
      let arr = getEmojiOptions(field);
      if (!arr.includes(emoji)) {
        arr.push(emoji);
        field.optionsString = arr.join(', ');
      }
    }
    function removeEmojiOption(field, emoji) {
      let arr = getEmojiOptions(field).filter(e => e !== emoji);
      field.optionsString = arr.join(', ');
    }
    function getEmojiOptions(field) {
      return (field.optionsString ? field.optionsString.split(',').map(s => s.trim()).filter(Boolean) : []);
    }

    const modules = ref([])
    const loading = ref(true)
    const editMode = ref(false)
    const form = ref({ id: '', name: '', icon: '', order: 1, enabled: true, fields: [] })

    function addField() {
      form.value.fields.push({ type: 'emoji', label: '', optionsString: '', options: [], min: undefined, max: undefined })
    }
    function removeField(idx) {
      form.value.fields.splice(idx, 1)
    }

    function processFieldsBeforeSave() {
      // Convert optionsString to options array for emoji fields
      return form.value.fields.map(f => {
        if (f.type === 'emoji') {
          return {
            type: f.type,
            label: f.label,
            options: f.optionsString ? f.optionsString.split(',').map(s => s.trim()).filter(Boolean) : []
          }
        } else if (f.type === 'number') {
          return {
            type: f.type,
            label: f.label,
            min: f.min,
            max: f.max
          }
        }
        // add more types as needed
        return f
      })
    }

    async function fetchModules() {
      loading.value = true
      const snapshot = await getDocs(collection(db, 'modules'))
      modules.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      loading.value = false
    }

    async function onSubmit() {
      const preparedFields = processFieldsBeforeSave()
      await setDoc(doc(db, 'modules', form.value.id), { ...form.value, fields: preparedFields })
      await fetchModules()
      resetForm()
    }

    function editModule(mod) {
      form.value = { ...mod, fields: mod.fields.map(f => {
        if (f.type === 'emoji') {
          return { ...f, optionsString: (f.options || []).join(', ') }
        }
        return { ...f }
      }) }
      editMode.value = true
    }

    async function deleteModule(id) {
      if (confirm('Delete this module?')) {
        await deleteDoc(doc(db, 'modules', id))
        await fetchModules()
      }
    }

    function resetForm() {
      form.value = { id: '', name: '', icon: '', order: 1, enabled: true, fields: [] }
      editMode.value = false
    }

    onMounted(fetchModules)

    return {
      addField,
      removeField,
      processFieldsBeforeSave,
      emojiKeyboard,
      addEmojiOption,
      removeEmojiOption,
      getEmojiOptions,
      form,
      editMode,
      onSubmit,
      editModule,
      deleteModule,
      resetForm,
      modules,
      loading
    }
  }
}
</script>

<style scoped>
.input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}
.btn {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.btn-blue { background: #2563eb; color: #fff; }
.btn-gray { background: #e5e7eb; color: #111; }
.btn-yellow { background: #fde68a; color: #b45309; }
.btn-red { background: #ef4444; color: #fff; }
.btn-sm { font-size: 0.8rem; padding: 0.1rem 0.5rem; }
.emoji-btn {
  font-size: 1.25rem;
  background: #fffbe7;
  border: 1px solid #fbbf24;
  border-radius: 0.5rem;
  padding: 0.15rem 0.4rem;
  cursor: pointer;
  transition: background 0.2s;
}
.emoji-btn:hover {
  background: #fbbf24;
}
pre {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}
</style>

<template>
  <div class="admin-module-manager max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-10" style="background: #fff; border-radius: 1.25rem; box-shadow: 0 4px 24px 0 rgba(80,125,255,0.08), 0 1.5px 6px 0 rgba(80,125,255,0.04); padding: 2.5rem 2rem 2rem 2rem; margin-top: 2.5rem;">
    <h2 class="text-lg font-bold mb-4 flex items-center">
      <span class="mr-2">🛠️</span> Manage Global Modules
    </h2>
    <div v-if="loading" class="text-gray-500">Loading modules...</div>
    <div v-else>
      <div class="mb-8">
        <div class="bg-gray-50 rounded-lg p-6 shadow-sm mb-8">
          <h3 class="text-lg font-semibold mb-4 text-blue-700">Add or Edit Module</h3>
        <form @submit.prevent="onSubmit" class="space-y-5">
          <div class="flex flex-col md:flex-row gap-4 mb-2">
            <input v-model="form.name" placeholder="Name" class="input" required />

            <label class="flex items-center">
              <input type="checkbox" v-model="form.enabled" class="mr-1" /> Enabled
            </label>
          </div>
          <div class="mb-2">
            <div class="font-semibold mb-2 text-gray-700">Fields</div>
            <div v-for="(field, idx) in form.fields" :key="idx" class="flex flex-col md:flex-row md:items-center gap-2 mb-2 bg-gray-100 rounded p-3">
              <div class="flex gap-2 flex-1">
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
              </div>
              <button type="button" class="btn btn-sm btn-red self-start md:self-center" @click="removeField(idx)">&times;</button>
            </div>
            <div class="add-field-btn-row flex justify-end">
              <button type="button" class="btn btn-xs btn-blue add-field-btn" @click="addField">+ Add Field</button>
            </div>
          </div>
          <div class="form-action-btn-group flex justify-center md:justify-end">
            <button type="submit" class="btn btn-blue module-btn hover:shadow-md transition-shadow duration-200">{{ editMode ? 'Update' : 'Add' }} Module</button>
            <button v-if="editMode" type="button" class="btn btn-gray module-btn hover:shadow-md transition-shadow duration-200" @click="resetForm">Cancel</button>
          </div>
        </form>
      </div>
      <div class="mt-8">
        <h3 class="font-semibold mb-2 mt-10">Preview</h3>
        <div class="module-card-ui bg-gray-50 rounded-lg shadow-sm p-5">
          <div class="card-header mb-3">
            <span class="module-name font-semibold text-blue-800 text-lg">{{ form.name }}</span>
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
        <h3 class="font-semibold mb-2 mt-10">Existing Modules</h3>
        <div class="overflow-x-auto rounded-lg shadow-sm">
          <table class="w-full text-left border-t bg-white">
            <thead class="bg-gray-100">
              <tr style="display: grid; grid-template-columns: 1.5fr 1fr 2.5fr 1.2fr; align-items: center; gap: 0.5rem;">
                <th class="py-2 px-3 font-semibold text-gray-700">Name</th>
                <th class="py-2 px-3 font-semibold text-gray-700">Enabled</th>
                <th class="py-2 px-3 font-semibold text-gray-700">Fields</th>
                <th class="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mod, index) in modules" :key="mod.id" :class="(index % 2 === 0) ? 'bg-gray-50' : ''" style="display: grid; grid-template-columns: 1.5fr 1fr 2.5fr 1.2fr; align-items: center; gap: 0.5rem;">
                <td class="py-2 px-3">{{ mod.name }}</td>
                <td class="py-2 px-3">{{ mod.enabled ? 'Yes' : 'No' }}</td>
                <td class="py-2 px-3"><ul class="field-list">
  <li v-for="field in mod.fields" :key="field.label">
    <span class="font-semibold">{{ field.label }}</span> ({{ field.type }})
    <span v-if="field.type === 'emoji' && field.options && field.options.length">: <span class="emoji-options">{{ field.options.join(' ') }}</span></span>
    <span v-else-if="field.type === 'number'">: Min {{ field.min }} – Max {{ field.max }}</span>
  </li>
</ul></td>
                <td class="py-2 px-3">
                  <div class="action-btn-group">
                    <button class="btn btn-sm btn-yellow module-btn" @click="editModule(mod)">Edit</button>
                    <button class="btn btn-sm btn-red module-btn" @click="deleteModule(mod.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
      let id = form.value.id
      if (!id || typeof id !== 'string' || id.trim() === '') {
        if (!editMode.value) {
          id = Date.now().toString()
          form.value.id = id
        } else {
          alert('Module ID cannot be empty. Please provide a valid ID.')
          return
        }
      }
      try {
        await setDoc(doc(db, 'modules', id), { ...form.value, fields: preparedFields })
        await fetchModules()
        resetForm()
      } catch (err) {
        alert('Error saving module: ' + (err?.message || err));
      }
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
  padding: 0.3rem 0.95rem;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 2px rgba(80,125,255,0.04);
  transition: background 0.18s;
}
.btn:focus {
  outline: 2px solid #2563eb;
}
.btn-sm {
  font-size: 0.92rem;
  padding: 0.13rem 0.7rem;
}
.btn-yellow {
  background: #fde68a;
  color: #b45309;
}
.btn-yellow:hover {
  background: #fbbf24;
  color: #a16207;
}
.btn-red {
  background: #ef4444;
  color: #fff;
}
.btn-red:hover {
  background: #dc2626;
}
.btn-blue {
  background: #2563eb;
  color: #fff;
}
.btn-blue:hover {
  background: #1d4ed8;
}
.btn-gray {
  background: #e5e7eb;
  color: #111;
}
.input {
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.5rem 0.85rem;
  margin-bottom: 0.2rem;
  font-size: 1rem;
  background: #f9fafb;
  transition: border-color 0.18s;
}
.input:focus {
  border-color: #2563eb;
  background: #fff;
}
pre {
  background: #f3f4f6;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.98em;
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
.action-btn-group {
  display: flex;
  gap: 1rem;
  margin: 0.25rem 0 0.15rem 0;
}
.module-btn {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(80,125,255,0.08);
  margin: 0 2px;
  transition: box-shadow 0.18s, transform 0.13s;
}
.module-btn:hover {
  box-shadow: 0 2px 8px rgba(37,99,235,0.18);
  transform: translateY(-2px) scale(1.04);
  filter: brightness(1.04);
}
.add-field-btn-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 0.2rem;
}
.add-field-btn {
  min-width: 120px;
  max-width: 160px;
  padding: 0.45rem 1.1rem;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(80,125,255,0.09);
  transition: box-shadow 0.18s, transform 0.13s, background 0.18s;
  margin-left: 0.5rem;
}
.add-field-btn:hover {
  box-shadow: 0 2px 8px rgba(37,99,235,0.18);
  transform: translateY(-2px) scale(1.04);
  filter: brightness(1.05);
  background: #2563eb;
  color: #fff;
}
.form-action-btn-group {
  display: flex;
  gap: 1.1rem;
  margin-top: 1.2rem;
  margin-bottom: 0.5rem;
  justify-content: flex-end;
}
@media (max-width: 600px) {
  .form-action-btn-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.7rem;
    justify-content: center;
  }
}
.module-btn {
  min-width: 120px;
  padding: 0.48rem 1.1rem;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(80,125,255,0.09);
  transition: box-shadow 0.18s, transform 0.13s, background 0.18s;
  margin: 0;
}
.module-btn:hover {
  box-shadow: 0 2px 8px rgba(37,99,235,0.18);
  transform: translateY(-2px) scale(1.04);
  filter: brightness(1.05);
  background: #2563eb;
  color: #fff;
}
</style>

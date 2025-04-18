<template>
    <div class="min-h-screen flex flex-col justify-center items-center p-6">
        <div class="settings-page m-6 p-6 w-full max-w-3xl">
            <h1 class="text-2xl font-bold mb-6 text-center">Settings</h1>
            <FeatureSettings />
            <AdminModuleManager />
        </div>
    </div>
</template>

<script>
import FeatureSettings from '@/components/FeatureSettings.vue'
import AdminModuleManager from '@/components/AdminModuleManager.vue'

export default {
  name: 'Settings',
  components: {
    FeatureSettings,
    AdminModuleManager
  }
}
</script>

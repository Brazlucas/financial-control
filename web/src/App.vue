<template>
  <v-app>
    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
    
    <MinimalLoader 
      :visible="loaderState.visible"
      :type="loaderState.type"
      :text="loaderState.message"
      :progress="loaderState.progress"
      :skeleton-count="loaderState.skeletonCount"
      :size="loaderState.size === 'large' ? 80 : loaderState.size === 'small' ? 32 : 64"
    />
  </v-app>
</template>

<script setup lang="ts">
import MinimalLoader from '@/components/MinimalLoader.vue'
import { useGlobalLoader } from '@/stores/loader'

const { loaderState } = useGlobalLoader()
</script>
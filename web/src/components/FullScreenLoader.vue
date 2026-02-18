<template>
  <v-overlay
    :model-value="loading"
    class="align-center justify-center"
    persistent
    opacity="0.9"
    color="background"
    style="z-index: 99999 !important;"
  >
    <div class="text-center d-flex flex-column align-center">
      <v-progress-circular
        indeterminate
        size="80"
        width="8"
        color="primary"
        class="mb-6"
      ></v-progress-circular>
      
      <h2 class="text-h4 font-weight-bold mb-2 text-primary">
        Organizando suas finanças...
      </h2>
      <p class="text-h6 text-medium-emphasis">
        Isso pode levar alguns segundos.
      </p>
      
      <!-- Optional: Add random "tips" or "status" later -->
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  loading: boolean;
}>();
</script>

<style scoped>
/* Add any specific animations if needed */
</style>

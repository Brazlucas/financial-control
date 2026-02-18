<template>
  <div v-if="visible" class="minimal-loader" :class="{ 'fullscreen': type === 'overlay' }">
    <!-- Spinner / Overlay -->
    <div v-if="type === 'spinner' || type === 'overlay'" class="d-flex flex-column align-center">
      <v-progress-circular
        indeterminate
        color="primary"
        :size="size"
        :width="width"
      ></v-progress-circular>
      <div v-if="text" class="mt-4 text-subtitle-2 text-medium-emphasis font-weight-medium">
        {{ text }}
      </div>
    </div>

    <!-- Skeleton -->
    <div v-else-if="type === 'skeleton'" class="w-100">
      <v-skeleton-loader
        v-for="n in skeletonCount"
        :key="n"
        class="mb-3"
        :type="'list-item-two-line'"
        elevation="1"
      ></v-skeleton-loader>
      <div v-if="text" class="text-center mt-2 text-caption text-disabled">
        {{ text }}
      </div>
    </div>

    <!-- Progress Linear -->
    <div v-else-if="type === 'progress'" class="w-100 px-4" style="max-width: 400px;">
      <div class="d-flex justify-space-between mb-2">
        <span class="text-body-2 font-weight-medium">{{ text }}</span>
        <span class="text-body-2 text-primary">{{ Math.round(progress) }}%</span>
      </div>
      <v-progress-linear
        :model-value="progress"
        color="primary"
        height="8"
        rounded
        striped
      ></v-progress-linear>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'spinner', // spinner, overlay, skeleton, progress
  },
  text: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 64
  },
  width: {
    type: [Number, String],
    default: 4
  },
  skeletonCount: {
    type: Number,
    default: 3
  },
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.minimal-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(var(--v-theme-background), 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
}
</style>

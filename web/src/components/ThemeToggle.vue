<template>
  <v-btn
    icon
    variant="text"
    @click="toggleTheme"
    :title="isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'"
  >
    <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme();
const isDark = ref(true);

onMounted(() => {
  const savedTheme = localStorage.getItem('user-theme');
  if (savedTheme) {
    theme.global.name.value = savedTheme;
    isDark.value = savedTheme === 'minimalDark';
  } else {
    // Default to dark if no preference
    theme.global.name.value = 'minimalDark';
    isDark.value = true;
  }
});

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'minimalLight' : 'minimalDark';
  theme.global.name.value = newTheme;
  isDark.value = newTheme === 'minimalDark';
  localStorage.setItem('user-theme', newTheme);
};
</script>

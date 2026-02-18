import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  components,
  directives,
  theme: {
    defaultTheme: 'minimalDark',
    themes: {
      minimalLight: {
        dark: false,
        colors: {
          background: '#FFFFFF',
          surface: '#F8F9FA',
          primary: '#1A1A1A', // Preto premium
          secondary: '#6C757D', // Cinza elegante
          accent: '#212529',
          error: '#DC3545',
          info: '#0DCAF0',
          success: '#198754',
          warning: '#FFC107',
        },
      },
      minimalDark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          primary: '#FFFFFF', // Branco puro
          secondary: '#A0A0A0', // Cinza médio
          accent: '#E0E0E0',
          error: '#CF6679',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
    },
  },
})

createApp(App).use(vuetify).use(router).use(createPinia()).mount('#app')


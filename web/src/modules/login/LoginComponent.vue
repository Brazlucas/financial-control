<template>
  <div class="login-container">
    <div class="minimal-background"></div>
    
    <v-container class="h-100 w-100 d-flex align-center justify-center pa-0">
      <v-card
        class="pa-8 login-card"
        elevation="10"
        max-width="450"
        width="100%"
        rounded="xl"
      >
        <div class="text-center mb-8">
          <v-avatar color="primary" size="80" class="mb-4 elevation-3">
            <v-icon size="48" color="on-primary">mdi-shield-check</v-icon>
          </v-avatar>
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            Bem-vindo
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Financial Control v3.0
          </p>
        </div>

        <v-form @submit.prevent="handleLogin" ref="formRef" v-model="formIsValid">
          <v-text-field
            v-model="form.email"
            label="Email"
            :rules="[rules.required, rules.email]"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-4"
          />

          <v-text-field
            v-model="form.password"
            label="Senha"
            :rules="[rules.required]"
            type="password"
            prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-6"
          />

          <v-btn
            type="submit"
            color="primary"
            size="large"
            :disabled="!formIsValid || isLoading"
            block
            flat
            class="login-btn text-none font-weight-bold"
            height="48"
          >
            <MinimalLoader 
              v-if="isLoading" 
              :size="24"
              :width="3"
            />
            <span v-else>Entrar no Sistema</span>
          </v-btn>
        </v-form>

        <div class="text-center mt-8">
          <p class="text-caption text-disabled">
            &copy; {{ new Date().getFullYear() }} Financial Control. Todos os direitos reservados.
          </p>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useLogin } from './composables/useLogin'
import MinimalLoader from '@/components/MinimalLoader.vue'

const form = reactive({ email: '', password: '' })
const formRef = ref()
const formIsValid = ref(false)
const isLoading = ref(false)

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
}

const { login } = useLogin()

const handleLogin = async () => {
  if (!formRef.value?.validate()) return
  isLoading.value = true
  try {
    await login(form.email, form.password)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--v-theme-background));
  overflow: hidden;
}

.minimal-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Subtle gradient for premium feel */
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-surface), 1) 100%);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 10;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>

<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2 neon-pulse title-main">
              <v-icon size="32" class="mr-2">mdi-security</v-icon>
              PAINEL ADMINISTRATIVO
            </h1>
            <p class="text-subtitle-1" style="color: var(--neon-cyan); opacity: 0.8;">
              Sistema de Controle Financeiro v3.0
            </p>
          </div>
          <div class="d-flex">
            <v-btn
              class="mb-4"
              color="primary"
              prepend-icon="mdi-arrow-left"
              variant="outlined"
              @click="goBack"
            >
              Voltar para Dashboard
            </v-btn>
            <v-btn
              color="red"
              class="mb-6 ml-5"
              prepend-icon="mdi-logout"
              variant="elevated"
              @click="userLogout"
            >
              Logout
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" grow class="mt-8 mb-6">
      <v-tab value="categories">
        <v-icon start>mdi-shape</v-icon>
        Categorias
      </v-tab>
      <v-tab value="transactions">
        <v-icon start>mdi-swap-horizontal</v-icon>
        Transações
      </v-tab>
      <v-tab value="users">
        <v-icon start>mdi-account-group</v-icon>
        Usuários
      </v-tab>
    </v-tabs>

    <div class="mt-6">
      <KeepAlive>
        <CategoryManagement v-if="tab === 'categories'" />
        <TransactionManagement v-else-if="tab === 'transactions'" />
        <UserManagement v-else-if="tab === 'users'" />
      </KeepAlive>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryManagement from './components/CategoryManagement.vue'
import TransactionManagement from './components/TransactionManagement.vue'
import UserManagement from './components/UserManagement.vue'

const router = useRouter()
const tab = ref('categories')

const goBack = () => {
  router.push('/home')
}

const userLogout = () => {
  router.push('/login')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.clear()
}
</script>

<style scoped>
.neon-pulse {
  animation: neonPulse 3s ease-in-out infinite;
}
</style>

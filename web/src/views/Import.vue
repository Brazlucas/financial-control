<template>
  <v-container>
    <FullScreenLoader :loading="loading" />
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-card-title class="text-h5">Importar Extrato Bancário (.OFX)</v-card-title>
          <v-card-text>
            <v-file-input
              v-model="file"
              label="Selecione o arquivo .OFX"
              accept=".ofx"
              show-size
              prepend-icon="mdi-file-upload"
              variant="outlined"
            ></v-file-input>

            <v-alert
              v-if="uploadStatus"
              :type="uploadStatus.success ? 'success' : 'error'"
              class="mt-4"
              variant="tonal"
            >
              <div v-if="uploadStatus.success">
                <strong>Importação concluída!</strong><br />
                Processados: {{ uploadStatus.processed }}<br />
                Duplicados (ignorados): {{ uploadStatus.duplicates }}<br />
                Total no arquivo: {{ uploadStatus.total }}
              </div>
              <div v-else>
                {{ uploadStatus.message }}
              </div>
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              color="grey-darken-1"
              @click="$router.push('/')"
            >
              Voltar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!file"
              @click="uploadFile"
            >
              Importar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/services/http.service';
import FullScreenLoader from '@/components/FullScreenLoader.vue';

const file = ref<File | null>(null);
const loading = ref(false);
const uploadStatus = ref<any>(null);

const uploadFile = async () => {
  if (!file.value) return;

  loading.value = true;
  uploadStatus.value = null;

  const formData = new FormData();
  formData.append('file', file.value);

  try {
    const response = await api.post('/ofx/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    uploadStatus.value = {
      success: true,
      ...response.data,
    };
    file.value = null; // Clear input on success
  } catch (error: any) {
    console.error('Upload error:', error);
    uploadStatus.value = {
      success: false,
      message: error.response?.data?.message || 'Erro ao realizar upload.',
    };
  } finally {
    loading.value = false;
  }
};
</script>

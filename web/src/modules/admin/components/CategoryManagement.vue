<template>
  <v-card flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6">Gerenciar Categorias</span>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        Nova Categoria
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="categories"
        :loading="loading"
        :sort-by="[{ key: 'createdAt', order: 'desc' }]"
        density="comfortable"
        class="elevation-1"
      >
        <template v-slot:item.type="{ item }">
          <v-chip :color="item.type === 'ENTRY' ? 'green' : 'red'" dark size="small">
            {{ item.type === 'ENTRY' ? 'Entrada' : 'Saída' }}
          </v-chip>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ item.createdAt ? formatDate(item.createdAt) : '-' }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-tooltip location="top" v-if="(item as any).isSystem">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-inline-block">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="grey"
                  disabled
                />
              </div>
            </template>
            <span>Categoria padrão não pode ser editada</span>
          </v-tooltip>

          <v-btn
            v-else
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
          />
          
          <!-- Botão desativado com tooltip para categorias do sistema -->
          <v-tooltip location="top" v-if="(item as any).isSystem">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-inline-block">
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="grey"
                  disabled
                />
              </div>
            </template>
            <span>Categoria padrão não pode ser excluída</span>
          </v-tooltip>

          <!-- Botão normal de excluir -->
          <v-btn
            v-else
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card-text>

    <!-- Dialog de Criar/Editar -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ isEdit ? 'Editar' : 'Nova' }} Categoria</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formIsValid">
            <v-text-field
              v-model="form.name"
              label="Nome da categoria"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-2"
            />

            <v-select
              v-model="form.type"
              :items="typeOptions"
              item-title="text"
              item-value="value"
              label="Tipo"
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :disabled="!formIsValid"
            @click="handleSubmit"
            class="cyberpunk-btn"
          >
            {{ isEdit ? 'Atualizar' : 'Criar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirmar Exclusão</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir a categoria <strong>{{ categoryToDelete?.name }}</strong>?
          Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="elevated" @click="handleDelete" class="cyberpunk-btn">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de Feedback -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminCategoryService, type Category } from '../services/admin-category.service'
import CyberpunkLoader from '@/components/CyberpunkLoader.vue'
import { useGlobalLoader } from '@/stores/loader'

const categories = ref<Category[]>([])
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const formRef = ref()
const formIsValid = ref(false)
const isEdit = ref(false)
const categoryToDelete = ref<Category | null>(null)

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Loader global para operações
const { showOverlay, hideLoader } = useGlobalLoader()

const form = reactive({
  id: 0,
  name: '',
  type: 'ENTRY' as 'ENTRY' | 'EXIT',
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nome', key: 'name', sortable: true },
  { title: 'Tipo', key: 'type', sortable: true },
  { title: 'Criado em', key: 'createdAt', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

const typeOptions = [
  { text: 'Entrada', value: 'ENTRY' },
  { text: 'Saída', value: 'EXIT' },
]

const rules = {
  required: (v: string) => !!v || 'Campo obrigatório',
}

const loadCategories = async () => {
  loading.value = true
  try {
    categories.value = await adminCategoryService.getAll()
  } catch (error) {
    showSnackbar('Erro ao carregar categorias', 'error')
  } finally {
    loading.value = false
  }
}

const openDialog = (category?: Category) => {
  if (category) {
    isEdit.value = true
    form.id = category.id
    form.name = category.name
    form.type = category.type
  } else {
    isEdit.value = false
    form.id = 0
    form.name = ''
    form.type = 'ENTRY'
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  formRef.value?.reset()
}

const handleSubmit = async () => {
  if (!formRef.value?.validate()) return

  showOverlay(isEdit.value ? 'Atualizando categoria...' : 'Criando categoria...')
  
  // Pequeno delay para garantir que o loader apareça
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    if (isEdit.value) {
      await adminCategoryService.update(form.id, {
        name: form.name,
        type: form.type,
      })
    } else {
      await adminCategoryService.create({
        name: form.name,
        type: form.type,
      })
    }
    
    closeDialog()
    await loadCategories()
    
    // Mostrar snackbar após o loader ser escondido
    hideLoader()
    setTimeout(() => {
      showSnackbar(isEdit.value ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!', 'success')
    }, 200)
    
  } catch (error: any) {
    hideLoader()
    setTimeout(() => {
      showSnackbar(error?.response?.data?.message || 'Erro ao salvar categoria', 'error')
    }, 200)
  }
}

const confirmDelete = (category: Category) => {
  categoryToDelete.value = category
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!categoryToDelete.value) return

  showOverlay('Excluindo categoria...')
  
  // Pequeno delay para garantir que o loader apareça
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    await adminCategoryService.delete(categoryToDelete.value.id)
    deleteDialog.value = false
    await loadCategories()
    
    // Mostrar snackbar após o loader ser escondido
    hideLoader()
    setTimeout(() => {
      showSnackbar('Categoria excluída com sucesso!', 'success')
    }, 200)
    
  } catch (error: any) {
    hideLoader()
    setTimeout(() => {
      showSnackbar(error?.response?.data?.message || 'Erro ao excluir categoria', 'error')
    }, 200)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showSnackbar = (message: string, color: string) => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.cyberpunk-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyberpunk-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.cyberpunk-btn:hover::before {
  left: 100%;
}

.cyberpunk-btn:hover {
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
  transform: translateY(-1px);
}
</style>


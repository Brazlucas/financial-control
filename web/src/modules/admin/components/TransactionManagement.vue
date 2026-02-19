<template>
  <v-card flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6">Gerenciar Transações</span>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        Nova Transação
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Filtros de Data -->
      <div class="d-flex align-center gap-3 mb-4">
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          label="Mês"
          variant="outlined"
          density="compact"
          style="min-width: 120px;"
          clearable
          @update:model-value="applyFilters"
        />
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          label="Ano"
          variant="outlined"
          density="compact"
          style="min-width: 100px;"
          clearable
          @update:model-value="applyFilters"
        />
        <v-btn
          v-if="selectedMonth || selectedYear"
          color="secondary"
          variant="outlined"
          size="small"
          @click="clearFilters"
          icon="mdi-filter-remove"
          class="ml-2"
        >
        </v-btn>
      </div>

      <v-data-table-server
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        v-model="selected"
        :headers="headers"
        :items="transactions"
        :items-length="total"
        :loading="loading"
        :items-per-page-options="[5, 10, 15, 25]"
        @update:options="loadTransactions"
        density="comfortable"
        class="elevation-1"
        show-select
        item-value="id"
        return-object
      >
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template v-slot:item.value="{ item }">
          {{ formatCurrency(item.value) }}
        </template>

        <template v-slot:item.type="{ item }">
          <v-chip :color="item.type === 'ENTRY' ? 'green' : 'red'" dark size="small">
            {{ item.type === 'ENTRY' ? 'Entrada' : 'Saída' }}
          </v-chip>
        </template>

        <template v-slot:item.category="{ item }">
          {{ item.category?.name || '-' }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table-server>
    </v-card-text>

    <!-- Floating Calculator Widget -->
    <v-fade-transition>
      <v-card
        v-if="selected.length > 0"
        class="calculator-widget"
        elevation="8"
        rounded="lg"
        border
      >
        <v-card-title class="bg-surface text-subtitle-2 font-weight-bold d-flex justify-space-between align-center py-2">
          <span>Calculadora de Gastos ({{ selected.length }} selecionados)</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="selected = []"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
             <span class="text-caption text-medium-emphasis">Total Selecionado:</span>
             <span class="text-h6 font-weight-bold" :class="selectedTotal >= 0 ? 'text-success' : 'text-error'">
                {{ formatCurrency(selectedTotal) }}
             </span>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="d-flex gap-2 mb-2">
              <v-text-field
                v-model.number="calcInput"
                label="Valor para simulação"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                prefix="R$"
              ></v-text-field>
          </div>

          <div class="d-flex justify-space-between gap-2">
             <v-btn-group density="compact" class="flex-grow-1" divided variant="outlined">
                <v-btn @click="calcOperation('+')" icon="mdi-plus" color="primary"></v-btn>
                <v-btn @click="calcOperation('-')" icon="mdi-minus" color="primary"></v-btn>
                <v-btn @click="calcOperation('*')" icon="mdi-close" color="primary"></v-btn>
                <v-btn @click="calcOperation('/')" icon="mdi-slash-forward" color="primary"></v-btn>
             </v-btn-group>
          </div>

          <div v-if="calcResult !== null" class="mt-4 pa-3 bg-grey-lighten-4 rounded text-center">
             <div class="text-caption text-medium-emphasis mb-1">Resultado da Simulação</div>
             <div class="text-h6 font-weight-bold primary--text">
                {{ formatCurrency(calcResult) }}
             </div>
          </div>
        </v-card-text>
      </v-card>
    </v-fade-transition>

    <!-- Dialog de Criar/Editar -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ isEdit ? 'Editar' : 'Nova' }} Transação</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formIsValid">
            <v-text-field
              v-model="form.description"
              label="Descrição"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-2"
            />

            <v-text-field
              v-model="form.value"
              label="Valor"
              type="number"
              step="0.01"
              :rules="[rules.required, rules.positive]"
              variant="outlined"
              class="mb-2"
              prefix="R$"
            />

            <v-select
              v-model="form.type"
              :items="typeOptions"
              item-title="text"
              item-value="value"
              label="Tipo"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-2"
            />

            <v-select
              v-model="form.categoryId"
              :items="filteredCategories"
              item-title="name"
              item-value="id"
              label="Categoria"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-2"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.name">
                  <template v-slot:append>
                    <v-chip
                      :color="item.raw.type === 'ENTRY' ? 'green' : 'red'"
                      size="small"
                      class="ml-2"
                      variant="flat"
                    >
                      {{ item.raw.type === 'ENTRY' ? 'Entrada' : 'Saída' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                <span class="mr-2">{{ item.raw.name }}</span>
                <v-chip
                  :color="item.raw.type === 'ENTRY' ? 'green' : 'red'"
                  size="small"
                  variant="flat"
                >
                  {{ item.raw.type === 'ENTRY' ? 'Entrada' : 'Saída' }}
                </v-chip>
              </template>
            </v-select>

            <v-text-field
              v-model="form.date"
              label="Data"
              type="date"
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
          Tem certeza que deseja excluir a transação <strong>{{ transactionToDelete?.description }}</strong>?
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
import { ref, reactive, onMounted, computed } from 'vue'
import { adminTransactionService, type Transaction } from '../services/admin-transaction.service'
import { adminCategoryService, type Category } from '../services/admin-category.service'
import CyberpunkLoader from '@/components/CyberpunkLoader.vue'
import { useGlobalLoader } from '@/stores/loader'

const transactions = ref<Transaction[]>([])
const categories = ref<Category[]>([])
const selected = ref<Transaction[]>([]) // Seleção para calculadora
const total = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const formRef = ref()
const formIsValid = ref(false)
const isEdit = ref(false)
const transactionToDelete = ref<Transaction | null>(null)

// Calculator State
const calcInput = ref<number | null>(null)
const calcResult = ref<number | null>(null)

const selectedTotal = computed(() => {
  return selected.value.reduce((acc, t) => {
    // Treat EXIT as negative for spending math?
    // User wants "Spending Calculator". Usually summing bills.
    // If I select 3 bills of 100, sum should be 300 (or -300).
    // Let's use the signed value logic: ENTRY (+) EXIT (-).
    // But for "Spending" maybe they want absolute sum of expenses?
    // "Calculadora de Gasto" -> "Spending Calculator".
    // Let's stick to signed sum (Balance) because they might mix Entry/Exit.
    const val = parseFloat(t.value as any)
    const signedVal = t.type === 'ENTRY' ? val : -Math.abs(val)
    return acc + signedVal
  }, 0)
})

const calcOperation = (op: string) => {
    if (calcInput.value === null) return;
    const base = selectedTotal.value;
    const modifier = calcInput.value;

    switch(op) {
        case '+': calcResult.value = base + modifier; break;
        case '-': calcResult.value = base - modifier; break;
        case '*': calcResult.value = base * modifier; break;
        case '/': calcResult.value = base / modifier; break;
    }
}

// Filtros de data
const selectedMonth = ref<number | null>(null)
const selectedYear = ref<number | null>(null)

// Loader global para operações
const { showOverlay, hideLoader } = useGlobalLoader()

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const form = reactive({
  id: 0,
  description: '',
  value: 0,
  type: 'ENTRY' as 'ENTRY' | 'EXIT',
  categoryId: 0,
  date: new Date().toISOString().split('T')[0],
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Descrição', key: 'description', sortable: true },
  { title: 'Valor', key: 'value', sortable: true },
  { title: 'Tipo', key: 'type', sortable: true },
  { title: 'Categoria', key: 'category', sortable: false },
  { title: 'Data', key: 'date', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

const typeOptions = [
  { text: 'Entrada', value: 'ENTRY' },
  { text: 'Saída', value: 'EXIT' },
]

// Opções para os filtros de data
const monthOptions = [
  { title: 'Janeiro', value: 1 },
  { title: 'Fevereiro', value: 2 },
  { title: 'Março', value: 3 },
  { title: 'Abril', value: 4 },
  { title: 'Maio', value: 5 },
  { title: 'Junho', value: 6 },
  { title: 'Julho', value: 7 },
  { title: 'Agosto', value: 8 },
  { title: 'Setembro', value: 9 },
  { title: 'Outubro', value: 10 },
  { title: 'Novembro', value: 11 },
  { title: 'Dezembro', value: 12 },
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ title: i.toString(), value: i })
  }
  return years
})

const filteredCategories = computed(() => {
  return categories.value.filter((cat) => cat.type === form.type)
})

const rules = {
  required: (v: any) => !!v || v === 0 || 'Campo obrigatório',
  positive: (v: number) => v > 0 || 'Valor deve ser maior que zero',
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const result = await adminTransactionService.getAll({
      page: page.value,
      limit: itemsPerPage.value,
      sortBy: 'date',
      sortOrder: 'DESC',
      month: selectedMonth.value || undefined,
      year: selectedYear.value || undefined,
    })
    transactions.value = result.data
    total.value = result.total
  } catch (error) {
    showSnackbar('Erro ao carregar transações', 'error')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await adminCategoryService.getAll()
  } catch (error) {
    showSnackbar('Erro ao carregar categorias', 'error')
  }
}

const applyFilters = () => {
  page.value = 1 // Reset page when filtering
  loadTransactions()
}

const clearFilters = () => {
  selectedMonth.value = null
  selectedYear.value = null
  page.value = 1
  loadTransactions()
}

const openDialog = (transaction?: Transaction) => {
  if (transaction) {
    isEdit.value = true
    form.id = transaction.id
    form.description = transaction.description
    form.value = parseFloat(transaction.value)
    form.type = transaction.type
    form.categoryId = transaction.category.id
    form.date = transaction.date.split('T')[0]
  } else {
    isEdit.value = false
    form.id = 0
    form.description = ''
    form.value = 0
    form.type = 'ENTRY'
    form.categoryId = 0
    form.date = new Date().toISOString().split('T')[0]
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  formRef.value?.reset()
}

const handleSubmit = async () => {
  if (!formRef.value?.validate()) return

  showOverlay(isEdit.value ? 'Atualizando transação...' : 'Criando transação...')
  
  // Pequeno delay para garantir que o loader apareça
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    const dto = {
      description: form.description,
      value: form.value,
      type: form.type,
      categoryId: form.categoryId,
      date: new Date(form.date).toISOString(),
    }

    if (isEdit.value) {
      await adminTransactionService.update(form.id, dto)
    } else {
      await adminTransactionService.create(dto)
    }
    
    closeDialog()
    await loadTransactions()
    
    // Mostrar snackbar após o loader ser escondido
    hideLoader()
    setTimeout(() => {
      showSnackbar(isEdit.value ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!', 'success')
    }, 200)
    
  } catch (error: any) {
    hideLoader()
    setTimeout(() => {
      showSnackbar(error?.response?.data?.message || 'Erro ao salvar transação', 'error')
    }, 200)
  }
}

const confirmDelete = (transaction: Transaction) => {
  transactionToDelete.value = transaction
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!transactionToDelete.value) return

  showOverlay('Excluindo transação...')
  
  // Pequeno delay para garantir que o loader apareça
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    await adminTransactionService.delete(transactionToDelete.value.id)
    deleteDialog.value = false
    await loadTransactions()
    
    // Mostrar snackbar após o loader ser escondido
    hideLoader()
    setTimeout(() => {
      showSnackbar('Transação excluída com sucesso!', 'success')
    }, 200)
    
  } catch (error: any) {
    hideLoader()
    setTimeout(() => {
      showSnackbar(error?.response?.data?.message || 'Erro ao excluir transação', 'error')
    }, 200)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const showSnackbar = (message: string, color: string) => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => {
  loadCategories()
  loadTransactions()
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

.calculator-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95);
}
</style>


<template>
  <v-container class="py-10">
    <v-row>
      <v-col cols="12">
        <!-- Header & Toolbar -->
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">
              <v-icon size="36" class="mr-2 text-primary">mdi-monitor-dashboard</v-icon>
              Dashboard
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              <span v-if="selectedMonth || selectedYear" class="font-weight-bold text-primary">
                Exibindo: {{ getFilterLabel() }}
              </span>
              <span v-else>Visão Geral (Todos os períodos)</span>
            </p>
          </div>
          <div class="d-flex align-center gap-2">
             <!-- Global Date Filters & Search -->
             <v-text-field
              v-model="searchQuery"
              label="Buscar"
              placeholder="Ex: Carrefour"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
              style="min-width: 200px;"
              bg-color="surface"
              @update:model-value="() => debouncedApplyFilters()"
              clearable
              @click:clear="applyFilters"
            />
             <v-select
              v-model="selectedMonth"
              :items="monthOptions"
              label="Mês"
              variant="outlined"
              density="compact"
              style="min-width: 140px;"
              hide-details
              clearable
              bg-color="surface"
              @update:model-value="applyFilters"
            />
            <v-select
              v-model="selectedYear"
              :items="yearOptions"
              label="Ano"
              variant="outlined"
              density="compact"
              style="min-width: 120px;"
              hide-details
              clearable
              bg-color="surface"
              @update:model-value="applyFilters"
            />
            
            <v-autocomplete
              v-model="selectedCategoryFilter"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Categoria"
              variant="outlined"
              density="compact"
              style="min-width: 160px;"
              hide-details
              clearable
              bg-color="surface"
              @update:model-value="applyFilters"
              :loading="loadingCategories"
              @click:clear="applyFilters"
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
            </v-autocomplete>

            <v-btn
              v-if="selectedMonth || selectedYear || selectedCategoryFilter || searchQuery"
              color="secondary"
              variant="text"
              size="small"
              icon="mdi-filter-off"
              @click="clearFilters"
              title="Limpar Filtros"
            />
            
            <v-btn
              color="primary"
              class="ml-2"
              prepend-icon="mdi-upload"
              variant="flat"
              @click="goToImport"
            >
              Importar
            </v-btn>
            
            <ThemeToggle />

             <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
              </template>
              <v-list>
                <v-list-item @click="goToAdmin" prepend-icon="mdi-cog">
                  <v-list-item-title>Admin</v-list-item-title>
                </v-list-item>
                <v-list-item @click="userLogout" prepend-icon="mdi-logout" color="error">
                  <v-list-item-title>Logout</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-6 h-100" elevation="2" rounded="lg">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h3 class="text-overline mb-1 text-medium-emphasis">BALANÇO TOTAL</h3>
              <p class="text-h4 font-weight-bold mb-0 text-primary">{{ formatValue(summary.balance) }}</p>
            </div>
            <div>
              <v-avatar color="primary" variant="tonal" size="56">
                <v-icon size="32">mdi-wallet</v-icon>
              </v-avatar>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-6 h-100" elevation="2" rounded="lg">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h3 class="text-overline mb-1 text-medium-emphasis">RECEITAS</h3>
              <p class="text-h4 font-weight-bold mb-0 text-success">{{ formatValue(summary.income) }}</p>
            </div>
            <v-avatar color="success" variant="tonal" size="56">
              <v-icon size="32">mdi-trending-up</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-6 h-100" elevation="2" rounded="lg">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h3 class="text-overline mb-1 text-medium-emphasis">DESPESAS</h3>
              <p class="text-h4 font-weight-bold mb-0 text-error">{{ formatValue(summary.expense) }}</p>
            </div>
            <v-avatar color="error" variant="tonal" size="56">
               <v-icon size="32">mdi-trending-down</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="chartData.history.length > 0">
      <DashboardCharts 
        :historyData="chartData.history" 
        :categoryData="chartData.categories" 
        :merchantData="chartData.topMerchants"
        :projectionData="chartData.projection || []"
        :summary="chartData.summary"
        :incomeCategories="chartData.incomeCategories || []"
        :topIncomeSources="chartData.topIncomeSources || []"
      />
    </div>

    <v-row class="mt-10">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h2 class="text-h5 font-weight-bold">
            <v-icon class="mr-2 text-primary">mdi-history</v-icon>
            Últimas Transações
            <span class="text-subtitle-1 ml-2 text-medium-emphasis">
               (Total: {{ formatValue(sum) }})
            </span>
          </h2>
        </div>
        <div v-if="loading" class="d-flex justify-center my-10">
          <MinimalLoader 
             text="Carregando transações..."
             :size="40"
          />
        </div>
        
        <v-data-table-server
          v-else
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          v-model="selectedTransactions"
          :items="transactions"
          :loading="loading"
          :headers="headers"
          :items-length="total"
          :items-per-page-options="[10, 25, 50]"
          density="comfortable"
          hover
          class="elevation-1 rounded-lg"
          show-select
          item-value="id"
          return-object
        >
          <template v-slot:item.date="{ item }">
            {{ formatDate((item as any).date) }}
          </template>
          <template v-slot:item.value="{ item }">
            <span :class="(item as any).type === 'ENTRY' ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
              {{ (item as any).type === 'ENTRY' ? '+ ' : '' }}
              {{ formatValue(Number((item as any).value)) }}
            </span>
          </template>
          <template v-slot:item.category="{ item }">
            <v-chip 
              color="secondary" 
              variant="outlined" 
              size="small" 
              class="font-weight-medium cursor-pointer"
              @click="openEditDialog(item)"
              prepend-icon="mdi-pencil"
            >
              {{ (item as any).category?.name || 'Sem Categoria' }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="openEditDialog(item)"
            ></v-btn>
          </template>
          <template v-slot:item.type="{ item }">
            <v-chip 
              :color="(item as any).type === 'ENTRY' ? 'success' : 'error'" 
              variant="tonal"
              size="small"
            >
              {{ (item as any).type === 'ENTRY' ? 'Receita' : 'Despesa' }}
            </v-chip>
          </template>
        </v-data-table-server>
      </v-col>
    </v-row>

    <!-- Floating Calculator Widget -->
    <v-fade-transition>
      <v-card
        v-if="selectedTransactions.length > 0"
        class="calculator-widget"
        elevation="8"
        rounded="lg"
        border
      >
        <v-card-title class="bg-surface text-subtitle-2 font-weight-bold d-flex justify-space-between align-center py-2">
          <span>Calculadora de Gastos ({{ selectedTransactions.length }})</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="selectedTransactions = []"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
             <span class="text-caption text-medium-emphasis">Total Selecionado:</span>
             <span class="text-h6 font-weight-bold" :class="selectedTotal >= 0 ? 'text-success' : 'text-error'">
                {{ formatValue(selectedTotal) }}
             </span>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="d-flex gap-2 mb-2">
              <v-text-field
                v-model.number="calcInput"
                label="Simular Valor"
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
             <div class="text-caption text-medium-emphasis mb-1">Resultado Simulado</div>
             <div class="text-h6 font-weight-bold primary--text">
                {{ formatValue(calcResult) }}
             </div>
          </div>
        </v-card-text>
      </v-card>
    </v-fade-transition>

    <!-- Edit Category Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          Alterar Categoria
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4 text-body-1">
             Transação: <strong>{{ selectedTransaction?.description }}</strong>
          </p>
          <v-autocomplete
            v-model="selectedCategoryId"
            :items="categories"
            item-title="name"
            item-value="id"
            label="Selecione a nova categoria"
            variant="outlined"
            auto-select-first
            :loading="loadingCategories"
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
          </v-autocomplete>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeEditDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveCategory" :loading="savingCategory">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboard } from './composables/useDashboard';
import { usePaginatedTransactions } from './composables/usePaginatedTransactions'
import DashboardCharts from './components/DashboardCharts.vue';
import MinimalLoader from '@/components/MinimalLoader.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import api from '@/services/http.service';

const router = useRouter();
const { summary, chartData, loadDashboard } = useDashboard();
const { transactions, total, sum, itemsPerPage, sortBy, page, load, loading, setDateFilter, clearDateFilter } = usePaginatedTransactions();

// Filtros
const selectedMonth = ref<number | null>(null);
const selectedYear = ref<number | null>(null);
const selectedCategoryFilter = ref<number | null>(null);
const searchQuery = ref<string>('');
let debounceTimer: any = null;

// Category Edit State
const editDialog = ref(false);
const selectedTransaction = ref<any>(null);
const selectedCategoryId = ref<number | null>(null);
const categories = ref<any[]>([]);
const loadingCategories = ref(false);
const savingCategory = ref(false);

// Calculator State
const selectedTransactions = ref<any[]>([]);
const calcInput = ref<number | null>(null);
const calcResult = ref<number | null>(null);

const selectedTotal = computed(() => {
  return selectedTransactions.value.reduce((acc, t) => {
    const val = parseFloat(t.value as any);
    const signedVal = t.type === 'ENTRY' ? val : -Math.abs(val);
    return acc + signedVal;
  }, 0);
});

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

const loadCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await api.get('/categories');
    categories.value = response.data;
  } catch (error) {
    console.error('Error loading categories', error);
  } finally {
    loadingCategories.value = false;
  }
};

const openEditDialog = (item: any) => {
  selectedTransaction.value = item;
  selectedCategoryId.value = item.category?.id;
  editDialog.value = true;
  if (categories.value.length === 0) {
    loadCategories();
  }
};

const closeEditDialog = () => {
  editDialog.value = false;
  selectedTransaction.value = null;
  selectedCategoryId.value = null;
};

const saveCategory = async () => {
  if (!selectedTransaction.value || !selectedCategoryId.value) return;
  
  savingCategory.value = true;
  try {
    await api.patch(`/transactions/${selectedTransaction.value.id}`, {
      categoryId: selectedCategoryId.value
    });
    
    // Update local state to reflect change immediately
    const index = transactions.value.findIndex((t: any) => t.id === selectedTransaction.value.id);
    if (index !== -1) {
       const newCategory = categories.value.find(c => c.id === selectedCategoryId.value);
       transactions.value[index].category = newCategory;
    }
    
    // Refresh dashboard to update charts
    loadDashboard(selectedMonth.value || undefined, selectedYear.value || undefined, selectedCategoryFilter.value || undefined, searchQuery.value || undefined);
    
    closeEditDialog();
  } catch (error) {
    console.error('Error updating category', error);
  } finally {
    savingCategory.value = false;
  }
};

// Opções para os selects
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
];

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ title: i.toString(), value: i });
  }
  return years;
});


const debouncedApplyFilters = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    applyFilters();
  }, 500);
}

const applyFilters = () => {
  const search = searchQuery.value || undefined;
  setDateFilter(selectedMonth.value || undefined, selectedYear.value || undefined, selectedCategoryFilter.value || undefined, search);
  loadDashboard(selectedMonth.value || undefined, selectedYear.value || undefined, selectedCategoryFilter.value || undefined, search);
};

const clearFilters = () => {
  selectedMonth.value = null;
  selectedYear.value = null;
  selectedCategoryFilter.value = null;
  searchQuery.value = '';
  clearDateFilter();
  loadDashboard();
};

const goToImport = () => {
  router.push('/import');
}

const goToAdmin = () => {
  router.push('/admin');
}

const userLogout = () => {
  router.push('/login')

  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.clear()
}

const formatValue = (value: number) => {
  if (!value && value !== 0) return 'R$ 0,00';

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const formatDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  return new Date(date).toLocaleDateString('pt-BR', options)
}

const headers = [
  { title: 'Descrição', key: 'description', sortable: true },
  { title: 'Valor', key: 'value', sortable: true, align: 'end' as const },
  { title: 'Tipo', key: 'type', sortable: true, align: 'center' as const },
  { title: 'Categoria', key: 'category', sortable: false, align: 'center' as const },
  { title: 'Data', key: 'date', sortable: true, align: 'center' as const },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' as const },
]

onMounted(() => {
  loadDashboard()
  loadCategories() // Load categories for filter
})

const getFilterLabel = () => {
  if (!selectedMonth.value && !selectedYear.value && !searchQuery.value) return 'Todos os períodos';
  const monthName = selectedMonth.value ? monthOptions.find(m => m.value === selectedMonth.value)?.title : '';
  const yearName = selectedYear.value ? selectedYear.value.toString() : '';
  const searchLabel = searchQuery.value ? ` | Busca: "${searchQuery.value}"` : '';
  
  let label = '';
  if (monthName && yearName) label = `${monthName} de ${yearName}`;
  else if (yearName) label = `Ano de ${yearName}`;
  else if (monthName) label = monthName;
  else label = 'Todos os períodos';

  return label + searchLabel;
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
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


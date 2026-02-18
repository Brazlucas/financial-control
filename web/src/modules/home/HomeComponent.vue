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
             <!-- Global Date Filters -->
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
            />

            <v-btn
              v-if="selectedMonth || selectedYear || selectedCategoryFilter"
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
      />
    </div>

    <v-row class="mt-10">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h2 class="text-h5 font-weight-bold">
            <v-icon class="mr-2 text-primary">mdi-history</v-icon>
            Últimas Transações
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
          :items="transactions"
          :loading="loading"
          :headers="headers"
          :items-length="total"
          :items-per-page-options="[10, 25, 50]"
          density="comfortable"
          hover
          class="elevation-1 rounded-lg"
        >
          <template v-slot:item.date="{ item }">
            {{ formatDate((item as any).date) }}
          </template>
          <template v-slot:item.value="{ item }">
            <span :class="(item as any).type === 'ENTRY' ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
              {{ (item as any).type === 'ENTRY' ? '+ ' : '- ' }}
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
          ></v-autocomplete>
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
const { transactions, total, itemsPerPage, sortBy, page, load, loading, setDateFilter, clearDateFilter } = usePaginatedTransactions();

// Filtros
const selectedMonth = ref<number | null>(null);
const selectedYear = ref<number | null>(null);
const selectedCategoryFilter = ref<number | null>(null);

// Category Edit State
const editDialog = ref(false);
const selectedTransaction = ref<any>(null);
const selectedCategoryId = ref<number | null>(null);
const categories = ref<any[]>([]);
const loadingCategories = ref(false);
const savingCategory = ref(false);

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
    loadDashboard(selectedMonth.value || undefined, selectedYear.value || undefined);
    
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

const applyFilters = () => {
  setDateFilter(selectedMonth.value || undefined, selectedYear.value || undefined, selectedCategoryFilter.value || undefined);
  loadDashboard(selectedMonth.value || undefined, selectedYear.value || undefined, selectedCategoryFilter.value || undefined);
};

const clearFilters = () => {
  selectedMonth.value = null;
  selectedYear.value = null;
  selectedCategoryFilter.value = null;
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
  if (!value) return 'R$ 0,00';

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
  { title: 'Valor', key: 'value', sortable: true, align: 'end' },
  { title: 'Tipo', key: 'type', sortable: true, align: 'center' },
  { title: 'Categoria', key: 'category', sortable: false, align: 'center' },
  { title: 'Data', key: 'date', sortable: true, align: 'center' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
]

onMounted(() => {
  loadDashboard()
  loadCategories() // Load categories for filter
})

const getFilterLabel = () => {
  if (!selectedMonth.value && !selectedYear.value) return 'Todos os períodos';
  const monthName = selectedMonth.value ? monthOptions.find(m => m.value === selectedMonth.value)?.title : '';
  const yearName = selectedYear.value ? selectedYear.value.toString() : '';
  
  if (monthName && yearName) return `${monthName} de ${yearName}`;
  if (yearName) return `Ano de ${yearName}`;
  return monthName;
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>


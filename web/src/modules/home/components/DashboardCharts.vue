<template>
  <v-row class="mt-4">
    <!-- KPI Cards -->
    <v-col cols="12" md="3">
      <v-card class="pa-4 h-100" elevation="2" rounded="lg" color="surface">
        <div class="text-overline mb-1 text-medium-emphasis">Média Diária (Saída)</div>
        <div class="text-h5 font-weight-bold">{{ formatCurrency(summary?.dailyAverage || 0) }}</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="3">
      <v-card class="pa-4 h-100" elevation="2" rounded="lg" color="surface">
        <div class="text-overline mb-1 text-medium-emphasis">Maior Despesa</div>
        <div class="text-h6 font-weight-bold text-truncate">{{ summary?.biggestExpense?.description || '-' }}</div>
        <div class="text-subtitle-2 text-error">{{ formatCurrency(summary?.biggestExpense?.value || 0) }}</div>
      </v-card>
    </v-col>
     <v-col cols="12" md="3">
      <v-card class="pa-4 h-100" elevation="2" rounded="lg" color="surface">
        <div class="text-overline mb-1 text-medium-emphasis">Transações</div>
        <div class="text-h5 font-weight-bold">{{ summary?.transactionCount || 0 }}</div>
      </v-card>
    </v-col>
    <v-col cols="12" md="3">
      <v-card class="pa-4 h-100" elevation="2" rounded="lg" color="surface">
        <div class="text-overline mb-1 text-medium-emphasis">Balanço do Período</div>
        <div :class="['text-h5 font-weight-bold', (summary?.balance || 0) >= 0 ? 'text-success' : 'text-error']">
          {{ formatCurrency(summary?.balance || 0) }}
        </div>
      </v-card>
    </v-col>

    <!-- Row 1: History & Categories -->
    <!-- Chart: History (Income vs Expense) -->
    <v-col cols="12" md="8">
      <v-card class="pa-6 h-100" elevation="2" rounded="lg">
        <div class="d-flex align-center mb-4">
          <v-icon size="24" class="mr-3 text-primary">mdi-chart-timeline-variant</v-icon>
          <h2 class="text-h6 font-weight-bold">
            Evolução Financeira (6 Meses)
          </h2>
        </div>
        <div class="chart-container-lg">
          <Bar v-if="historyData" :data="historyChartData" :options="commonOptions" />
        </div>
      </v-card>
    </v-col>

    <!-- Chart: Categories (Doughnut) -->
    <v-col cols="12" md="4">
      <v-card class="pa-6 h-100" elevation="2" rounded="lg">
        <div class="d-flex align-center mb-4">
          <v-icon size="24" class="mr-3 text-primary">mdi-chart-donut</v-icon>
          <h2 class="text-h6 font-weight-bold">
            Por Categoria
          </h2>
        </div>
        <div class="chart-container-sm d-flex justify-center">
          <Doughnut v-if="categoryData" :data="categoryChartData" :options="doughnutOptions" />
        </div>
      </v-card>
    </v-col>

    <!-- Row 2: Top Merchants (Bar) & Projection -->
    <v-col cols="12" md="6">
      <v-card class="pa-6 h-100" elevation="2" rounded="lg">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center">
            <v-icon size="24" class="mr-3 text-primary">mdi-store</v-icon>
            <h2 class="text-h6 font-weight-bold">
              Top Comércios
            </h2>
          </div>
          <div class="d-flex align-center" v-if="totalMerchantPages > 1">
             <v-btn icon="mdi-chevron-left" size="small" variant="text" :disabled="merchantPage === 0" @click="prevPage"></v-btn>
             <span class="text-caption mx-2">{{ merchantPage + 1 }} / {{ totalMerchantPages }}</span>
             <v-btn icon="mdi-chevron-right" size="small" variant="text" :disabled="merchantPage >= totalMerchantPages - 1" @click="nextPage"></v-btn>
          </div>
        </div>
        <div class="chart-container-sm">
          <Bar v-if="paginatedMerchants.length > 0" :data="merchantChartData" :options="barOptions" />
           <div v-else class="text-center text-medium-emphasis mt-10">Sem dados para exibir</div>
        </div>
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card class="pa-6 h-100" elevation="2" rounded="lg">
        <div class="d-flex align-center mb-4">
          <v-icon size="24" class="mr-3 text-primary">mdi-target</v-icon>
          <h2 class="text-h6 font-weight-bold">
            Projeção vs Média (3 meses)
          </h2>
        </div>
        <div class="d-flex flex-column gap-3">
          <div v-for="item in projectionData" :key="item.name" class="mb-3">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
              <span class="text-caption">
                {{ formatCurrency(item.current) }} / <span class="text-medium-emphasis">{{ formatCurrency(item.average) }}</span>
              </span>
            </div>
            <v-progress-linear
              :model-value="item.average ? (item.current / item.average) * 100 : 0"
              :color="!item.average ? 'grey' : item.current > item.average ? 'error' : 'success'"
              height="8"
              rounded
            ></v-progress-linear>
          </div>
          <div v-if="projectionData.length === 0" class="text-center text-medium-emphasis mt-4">
            Dados insuficientes para projeção.
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, defineProps, ref } from 'vue';
import { Line, Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { useTheme } from 'vuetify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const props = defineProps<{
  historyData: any[]; // { date: string, income: number, expense: number }[]
  categoryData: any[]; // { name: string, value: number }[]
  merchantData: any[]; // { name: string, value: number }[]
  projectionData: any[]; // { name: string, current: number, average: number, status: string }[]
  summary: any;       // { dailyAverage, biggestExpense, ... }
}>();

const theme = useTheme();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Minimalist Palette
const colors = [
  '#2196F3', '#4CAF50', '#FFC107', '#E91E63', 
  '#9C27B0', '#00BCD4', '#F44336', '#607D8B',
  '#3F51B5', '#009688'
];

// --- Pagination for Merchants ---
const merchantPage = ref(0);
const itemsPerPage = 5;

const paginatedMerchants = computed(() => {
  const start = merchantPage.value * itemsPerPage;
  return props.merchantData.slice(start, start + itemsPerPage);
});

const totalMerchantPages = computed(() => Math.ceil(props.merchantData.length / itemsPerPage));

const nextPage = () => {
  if (merchantPage.value < totalMerchantPages.value - 1) merchantPage.value++;
}

const prevPage = () => {
  if (merchantPage.value > 0) merchantPage.value--;
}

// --- Bar Chart Configuration (History) ---
// User requested a style change ("Line is horrible"). Switching to Vertical Bar.
const historyChartData = computed(() => {
  const dates = props.historyData.map(d => {
    const [year, month] = d.date.split('-');
    return `${month}/${year}`;
  });
  const income = props.historyData.map(d => d.income);
  const expense = props.historyData.map(d => d.expense);

  return {
    labels: dates,
    datasets: [
      {
        label: 'Entradas',
        data: income,
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'Saídas',
        data: expense,
        backgroundColor: '#F44336',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };
});

const commonOptions = computed(() => {
  const isDark = theme.global.current.value.dark;
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#E0E0E0' : '#424242';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor } }
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor } }
    }
  };
});

const lineOptions = commonOptions;

// --- Doughnut Chart Configuration (Categories) ---
const categoryChartData = computed(() => {
  return {
    labels: props.categoryData.slice(0, 8).map(c => c.name),
    datasets: [{
      data: props.categoryData.slice(0, 8).map(c => c.value),
      backgroundColor: colors,
      borderColor: theme.global.current.value.dark ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 2
    }]
  };
});

const doughnutOptions = computed(() => {
   const isDark = theme.global.current.value.dark;
   const textColor = isDark ? '#E0E0E0' : '#424242';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { color: textColor } }
    }
  };
});

// --- Bar Chart Configuration (Merchants) ---
const merchantChartData = computed(() => {
  return {
    labels: paginatedMerchants.value.map(m => m.name),
    datasets: [{
      label: 'Gasto Total',
      data: paginatedMerchants.value.map(m => m.value),
      backgroundColor: '#FFC107',
      borderRadius: 4
    }]
  };
});

const barOptions = computed(() => {
    const opts = commonOptions.value;
    return {
        ...opts,
        indexAxis: 'y' as const, // Horizontal bar
    };
});
</script>

<style scoped>
.chart-container-lg { min-height: 350px; height: 350px; position: relative; }
.chart-container-sm { min-height: 300px; height: 300px; position: relative; }
</style>

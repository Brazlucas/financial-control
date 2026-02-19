<template>
  <v-card class="pa-6 h-100" elevation="2" rounded="lg">
    <div class="d-flex align-center mb-4">
      <v-icon size="24" class="mr-3 text-success">mdi-cash-multiple</v-icon>
      <h2 class="text-h6 font-weight-bold">
        Fontes de Renda
      </h2>
    </div>

    <v-row>
      <!-- Chart: Income Categories -->
      <v-col cols="12" md="6">
        <h3 class="text-subtitle-1 font-weight-medium mb-2 text-medium-emphasis text-center">Por Categoria</h3>
        <div class="chart-container-sm d-flex justify-center">
          <Doughnut v-if="hasData" :data="chartData" :options="chartOptions" />
          <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis">
            Sem dados de entrada no período.
          </div>
        </div>
      </v-col>

      <!-- List: Top Sources -->
      <v-col cols="12" md="6">
        <h3 class="text-subtitle-1 font-weight-medium mb-2 text-medium-emphasis">Principais Fontes</h3>
        <v-list density="compact" class="bg-transparent">
            <v-list-item v-for="(source, i) in topSources" :key="i" class="px-0">
                <template v-slot:prepend>
                    <v-avatar color="success" variant="tonal" size="32" class="mr-3">
                        <span class="text-caption font-weight-bold">{{ i + 1 }}</span>
                    </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-truncate">
                    {{ source.name }}
                </v-list-item-title>
                <template v-slot:append>
                    <span class="text-success font-weight-bold ml-2">{{ formatCurrency(source.value) }}</span>
                </template>
            </v-list-item>
             <div v-if="topSources.length === 0" class="text-center text-medium-emphasis mt-4">
                Nenhuma fonte registrada.
            </div>
        </v-list>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useTheme } from 'vuetify';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  incomeCategories: any[]; // { name: string, value: number }[]
  topSources: any[]; // { name: string, value: number }[]
}>();

const theme = useTheme();

const hasData = computed(() => props.incomeCategories && props.incomeCategories.length > 0);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Green Palette
const colors = [
  '#43A047', '#66BB6A', '#81C784', '#A5D6A7', 
  '#C8E6C9', '#2E7D32', '#1B5E20'
];

const chartData = computed(() => {
  return {
    labels: props.incomeCategories.map(c => c.name),
    datasets: [{
      data: props.incomeCategories.map(c => c.value),
      backgroundColor: colors,
      borderColor: theme.global.current.value.dark ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 2
    }]
  };
});

const chartOptions = computed(() => {
   const isDark = theme.global.current.value.dark;
   const textColor = isDark ? '#E0E0E0' : '#424242';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
          position: 'bottom' as const, 
          labels: { 
              color: textColor,
              boxWidth: 12,
              padding: 15
          } 
      }
    }
  };
});
</script>

<style scoped>
.chart-container-sm { min-height: 250px; height: 250px; position: relative; }
</style>

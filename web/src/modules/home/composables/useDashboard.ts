import { ref } from 'vue'
import { dashboardService } from '../services/home.service'

export const useDashboard = () => {
  const summary = ref({ balance: 0, income: 0, expense: 0 })
  const chartData = ref({ 
    history: [], 
    categories: [], 
    topMerchants: [], 
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      dailyAverage: 0,
      biggestExpense: null,
      transactionCount: 0
    },
    projection: [],
    incomeCategories: [],
    topIncomeSources: []
  })


  const loadDashboard = async (month?: number, year?: number, categoryId?: number, search?: string) => {
    const [summaryData, charts] = await Promise.all([
      dashboardService.getSummary(month, year, search),
      dashboardService.getChartData(month, year, categoryId, search)
    ])

    summary.value = summaryData;
    chartData.value = charts;
  }

  return { summary, chartData, loadDashboard }
}

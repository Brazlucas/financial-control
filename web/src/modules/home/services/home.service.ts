import api from '@/services/http.service'

export const dashboardService = {
  async getSummary(month?: number, year?: number) {
    const params: any = {}
    if (month) params.month = month
    if (year) params.year = year
    
    const response = await api.get('/transactions/balance', { params })
    return response.data
  },

  async getChartData(month?: number, year?: number, categoryId?: number) {
    const params: any = {}
    if (month) params.month = month
    if (year) params.year = year
    if (categoryId) params.categoryId = categoryId
    
    const response = await api.get('/transactions/dashboard/charts', { params })
    return response.data
  },

  async getPaginatedTransactions(page: number, limit: number, sortBy: string, sortOrder: string, month?: number, year?: number, categoryId?: number) {
    const params: any = { page, limit, sortBy, sortOrder }
    if (month) params.month = month
    if (year) params.year = year
    if (categoryId) params.categoryId = categoryId
    
    const response = await api.get('/transactions', { params })
    return response.data
  }
}

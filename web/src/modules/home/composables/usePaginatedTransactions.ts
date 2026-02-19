import { ref, watch } from 'vue'
import { dashboardService } from '../services/home.service'

export const usePaginatedTransactions = () => {
  const transactions = ref([])
  const total = ref(0)
  const sum = ref(0)
  const loading = ref(false)

  const page = ref(1)
  const itemsPerPage = ref(10)
  const sortBy = ref([{ key: 'date', order: 'desc' }])
  const monthFilter = ref<number | undefined>(undefined)
  const yearFilter = ref<number | undefined>(undefined)
  const categoryFilter = ref<number | undefined>(undefined)
  const searchFilter = ref<string | undefined>(undefined)

  const load = async () => {
    loading.value = true
    try {
      // Extract sort key and order from sortBy array
      const sortKey = sortBy.value.length > 0 ? sortBy.value[0].key : undefined
      const sortOrder = sortBy.value.length > 0 ? sortBy.value[0].order.toUpperCase() : undefined

      const { data, total: totalItems, sum: totalSum } = await dashboardService.getPaginatedTransactions(
        page.value,
        itemsPerPage.value,
        sortKey,
        sortOrder,
        monthFilter.value,
        yearFilter.value,
        categoryFilter.value,
        searchFilter.value
      )

      transactions.value = data
      total.value = totalItems
      sum.value = totalSum || 0
    } catch (error) {
      console.error('Erro ao carregar transações', error)
    } finally {
      loading.value = false
    }
  }

  const setDateFilter = (month?: number, year?: number, categoryId?: number, search?: string) => {
    monthFilter.value = month
    yearFilter.value = year
    categoryFilter.value = categoryId
    searchFilter.value = search
    page.value = 1 // Reset to first page
    load()
  }

  const clearDateFilter = () => {
    monthFilter.value = undefined
    yearFilter.value = undefined
    categoryFilter.value = undefined
    searchFilter.value = undefined
    page.value = 1
    load()
  }

  watch([page, itemsPerPage, sortBy, monthFilter, yearFilter, categoryFilter, searchFilter], load, { immediate: true })

  return {
    transactions,
    total,
    sum,
    page,
    itemsPerPage,
    sortBy,
    monthFilter,
    yearFilter,
    categoryFilter,
    searchFilter,
    loading,
    load,
    setDateFilter,
    clearDateFilter,
  }
}

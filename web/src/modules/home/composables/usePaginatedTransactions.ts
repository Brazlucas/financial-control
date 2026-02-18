import { ref, watch } from 'vue'
import { dashboardService } from '../services/home.service'

export const usePaginatedTransactions = () => {
  const transactions = ref([])
  const total = ref(0)
  const loading = ref(false)

  const page = ref(1)
  const itemsPerPage = ref(10)
  const sortBy = ref([{ key: 'date', order: 'desc' }])
  const month = ref<number | undefined>(undefined)
  const year = ref<number | undefined>(undefined)
  const categoryId = ref<number | undefined>(undefined)

  const load = async () => {
    loading.value = true
    try {
      const sort = sortBy.value[0]
      const res = await dashboardService.getPaginatedTransactions(
        page.value,
        itemsPerPage.value,
        sort.key,
        sort.order.toUpperCase(),
        month.value,
        year.value,
        categoryId.value
      )

      transactions.value = res.data
      total.value = res.total
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      loading.value = false
    }
  }

  const setDateFilter = (newMonth?: number, newYear?: number, newCategoryId?: number) => {
    month.value = newMonth
    year.value = newYear
    categoryId.value = newCategoryId
    page.value = 1 // Reset page when filtering
  }

  const clearDateFilter = () => {
    month.value = undefined
    year.value = undefined
    categoryId.value = undefined
    page.value = 1
  }

  watch([page, itemsPerPage, sortBy, month, year, categoryId], load, { immediate: true })

  return {
    transactions,
    total,
    page,
    itemsPerPage,
    sortBy,
    month,
    year,
    categoryId,
    loading,
    load,
    setDateFilter,
    clearDateFilter,
  }
}

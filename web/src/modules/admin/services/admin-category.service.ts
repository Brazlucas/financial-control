import api from '@/services/http.service'

export interface Category {
  id: number
  name: string
  type: 'ENTRY' | 'EXIT'
  isSystem: boolean
  createdAt?: string
}

export interface CreateCategoryDto {
  name: string
  type: 'ENTRY' | 'EXIT'
}

export interface UpdateCategoryDto {
  name?: string
  type?: 'ENTRY' | 'EXIT'
}

export const adminCategoryService = {
  async getAll() {
    const response = await api.get<Category[]>('/categories')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get<Category>(`/categories/${id}`)
    return response.data
  },

  async create(dto: CreateCategoryDto) {
    const response = await api.post<Category>('/categories', dto)
    return response.data
  },

  async update(id: number, dto: UpdateCategoryDto) {
    const response = await api.patch(`/categories/${id}`, dto)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },
}


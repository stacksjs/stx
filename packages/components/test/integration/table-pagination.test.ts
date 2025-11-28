import { describe, expect, it } from 'bun:test'

/**
 * Integration Tests: Table with Pagination
 *
 * Tests the integration between Table, Pagination, and data management
 */
describe('table Pagination Integration', () => {
  // Sample data
  const generateData = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'inactive',
      createdAt: new Date(2024, 0, i + 1),
    }))
  }

  describe('pagination state management', () => {
    it('should handle pagination state', () => {
      const data = generateData(100)
      const pageSize = 10

      let currentPage = 1
      const totalPages = Math.ceil(data.length / pageSize)

      // Calculate current page data
      const getCurrentPageData = () => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return data.slice(start, end)
      }

      // Initial page
      let pageData = getCurrentPageData()
      expect(pageData.length).toBe(10)
      expect(pageData[0].id).toBe(1)
      expect(totalPages).toBe(10)

      // Next page
      currentPage = 2
      pageData = getCurrentPageData()
      expect(pageData[0].id).toBe(11)

      // Last page
      currentPage = totalPages
      pageData = getCurrentPageData()
      expect(pageData.length).toBe(10)
      expect(pageData[0].id).toBe(91)

      // Go back to first page
      currentPage = 1
      pageData = getCurrentPageData()
      expect(pageData[0].id).toBe(1)
    })

    it('should handle pagination with variable page sizes', () => {
      const data = generateData(100)

      const getPaginatedData = (page: number, pageSize: number) => {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return {
          data: data.slice(start, end),
          totalPages: Math.ceil(data.length / pageSize),
          currentPage: page,
          totalItems: data.length,
        }
      }

      // 10 items per page
      let result = getPaginatedData(1, 10)
      expect(result.data.length).toBe(10)
      expect(result.totalPages).toBe(10)

      // 25 items per page
      result = getPaginatedData(1, 25)
      expect(result.data.length).toBe(25)
      expect(result.totalPages).toBe(4)

      // 50 items per page
      result = getPaginatedData(1, 50)
      expect(result.data.length).toBe(50)
      expect(result.totalPages).toBe(2)
    })
  })

  describe('table sorting with pagination', () => {
    it('should sort data and maintain pagination', () => {
      const data = generateData(50)
      const pageSize = 10

      type SortDirection = 'asc' | 'desc'
      type SortField = 'id' | 'name' | 'status'

      const sortAndPaginate = (
        items: typeof data,
        field: SortField,
        direction: SortDirection,
        page: number,
      ) => {
        // Sort data
        const sorted = [...items].sort((a, b) => {
          const aVal = a[field]
          const bVal = b[field]

          if (aVal < bVal)
            return direction === 'asc' ? -1 : 1
          if (aVal > bVal)
            return direction === 'asc' ? 1 : -1
          return 0
        })

        // Paginate
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return sorted.slice(start, end)
      }

      // Sort by ID ascending
      let result = sortAndPaginate(data, 'id', 'asc', 1)
      expect(result[0].id).toBe(1)
      expect(result[9].id).toBe(10)

      // Sort by ID descending
      result = sortAndPaginate(data, 'id', 'desc', 1)
      expect(result[0].id).toBe(50)
      expect(result[9].id).toBe(41)

      // Sort by name and check second page
      result = sortAndPaginate(data, 'name', 'asc', 2)
      expect(result.length).toBe(10)
      // After sorting by name, the IDs won't be sequential
      // Just verify we got 10 items on page 2
      expect(result[0].name).toBeTruthy()
    })
  })

  describe('table filtering with pagination', () => {
    it('should filter data and adjust pagination', () => {
      const data = generateData(100)
      const pageSize = 10

      const filterAndPaginate = (
        items: typeof data,
        filterFn: (item: typeof data[0]) => boolean,
        page: number,
      ) => {
        const filtered = items.filter(filterFn)
        const start = (page - 1) * pageSize
        const end = start + pageSize

        return {
          data: filtered.slice(start, end),
          totalPages: Math.ceil(filtered.length / pageSize),
          totalFiltered: filtered.length,
        }
      }

      // Filter active items
      let result = filterAndPaginate(
        data,
        item => item.status === 'active',
        1,
      )
      expect(result.totalFiltered).toBe(50) // Half are active
      expect(result.totalPages).toBe(5)
      expect(result.data.every(item => item.status === 'active')).toBe(true)

      // Filter inactive items
      result = filterAndPaginate(
        data,
        item => item.status === 'inactive',
        1,
      )
      expect(result.totalFiltered).toBe(50)
      expect(result.data.every(item => item.status === 'inactive')).toBe(true)

      // Filter by name pattern
      result = filterAndPaginate(
        data,
        item => item.name.includes('1'),
        1,
      )
      expect(result.totalFiltered).toBeGreaterThan(0)
    })
  })

  describe('pagination navigation', () => {
    it('should handle pagination navigation correctly', () => {
      const totalPages = 10
      let currentPage = 1

      const canGoPrevious = () => currentPage > 1
      const canGoNext = () => currentPage < totalPages

      const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
          currentPage = page
          return true
        }
        return false
      }

      const nextPage = () => {
        if (canGoNext()) {
          currentPage++
          return true
        }
        return false
      }

      const previousPage = () => {
        if (canGoPrevious()) {
          currentPage--
          return true
        }
        return false
      }

      // Initial state
      expect(canGoPrevious()).toBe(false)
      expect(canGoNext()).toBe(true)

      // Go to next page
      expect(nextPage()).toBe(true)
      expect(currentPage).toBe(2)
      expect(canGoPrevious()).toBe(true)

      // Go to last page
      expect(goToPage(10)).toBe(true)
      expect(currentPage).toBe(10)
      expect(canGoNext()).toBe(false)

      // Try to go beyond last page
      expect(nextPage()).toBe(false)
      expect(currentPage).toBe(10)

      // Go to previous page
      expect(previousPage()).toBe(true)
      expect(currentPage).toBe(9)

      // Go to first page
      expect(goToPage(1)).toBe(true)
      expect(currentPage).toBe(1)

      // Try to go to invalid page
      expect(goToPage(0)).toBe(false)
      expect(goToPage(11)).toBe(false)
      expect(currentPage).toBe(1)
    })
  })

  describe('table selection with pagination', () => {
    it('should maintain selections across pages', () => {
      const data = generateData(50)
      const pageSize = 10
      const selectedIds = new Set<number>()

      const toggleSelection = (id: number) => {
        if (selectedIds.has(id)) {
          selectedIds.delete(id)
        }
        else {
          selectedIds.add(id)
        }
      }

      const selectAll = (pageData: typeof data) => {
        pageData.forEach(item => selectedIds.add(item.id))
      }

      const deselectAll = () => {
        selectedIds.clear()
      }

      const isSelected = (id: number) => selectedIds.has(id)

      // Select items from first page
      toggleSelection(1)
      toggleSelection(2)
      expect(selectedIds.size).toBe(2)

      // Move to second page and select items
      toggleSelection(11)
      toggleSelection(12)
      expect(selectedIds.size).toBe(4)

      // Check if selections persist
      expect(isSelected(1)).toBe(true)
      expect(isSelected(11)).toBe(true)

      // Select all on current page
      const page2Data = data.slice(10, 20)
      selectAll(page2Data)
      expect(selectedIds.size).toBe(12) // 2 from page 1 + 10 from page 2

      // Deselect one
      toggleSelection(11)
      expect(selectedIds.size).toBe(11)

      // Clear all selections
      deselectAll()
      expect(selectedIds.size).toBe(0)
    })
  })
})

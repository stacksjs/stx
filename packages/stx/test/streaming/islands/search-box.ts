/**
 * Search Box Island Component
 * This adds interactive functionality to the server-rendered search box
 */

interface SearchBoxProps {
  placeholder?: string
  searchEndpoint?: string
  autoComplete?: boolean
}

// Default export is the hydration function
export default function hydrate(element: HTMLElement, props: SearchBoxProps): void {
  const placeholder = props.placeholder || 'Search...'
  const searchEndpoint = props.searchEndpoint || '/api/search'

  const searchInput = element.querySelector('input[type="search"]') as HTMLInputElement
  if (searchInput) {
    // Set placeholder
    searchInput.placeholder = placeholder

    // Focus on click
    element.addEventListener('click', () => {
      searchInput.focus()
    })

    // Setup search functionality
    const searchForm = element.closest('form')
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault()
        performSearch(searchInput.value, searchEndpoint)
      })
    }

    // Setup auto-complete if enabled
    if (props.autoComplete) {
      setupAutoComplete(searchInput, searchEndpoint)
    }

    // Add clear button functionality
    const clearButton = element.querySelector('.clear-search')
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        searchInput.value = ''
        searchInput.focus()

        // Hide results if shown
        const resultsContainer = document.querySelector('.search-results')
        if (resultsContainer) {
          resultsContainer.innerHTML = ''
          resultsContainer.classList.add('hidden')
        }
      })
    }
  }
}

/**
 * Perform search with the given query
 */
function performSearch(query: string, endpoint: string): void {
  // In a real app, this would be an API call
  console.warn(`Searching for "${query}" via ${endpoint}...`)

  // Simulate search results
  setTimeout(() => {
    const results = generateMockResults(query)
    displayResults(results)
  }, 300)
}

/**
 * Setup auto-complete functionality
 */
function setupAutoComplete(input: HTMLInputElement, endpoint: string): void {
  let debounceTimeout: number | undefined

  input.addEventListener('input', () => {
    const query = input.value.trim()

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    // Don't search for empty queries or very short ones
    if (query.length < 2) {
      const resultsContainer = document.querySelector('.search-results')
      if (resultsContainer) {
        resultsContainer.innerHTML = ''
        resultsContainer.classList.add('hidden')
      }
      return
    }

    // Debounce the search
    debounceTimeout = setTimeout(() => {
      performSearch(query, endpoint)
    }, 300) as unknown as number
  })
}

/**
 * Display search results
 */
function displayResults(results: SearchResult[]): void {
  let resultsContainer = document.querySelector('.search-results')

  // Create results container if it doesn't exist
  if (!resultsContainer) {
    resultsContainer = document.createElement('div')
    resultsContainer.className = 'search-results'
    document.body.appendChild(resultsContainer)
  }

  // Clear previous results
  resultsContainer.innerHTML = ''

  if (results.length === 0) {
    const noResults = document.createElement('div')
    noResults.className = 'no-results'
    noResults.textContent = 'No results found'
    resultsContainer.appendChild(noResults)
  }
  else {
    const resultsList = document.createElement('ul')

    results.forEach((result) => {
      const item = document.createElement('li')
      item.className = 'result-item'

      const title = document.createElement('h4')
      title.textContent = result.title

      const description = document.createElement('p')
      description.textContent = result.description

      item.appendChild(title)
      item.appendChild(description)

      item.addEventListener('click', () => {
        window.location.href = result.url
      })

      resultsList.appendChild(item)
    })

    resultsContainer.appendChild(resultsList)
  }

  // Show results
  resultsContainer.classList.remove('hidden')
}

// Mock search result interface
interface SearchResult {
  title: string
  description: string
  url: string
}

/**
 * Generate mock search results based on query
 */
function generateMockResults(query: string): SearchResult[] {
  if (!query)
    return []

  // Just some mock data for the example
  return [
    {
      title: `Result for "${query}" - Item 1`,
      description: 'This is the first search result that matches your query.',
      url: '#result-1',
    },
    {
      title: `Search match - Item 2`,
      description: `Content containing the term "${query}" with additional context.`,
      url: '#result-2',
    },
    {
      title: `Related to "${query}"`,
      description: 'Another relevant item that might be of interest.',
      url: '#result-3',
    },
  ]
}

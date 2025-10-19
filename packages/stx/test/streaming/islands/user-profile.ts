/**
 * User Profile Island Component
 * Enhances server-rendered user profile with client-side interactivity
 */

interface UserProfileProps {
  editable?: boolean
  showNotifications?: boolean
}

interface _UserData {
  name: string
  avatar: string
  bio: string
  stats: {
    followers: number
    following: number
    posts: number
  }
}

// Default export is the hydration function
export default function hydrate(element: HTMLElement, props: UserProfileProps): void {
  console.log('Hydrating user profile with props:', props)

  // If the profile is editable, add edit functionality
  if (props.editable) {
    setupEditableProfile(element)
  }

  // Add follow button functionality
  setupFollowButton(element)

  // Add notification features if enabled
  if (props.showNotifications) {
    setupNotifications(element)
  }

  // Make profile tabs interactive
  setupProfileTabs(element)
}

/**
 * Set up editable profile fields
 */
function setupEditableProfile(element: HTMLElement): void {
  // Show edit buttons
  const editButtons = element.querySelectorAll('.edit-button')
  editButtons.forEach(button => button.classList.remove('hidden'))

  // Add edit functionality to fields
  setupEditableField(element, '.user-name', 'name')
  setupEditableField(element, '.user-bio', 'bio')

  // Setup avatar upload
  const avatarContainer = element.querySelector('.avatar-container')
  if (avatarContainer) {
    const uploadButton = document.createElement('button')
    uploadButton.className = 'avatar-upload-button'
    uploadButton.textContent = 'Change Photo'
    uploadButton.addEventListener('click', () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
          simulateAvatarUpload(element, target.files[0])
        }
      })
      input.click()
    })

    avatarContainer.appendChild(uploadButton)
  }
}

/**
 * Setup editable text field
 */
function setupEditableField(element: HTMLElement, selector: string, fieldName: string): void {
  const field = element.querySelector(selector) as HTMLElement | null
  if (!field)
    return

  field.setAttribute('data-original', field.textContent || '')

  const editButton = element.querySelector(`.edit-${fieldName}`) as HTMLElement | null
  if (editButton) {
    editButton.addEventListener('click', () => {
      if (field.getAttribute('contenteditable') === 'true') {
        // Save changes
        field.setAttribute('contenteditable', 'false')
        field.classList.remove('editing')
        saveProfileField(fieldName, field.textContent || '')
        editButton.textContent = 'Edit'
      }
      else {
        // Start editing
        field.setAttribute('contenteditable', 'true')
        field.classList.add('editing')
        field.focus()
        editButton.textContent = 'Save'
      }
    })
  }

  // Add cancel option with escape key
  field.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      field.textContent = field.getAttribute('data-original') || ''
      field.setAttribute('contenteditable', 'false')
      field.classList.remove('editing')
      if (editButton)
        editButton.textContent = 'Edit'
    }
  })
}

/**
 * Simulate avatar upload
 */
function simulateAvatarUpload(element: HTMLElement, file: File): void {
  const avatar = element.querySelector('.user-avatar') as HTMLImageElement | null
  if (!avatar)
    return

  // Create loading state
  avatar.classList.add('uploading')

  // Simulate upload delay
  setTimeout(() => {
    // In a real implementation, we would upload the file to a server
    // and get back a URL. Here we just create a local object URL.
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        avatar.src = e.target.result as string
        avatar.classList.remove('uploading')

        // Simulate saving to server
        console.log('Saving new avatar to server')
      }
    }
    reader.readAsDataURL(file)
  }, 1000)
}

/**
 * Setup follow button
 */
function setupFollowButton(element: HTMLElement): void {
  const followButton = element.querySelector('.follow-button') as HTMLElement | null
  if (!followButton)
    return

  followButton.addEventListener('click', () => {
    const isFollowing = followButton.classList.contains('following')

    if (isFollowing) {
      followButton.classList.remove('following')
      followButton.textContent = 'Follow'
      updateFollowerCount(element, -1)
    }
    else {
      followButton.classList.add('following')
      followButton.textContent = 'Following'
      updateFollowerCount(element, 1)
    }
  })
}

/**
 * Update follower count
 */
function updateFollowerCount(element: HTMLElement, change: number): void {
  const countElement = element.querySelector('.follower-count') as HTMLElement | null
  if (!countElement)
    return

  const currentCount = Number.parseInt(countElement.textContent || '0', 10)
  const newCount = currentCount + change
  countElement.textContent = newCount.toString()
}

/**
 * Save profile field to server (simulated)
 */
function saveProfileField(field: string, value: string): void {
  console.log(`Saving ${field}: ${value}`)
  // In a real implementation, this would send the data to a server
}

/**
 * Set up notifications
 */
function setupNotifications(element: HTMLElement): void {
  const notificationBell = element.querySelector('.notification-bell') as HTMLElement | null
  if (!notificationBell)
    return

  // Show notification indicator
  const indicator = document.createElement('span')
  indicator.className = 'notification-indicator'
  notificationBell.appendChild(indicator)

  // Setup notification panel
  const panel = document.createElement('div')
  panel.className = 'notification-panel hidden'
  panel.innerHTML = `
    <h4>Notifications</h4>
    <ul class="notification-list">
      <li>Someone liked your post</li>
      <li>New follower: User123</li>
      <li>Your post was shared</li>
    </ul>
  `

  element.appendChild(panel)

  notificationBell.addEventListener('click', () => {
    panel.classList.toggle('hidden')
    indicator.classList.remove('unread')
  })
}

/**
 * Set up profile tabs
 */
function setupProfileTabs(element: HTMLElement): void {
  const tabs = element.querySelectorAll('.profile-tab')
  const tabContents = element.querySelectorAll('.tab-content')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'))
      tabContents.forEach(c => c.classList.add('hidden'))

      // Add active class to clicked tab
      tab.classList.add('active')

      // Show corresponding content
      const tabId = tab.getAttribute('data-tab')
      const content = element.querySelector(`.tab-content[data-tab="${tabId}"]`)
      if (content)
        content.classList.remove('hidden')
    })
  })
}

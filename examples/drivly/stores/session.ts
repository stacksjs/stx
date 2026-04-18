import { defineStore } from 'stx'

export const useSession = defineStore('session', () => {
  const user = state<{ name: string, email: string, avatar: string, role: 'guest' | 'host' } | null>(null)
  const isAuthenticated = derived(() => user() !== null)
  const isHost = derived(() => user()?.role === 'host')

  function login(name: string, email: string, role: 'guest' | 'host' = 'guest') {
    const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    user.set({ name, email, avatar: initials, role })
  }

  function logout() {
    user.set(null)
  }

  return { user, isAuthenticated, isHost, login, logout }
}, {
  persist: { pick: ['user'], key: 'drivly-session' },
})

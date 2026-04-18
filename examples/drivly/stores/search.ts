import { defineStore } from 'stx'

export const useSearch = defineStore('search', () => {
  const location = state('San Francisco, CA')
  const pickupDate = state('')
  const returnDate = state('')
  const pickupTime = state('10:00')
  const returnTime = state('10:00')

  function setDates(pickup: string, ret: string) {
    pickupDate.set(pickup)
    returnDate.set(ret)
  }

  return { location, pickupDate, returnDate, pickupTime, returnTime, setDates }
}, {
  persist: { pick: ['location', 'pickupDate', 'returnDate', 'pickupTime', 'returnTime'], key: 'drivly-search' },
})

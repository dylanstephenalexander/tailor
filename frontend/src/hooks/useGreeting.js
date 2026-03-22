import { useMemo } from 'react'
import { greetings } from '../config/greetings'

function getTimeBucket() {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function getSessionSeed() {
  const key = 'greeting_seed'
  let seed = sessionStorage.getItem(key)
  if (!seed) {
    seed = String(Math.floor(Math.random() * 1_000_000))
    sessionStorage.setItem(key, seed)
  }
  return Number(seed)
}

export function useGreeting(name = '') {
  return useMemo(() => {
    const bucket = getTimeBucket()
    const pool   = [...(greetings[bucket] || []), ...greetings.any]
    const seed   = getSessionSeed()
    const picked = pool[seed % pool.length]
    return picked.replace(/\{name\}/g, name)
  }, [name])
}

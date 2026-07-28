import { useState, useEffect } from 'react'

/**
 * 持久化到 localStorage 的 state hook
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full — silently fail
    }
  }, [key, value])

  return [value, setValue]
}

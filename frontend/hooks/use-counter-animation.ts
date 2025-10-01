import { useEffect, useState } from 'react'

export function useCounterAnimation(target: number, duration: number = 1000) {
  const [count, setCount] = useState(target)

  useEffect(() => {
    const startCount = count
    const difference = target - startCount
    const startTime = Date.now()

    if (difference === 0) return

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      const currentCount = Math.round(startCount + difference * easeProgress)
      setCount(currentCount)

      if (progress === 1) {
        clearInterval(timer)
      }
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

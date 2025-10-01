'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { ProgramCard } from './program-card'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCounterAnimation } from '@/hooks/use-counter-animation'

export function ProgramGrid() {
  const visiblePrograms = useAppStore((state) => state.visiblePrograms)
  const isLoading = useAppStore((state) => state.isLoading)
  const setSelectedProgram = useAppStore((state) => state.setSelectedProgram)
  const setVisiblePrograms = useAppStore((state) => state.setVisiblePrograms)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isFiltered, setIsFiltered] = useState(false)

  // Load all programs on mount
  useEffect(() => {
    async function loadPrograms() {
      try {
        const response = await fetch('/api/programs?limit=100')
        const data = await response.json()
        setTotalCount(data.total || 0)
        setVisiblePrograms(data.programs.map((p: any) => ({
          ...p,
          status: 'eligible' as const
        })))
      } catch (error) {
        console.error('Failed to load programs:', error)
      }
    }
    loadPrograms()
  }, [setVisiblePrograms])

  const eligiblePrograms = visiblePrograms.filter(p => p.status === 'eligible')
  
  // Check if any program has been marked as filtered
  const hasFilteredPrograms = visiblePrograms.some((p: any) => p.isFiltered)
  
  // Update filtered state based on filtered flag
  useEffect(() => {
    setIsFiltered(hasFilteredPrograms)
  }, [hasFilteredPrograms])
  
  // Animated counter for smooth number transitions
  const displayCount = useCounterAnimation(eligiblePrograms.length, 800)

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Filtering overlay */}
      <AnimatePresence>
        {isLoading && isFiltered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 px-6 py-3 bg-white border border-neutral-200 rounded-full shadow-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-4 w-4 text-neutral-900" />
              </motion.div>
              <span className="text-sm text-neutral-900">Filtering</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            {isFiltered && totalCount > 0 && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-neutral-400 line-through"
              >
                {totalCount.toLocaleString()}
              </motion.span>
            )}
            <motion.h2 
              className="text-sm font-medium text-neutral-900 tabular-nums"
              key={displayCount}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3,
                scale: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              {isFiltered 
                ? `${displayCount.toLocaleString()} ${displayCount === 1 ? 'Program' : 'Programs'}`
                : `${totalCount.toLocaleString()} Programs`
              }
            </motion.h2>
          </div>
          <motion.p 
            className="text-xs text-neutral-500"
            key={isFiltered ? 'filtered' : 'all'}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isFiltered ? 'Filtered' : `Showing ${eligiblePrograms.length}`}
          </motion.p>
        </div>
      </div>

      {/* Program List */}
      <div className="flex-1 overflow-y-auto px-8">
        <AnimatePresence mode="popLayout">
          {eligiblePrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => setSelectedProgram(program.id)}
            />
          ))}
        </AnimatePresence>

        {eligiblePrograms.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500">
              No eligible programs found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { ProgramCard } from './program-card'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            {isFiltered && totalCount > 0 && (
              <span className="text-sm text-neutral-400 line-through">
                {totalCount.toLocaleString()}
              </span>
            )}
            <h2 className="text-sm font-medium text-neutral-900">
              {isFiltered 
                ? `${eligiblePrograms.length.toLocaleString()} ${eligiblePrograms.length === 1 ? 'Program' : 'Programs'}`
                : `${totalCount.toLocaleString()} Programs`
              }
            </h2>
          </div>
          <p className="text-xs text-neutral-500">
            {isFiltered ? 'Filtered' : `Showing ${eligiblePrograms.length}`}
          </p>
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

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
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (visiblePrograms.length > 0) {
      setInitialLoad(false)
    }
  }, [visiblePrograms])

  const eligiblePrograms = visiblePrograms.filter(p => p.status === 'eligible')

  if (initialLoad) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-8 py-8">
          <h2 className="text-3xl font-light text-neutral-900 mb-3">
            Eligible programs
          </h2>
          <p className="text-neutral-500 text-sm">
            Results will appear here as they're filtered
          </p>
        </div>
      </div>
    )
  }

  if (isLoading && visiblePrograms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-neutral-900">
            {eligiblePrograms.length} {eligiblePrograms.length === 1 ? 'Program' : 'Programs'}
          </h2>
          <p className="text-xs text-neutral-500">
            Binary filtered
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

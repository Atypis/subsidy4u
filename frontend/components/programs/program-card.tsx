'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { ProgramWithStatus } from '@/types'

interface ProgramCardProps {
  program: ProgramWithStatus
  onClick?: () => void
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  if (program.status === 'filtered') {
    return null // Don't show filtered programs
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 20, 
        scale: 0.9,
        transition: {
          duration: 0.2
        }
      }}
      whileHover={{ 
        x: 4,
        transition: { duration: 0.15 }
      }}
      className="group border-b border-neutral-200 py-6 cursor-pointer hover:bg-neutral-50 -mx-8 px-8 transition-colors"
      onClick={onClick}
    >
      {/* Title & Type */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-normal text-neutral-900 leading-snug flex-1">
          {program.title}
        </h3>
        <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        {program.foerdergebiet && (
          <span>{program.foerdergebiet}</span>
        )}
        {program.foerderart && (
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
            {program.foerderart}
          </span>
        )}
        {program.foerdergeber && (
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
            {program.foerdergeber}
          </span>
        )}
      </div>

      {/* Description */}
      {program.kurztext && (
        <p className="text-sm text-neutral-600 line-clamp-2 mt-3 leading-relaxed">
          {program.kurztext}
        </p>
      )}
    </motion.div>
  )
}

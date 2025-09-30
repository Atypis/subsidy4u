import type { Database } from './database'

export type SubsidyProgram = Database['public']['Tables']['subsidy_programs']['Row']

export interface CompanyProfile {
  name: string
  website?: string
  location: string // Bundesland
  size: 'klein' | 'mittel' | 'groß'
  industry: string[]
  foundingYear?: number
  fundingStage?: string
  projectDescription?: string
  employees?: number
  revenue?: number
  legalForm?: string // GmbH, AG, etc.
}

export interface FilterCriteria {
  region?: string[]
  foerderart?: string[]
  foerderbereich?: string[]
  companySize?: string
  industry?: string[]
}

export interface FilterResult {
  programIds: string[]
  reason: string
  criteriaApplied: FilterCriteria
}

export type ProgramStatus = 'eligible' | 'filtered' | 'analyzing'

export interface ProgramWithStatus extends SubsidyProgram {
  status: ProgramStatus
  filterReason?: string
}

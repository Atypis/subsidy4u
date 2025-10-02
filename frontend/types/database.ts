export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subsidy_programs: {
        Row: {
          // Original scraped fields
          id: string
          title: string
          url: string
          foerderart: string | null
          foerdergebiet: string | null
          foerderbereich: string | null
          foerderberechtigte: string | null
          foerdergeber: string | null
          kurztext: string | null
          volltext: string | null
          rechtliche_voraussetzungen: string | null
          richtlinie: string | null
          ansprechpartner: string | null
          scraped_at: string
          created_at?: string

          // Extracted heuristics (Ontology v4.0 - 11 filters)
          // TIER S: Universal Hard Filters (7)
          richtlinie_gueltigkeit_bis: string | null // Program validity deadline
          ausschluss_unternehmen_in_schwierigkeiten: boolean | null // Excludes distressed companies
          agvo_sektorausschluss: boolean | null // EU sector exclusions (46% of programs)
          foerderbetrag_max_eur: number | null // Max funding amount
          foerderbetrag_min_eur: number | null // Min funding amount
          de_minimis_beihilfe: boolean | null // De-minimis aid (€200k/3y)
          antragsfrist: string | null // Application deadline

          // TIER A: Specific Hard Filters (4)
          kmu_erforderlich: boolean | null // SME requirement
          mitarbeiter_limit_max: number | null // Explicit max employees (overrides KMU)
          umsatz_limit_max_eur: number | null // Explicit max revenue (overrides KMU)
          unternehmensalter_max_jahre: number | null // Max company age (for startups)

          // Extraction metadata (3)
          extraction_confidence: number | null // LLM confidence (0.0-1.0)
          extraction_date: string | null // Extraction timestamp
          extraction_notes: string | null // Uncertainties, conflicts, context
        }
        Insert: {
          id?: string
          title: string
          url: string
          foerderart?: string | null
          foerdergebiet?: string | null
          foerderbereich?: string | null
          foerderberechtigte?: string | null
          foerdergeber?: string | null
          kurztext?: string | null
          volltext?: string | null
          rechtliche_voraussetzungen?: string | null
          richtlinie?: string | null
          ansprechpartner?: string | null
          scraped_at: string

          // Extracted heuristics v4.0 (optional for insert)
          richtlinie_gueltigkeit_bis?: string | null
          ausschluss_unternehmen_in_schwierigkeiten?: boolean | null
          agvo_sektorausschluss?: boolean | null
          foerderbetrag_max_eur?: number | null
          foerderbetrag_min_eur?: number | null
          de_minimis_beihilfe?: boolean | null
          antragsfrist?: string | null
          kmu_erforderlich?: boolean | null
          mitarbeiter_limit_max?: number | null
          umsatz_limit_max_eur?: number | null
          unternehmensalter_max_jahre?: number | null
          extraction_confidence?: number | null
          extraction_date?: string | null
          extraction_notes?: string | null
        }
        Update: {
          id?: string
          title?: string
          url?: string
          foerderart?: string | null
          foerdergebiet?: string | null
          foerderbereich?: string | null
          foerderberechtigte?: string | null
          foerdergeber?: string | null
          kurztext?: string | null
          volltext?: string | null
          rechtliche_voraussetzungen?: string | null
          richtlinie?: string | null
          ansprechpartner?: string | null
          scraped_at?: string

          // Extracted heuristics v4.0 (optional for update)
          richtlinie_gueltigkeit_bis?: string | null
          ausschluss_unternehmen_in_schwierigkeiten?: boolean | null
          agvo_sektorausschluss?: boolean | null
          foerderbetrag_max_eur?: number | null
          foerderbetrag_min_eur?: number | null
          de_minimis_beihilfe?: boolean | null
          antragsfrist?: string | null
          kmu_erforderlich?: boolean | null
          mitarbeiter_limit_max?: number | null
          umsatz_limit_max_eur?: number | null
          unternehmensalter_max_jahre?: number | null
          extraction_confidence?: number | null
          extraction_date?: string | null
          extraction_notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

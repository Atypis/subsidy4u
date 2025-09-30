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

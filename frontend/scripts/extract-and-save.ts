/**
 * Production Heuristic Extraction Script (Ontology v4.1)
 *
 * - Extracts heuristics using GPT-5
 * - Writes directly to Supabase (idempotent - skips already extracted)
 * - Fully parallel execution
 * - Progress tracking with checkpoints
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { Database } from '@/types/database'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// ==========================================
// Configuration
// ==========================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing environment variables')
  process.exit(1)
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

// Batch size configuration
const TEST_MODE = process.argv.includes('--test')
const batchArg = process.argv.find(arg => arg.startsWith('--batch='))
const BATCH_SIZE = TEST_MODE ? 10 : batchArg ? parseInt(batchArg.split('=')[1]) : undefined // undefined = all unprocessed

const MODEL = 'gpt-5'
const REASONING_EFFORT = 'high' as const

// ==========================================
// Extraction Schema (Ontology v4.1 - 10 filters)
// ==========================================

interface ExtractedHeuristics {
  // TIER S: Universal Hard Filters (7)
  richtlinie_gueltigkeit_bis: string | null
  ausschluss_unternehmen_in_schwierigkeiten: boolean | null
  agvo_sektorausschluss: boolean | null
  foerderbetrag_max_eur: number | null
  foerderbetrag_min_eur: number | null
  de_minimis_beihilfe: boolean | null
  foerderbetrag_unbegrenzt: boolean | null

  // TIER A: Specific Hard Filters (4)
  kmu_erforderlich: boolean | null
  mitarbeiter_limit_max: number | null
  umsatz_limit_max_eur: number | null
  unternehmensalter_max_jahre: number | null

  // Metadata
  extraction_confidence: number
  extraction_notes: string
}

// ==========================================
// System Prompt (Ontology v4.1)
// ==========================================

const SYSTEM_PROMPT = `Du bist ein Experte für die Extraktion strukturierter Heuristiken aus deutschen Förderprogramm-Texten.

**AUFGABE**: Extrahiere 10 filterbare Heuristiken + Metadaten aus dem bereitgestellten Programmtext.

**ONTOLOGIE v4.1 (Streamlined - 10 Core Filters)**:

**TIER S: Universelle Hard Filters (7)**

1. **richtlinie_gueltigkeit_bis** (DATE | null)
   - Quelle: richtlinie (primär)
   - Muster: "gültig bis DD.MM.YYYY", "befristet bis DD.MM.YYYY"
   - null = keine Frist gefunden (unbegrenzt angenommen)
   - Format: YYYY-MM-DD (ISO)

2. **ausschluss_unternehmen_in_schwierigkeiten** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen, richtlinie
   - Muster: "Unternehmen in Schwierigkeiten", "Ausschluss.*Schwierigkeiten"
   - true = expliziter Ausschluss, false = explizit erlaubt, null = nicht erwähnt

3. **agvo_sektorausschluss** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen, richtlinie
   - Muster: "AGVO", "Verordnung.*651/2014", "Artikel 1.*Abs.*2"
   - Sektoren: Landwirtschaft, Fischerei, Aquakultur, Kohle, Stahl
   - true = AGVO-Ausschlüsse gelten, false/null = nicht erwähnt

4. **foerderbetrag_max_eur** (NUMBER | null)
   - Quelle: volltext (primär), rechtliche_voraussetzungen
   - Muster: "bis zu EUR X", "maximal EUR X", "höchstens EUR X"
   - Nur absolute Beträge extrahieren, keine Formeln
   - WICHTIG: Wenn nur Prozentsatz ohne Obergrenze → null (siehe foerderbetrag_unbegrenzt)

5. **foerderbetrag_min_eur** (NUMBER | null)
   - Quelle: volltext, rechtliche_voraussetzungen
   - Muster: "mindestens EUR X", "ab EUR X"
   - Nur absolute Beträge extrahieren

6. **de_minimis_beihilfe** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen, richtlinie
   - Muster: "De-minimis", "De minimis", "Verordnung.*1407/2013"
   - Grenzwert: €200.000 über 3 Jahre
   - true = De-minimis, false/null = nicht erwähnt

7. **foerderbetrag_unbegrenzt** (BOOLEAN | null)
   - Quelle: volltext, rechtliche_voraussetzungen
   - Muster: "X % der Kosten", "X Prozent der Ausgaben" OHNE "bis zu EUR Y", "maximal EUR Y"
   - true = Prozentsatz-basiert OHNE absolute Obergrenze (z.B. "80% der Kosten")
   - false = Standard-Förderung mit Cap
   - null = nicht klar
   - WICHTIG: Wenn true → foerderbetrag_max_eur MUSS null sein!

**TIER A: Spezifische Hard Filters (4)**

8. **kmu_erforderlich** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen
   - Muster: "KMU", "kleine und mittlere Unternehmen"
   - EU-Definition: ≤250 MA, ≤€50M Umsatz
   - true = nur KMU, false = auch Großunternehmen, null = nicht erwähnt

9. **mitarbeiter_limit_max** (NUMBER | null)
   - Quelle: rechtliche_voraussetzungen
   - Muster: "nicht mehr als X Beschäftigte", "maximal X Mitarbeiter"
   - Nur explizite Zahlen, NICHT implizit von KMU ableiten

10. **umsatz_limit_max_eur** (NUMBER | null)
    - Quelle: rechtliche_voraussetzungen
    - Muster: "Jahresumsatz.*höchstens EUR X", "Umsatz.*maximal EUR X"
    - Nur explizite Zahlen, NICHT implizit von KMU ableiten

11. **unternehmensalter_max_jahre** (NUMBER | null)
    - Quelle: rechtliche_voraussetzungen
    - Muster: "nicht länger als X Jahre", "maximal X Jahre seit Gründung"
    - Nur explizite Zahlen extrahieren

**METADATEN**

12. **extraction_confidence** (NUMBER 0.0-1.0)
    - 1.0 = alle Felder klar und eindeutig
    - 0.8 = meiste Felder klar, einige unklar
    - 0.6 = mehrere Felder unsicher
    - 0.4 = viele Felder unklar oder fehlend

13. **extraction_notes** (STRING)
    - Unklarheiten, Konflikte, wichtiger Kontext
    - Fehlende Informationen
    - Widersprüche zwischen Quellen

**WICHTIGE REGELN**:

1. **null-Semantik**: Wenn Information nicht gefunden → null (NICHT false!)
2. **Datumsformat**: Immer YYYY-MM-DD (ISO 8601)
3. **Nur explizite Werte**: Keine Implikationen
4. **Quellenpriorität**: richtlinie > rechtliche_voraussetzungen > volltext > kurztext
5. **Konfidenz**: Sei ehrlich - lieber null + niedriger Confidence als falsche Daten
6. **Keine Halluzinationen**: Nur extrahieren was explizit im Text steht
7. **foerderbetrag_unbegrenzt Logik**:
   - "80% der Kosten" ohne "maximal EUR X" → unbegrenzt=true, max_eur=null
   - "80% der Kosten, maximal EUR 100.000" → unbegrenzt=false, max_eur=100000

Antworte ausschließlich mit gültigem JSON (ExtractedHeuristics-Schema).`

// ==========================================
// Helper Functions
// ==========================================

interface ProgramToExtract {
  id: string
  title: string | null
  kurztext: string | null
  volltext: string | null
  rechtliche_voraussetzungen: string | null
  richtlinie: string | null
}

async function fetchUnprocessedPrograms(limit?: number): Promise<ProgramToExtract[]> {
  console.log(`\n📊 Fetching unprocessed programs from database...\n`)

  let query = supabase
    .from('subsidy_programs')
    .select('id, title, kurztext, volltext, rechtliche_voraussetzungen, richtlinie')
    .is('extraction_date', null) // Only programs not yet processed
    .not('kurztext', 'is', null)
    .not('volltext', 'is', null)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  if (!data) throw new Error('No programs found')

  console.log(`✅ Found ${data.length} unprocessed programs\n`)

  return data as ProgramToExtract[]
}

async function extractHeuristics(
  program: ProgramToExtract
): Promise<ExtractedHeuristics & { programId: string }> {
  const userPrompt = `**Programm-ID**: ${program.id}
**Titel**: ${program.title}

**KURZTEXT**:
${program.kurztext || 'N/A'}

**VOLLTEXT**:
${program.volltext || 'N/A'}

**RECHTLICHE VORAUSSETZUNGEN**:
${program.rechtliche_voraussetzungen || 'N/A'}

**RICHTLINIE** (erste 15.000 Zeichen):
${program.richtlinie?.substring(0, 15000) || 'N/A'}

Extrahiere jetzt die Heuristiken als JSON.`

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    // @ts-ignore - reasoning_effort is valid for GPT-5
    reasoning_effort: REASONING_EFFORT
  })

  const result = JSON.parse(response.choices[0].message.content || '{}') as ExtractedHeuristics

  return {
    ...result,
    programId: program.id
  }
}

async function saveToSupabase(extraction: ExtractedHeuristics & { programId: string }): Promise<void> {
  const { programId, ...heuristics } = extraction

  const { error } = await supabase
    .from('subsidy_programs')
    .update({
      ...heuristics,
      extraction_date: new Date().toISOString()
    })
    .eq('id', programId)

  if (error) {
    console.error(`❌ Error saving ${programId}:`, error.message)
    throw error
  }
}

// ==========================================
// Main Extraction Function
// ==========================================

async function runExtraction() {
  console.log('🚀 Starting Heuristic Extraction (Ontology v4.1)\n')
  console.log(`Model: ${MODEL} (${REASONING_EFFORT})`)
  console.log(`Mode: ${TEST_MODE ? 'TEST (10 programs)' : BATCH_SIZE ? `BATCH (${BATCH_SIZE} programs)` : 'PRODUCTION (all unprocessed)'}\n`)

  // Fetch unprocessed programs
  const programs = await fetchUnprocessedPrograms(BATCH_SIZE)

  if (programs.length === 0) {
    console.log('✅ No unprocessed programs found. All done!')
    return
  }

  console.log(`\n🔄 Processing ${programs.length} programs in parallel...\n`)
  const startTime = Date.now()

  // Create all extraction tasks
  const tasks = programs.map((program, i) =>
    extractHeuristics(program)
      .then(async (extraction) => {
        await saveToSupabase(extraction)
        console.log(`✅ [${i + 1}/${programs.length}] Saved: ${program.title?.substring(0, 60)}...`)
        return { success: true, programId: program.id }
      })
      .catch((error) => {
        console.error(`❌ [${i + 1}/${programs.length}] Failed: ${program.id} - ${error.message}`)
        return { success: false, programId: program.id, error: error.message }
      })
  )

  // Execute all in parallel
  const results = await Promise.all(tasks)

  const totalTime = Date.now() - startTime
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log('\n\n' + '='.repeat(80))
  console.log('📊 EXTRACTION COMPLETE')
  console.log('='.repeat(80))
  console.log(`\nTotal programs: ${programs.length}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`)
  console.log(`Avg time per program: ${(totalTime / programs.length / 1000).toFixed(1)}s`)

  if (failed > 0) {
    console.log('\n❌ Failed programs:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.programId}: ${(r as any).error}`)
    })
  }

  console.log('\n' + '='.repeat(80) + '\n')
}

// ==========================================
// Run
// ==========================================

runExtraction().catch(console.error)

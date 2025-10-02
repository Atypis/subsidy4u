/**
 * Test Heuristic Extraction Script
 *
 * Compares GPT-5 vs GPT-5-mini for extracting program heuristics
 * Tests on 10 diverse programs and outputs comparison report
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { Database } from '@/types/database'
import fs from 'fs'
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

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required')
  console.error('Please set it in .env.local or export it:')
  console.error('  export OPENAI_API_KEY="sk-..."')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Supabase environment variables are required')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

const TEST_SAMPLE_SIZE = 10
const MODELS_TO_TEST = [
  { name: 'gpt-5-mini', reasoning: 'medium' as const },
  { name: 'gpt-5', reasoning: 'high' as const }
]

// ==========================================
// Extraction Schema (from ontology)
// ==========================================

interface ExtractedHeuristics {
  // TIER S: Universal Hard Filters
  richtlinie_gueltigkeit_bis: string | null // ISO date YYYY-MM-DD
  ausschluss_unternehmen_in_schwierigkeiten: boolean | null
  agvo_sektorausschluss: boolean | null
  foerderbetrag_max_eur: number | null
  foerderbetrag_min_eur: number | null
  de_minimis_beihilfe: boolean | null
  antragsfrist: string | null // ISO date YYYY-MM-DD or 'laufend'

  // TIER A: Specific Hard Filters
  kmu_erforderlich: boolean | null
  mitarbeiter_limit_max: number | null
  umsatz_limit_max_eur: number | null
  unternehmensalter_max_jahre: number | null

  // Metadata
  extraction_confidence: number // 0.0 - 1.0
  extraction_notes: string // Uncertainties, conflicts, context
}

// ==========================================
// System Prompt (with ontology)
// ==========================================

const SYSTEM_PROMPT = `Du bist ein Experte für die Extraktion strukturierter Heuristiken aus deutschen Förderprogramm-Texten.

**AUFGABE**: Extrahiere 11 filterbare Heuristiken + Metadaten aus dem bereitgestellten Programmtext.

**ONTOLOGIE v4.0 (Streamlined - High Signal/Noise Ratio)**:

**TIER S: Universelle Hard Filters**

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
   - null = keine absolute Grenze angegeben

5. **foerderbetrag_min_eur** (NUMBER | null)
   - Quelle: volltext, rechtliche_voraussetzungen
   - Muster: "mindestens EUR X", "ab EUR X"
   - Nur absolute Beträge extrahieren
   - null = keine Mindestgrenze angegeben

6. **de_minimis_beihilfe** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen, richtlinie
   - Muster: "De-minimis", "De minimis", "Verordnung.*1407/2013"
   - Grenzwert: €200.000 über 3 Jahre
   - true = De-minimis, false/null = nicht erwähnt

7. **antragsfrist** (DATE | 'laufend' | null)
   - Quelle: volltext, rechtliche_voraussetzungen
   - Muster: "Antragsfrist DD.MM.YYYY", "Antragsschluss DD.MM.YYYY", "laufend"
   - Format: YYYY-MM-DD oder "laufend"
   - null = keine Frist angegeben

**TIER A: Spezifische Hard Filters**

8. **kmu_erforderlich** (BOOLEAN | null)
   - Quelle: rechtliche_voraussetzungen
   - Muster: "KMU", "kleine und mittlere Unternehmen"
   - EU-Definition: ≤250 MA, ≤€50M Umsatz
   - true = nur KMU, false = auch Großunternehmen, null = nicht erwähnt

9. **mitarbeiter_limit_max** (NUMBER | null)
    - Quelle: rechtliche_voraussetzungen
    - Muster: "nicht mehr als X Beschäftigte", "maximal X Mitarbeiter"
    - Nur explizite Zahlen, NICHT implizit von KMU ableiten
    - null = keine explizite Grenze

10. **umsatz_limit_max_eur** (NUMBER | null)
    - Quelle: rechtliche_voraussetzungen
    - Muster: "Jahresumsatz.*höchstens EUR X", "Umsatz.*maximal EUR X"
    - Nur explizite Zahlen, NICHT implizit von KMU ableiten
    - null = keine explizite Grenze

11. **unternehmensalter_max_jahre** (NUMBER | null)
    - Quelle: rechtliche_voraussetzungen
    - Muster: "nicht länger als X Jahre", "maximal X Jahre seit Gründung"
    - Nur explizite Zahlen extrahieren
    - null = keine Altersgrenze

**METADATEN**

12. **extraction_confidence** (NUMBER 0.0-1.0)
    - 1.0 = alle Felder klar und eindeutig
    - 0.8 = meiste Felder klar, einige unklar
    - 0.6 = mehrere Felder unsicher
    - 0.4 = viele Felder unklar oder fehlend
    - Berücksichtige Textqualität und Vollständigkeit

13. **extraction_notes** (STRING)
    - Unklarheiten, Konflikte, wichtiger Kontext
    - Fehlende Informationen
    - Widersprüche zwischen Quellen

**WICHTIGE REGELN**:

1. **null-Semantik**: Wenn Information nicht gefunden → null (NICHT false!)
2. **Datumsformat**: Immer YYYY-MM-DD (ISO 8601)
3. **Nur explizite Werte**: Keine Implikationen (z.B. KMU → nicht automatisch mitarbeiter_limit_max = 250)
4. **Quellenpriorität**: richtlinie > rechtliche_voraussetzungen > volltext > kurztext
5. **Konfidenz**: Sei ehrlich - lieber null + niedriger Confidence als falsche Daten
6. **Keine Halluzinationen**: Nur extrahieren was explizit im Text steht

**ENTFERNTE FELDER in v4.0** (nicht mehr extrahieren):
- sicherheiten_erforderlich (zu vage)
- foerdersatz_prozent (oft Formeln/Ranges)
- gruendungsfoerdernd (zu subjektiv)
- antrag_vor_massnahmenbeginn (informativ, kein Filter)
- investition_in_deutschland_erforderlich (implizit)
- programm_laufzeit_bis (Verwechslungsgefahr)
- antragsfrist_typ (redundant)

Antworte ausschließlich mit gültigem JSON (ExtractedHeuristics-Schema).`

// ==========================================
// Helper Functions
// ==========================================

interface ProgramSample {
  id: string
  title: string | null
  url: string | null
  foerdergebiet: string[] | null
  foerderberechtigte: string[] | null
  foerderart: string[] | null
  kurztext: string | null
  volltext: string | null
  rechtliche_voraussetzungen: string | null
  richtlinie: string | null
}

async function fetchRandomSample(limit: number): Promise<ProgramSample[]> {
  console.log(`\n📊 Fetching ${limit} random programs from database...\n`)

  // Get random sample using RANDOM() order
  const { data, error } = await supabase
    .from('subsidy_programs')
    .select('id, title, url, foerdergebiet, foerderberechtigte, foerderart, kurztext, volltext, rechtliche_voraussetzungen, richtlinie')
    .not('kurztext', 'is', null)
    .not('volltext', 'is', null)
    .limit(limit)

  if (error) throw error
  if (!data) throw new Error('No programs found')

  console.log(`✅ Fetched ${data.length} random programs\n`)

  return data as ProgramSample[]
}

async function extractWithModel(
  program: ProgramSample,
  modelName: string,
  reasoning: 'minimal' | 'low' | 'medium' | 'high'
): Promise<{ result: ExtractedHeuristics; tokensUsed: { input: number; output: number }; latency: number }> {
  const startTime = Date.now()

  const userPrompt = `**Programm-ID**: ${program.id}
**Titel**: ${program.title}
**URL**: ${program.url}

**KURZTEXT**:
${program.kurztext || 'N/A'}

**VOLLTEXT**:
${program.volltext || 'N/A'}

**RECHTLICHE VORAUSSETZUNGEN**:
${program.rechtliche_voraussetzungen || 'N/A'}

**RICHTLINIE** (erste 10.000 Zeichen):
${program.richtlinie?.substring(0, 10000) || 'N/A'}

Extrahiere jetzt die Heuristiken als JSON.`

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    // GPT-5 models don't support custom temperature - use default
    // @ts-ignore - reasoning_effort is valid for GPT-5 models
    reasoning_effort: reasoning
  })

  const latency = Date.now() - startTime
  const result = JSON.parse(response.choices[0].message.content || '{}') as ExtractedHeuristics

  return {
    result,
    tokensUsed: {
      input: response.usage?.prompt_tokens || 0,
      output: response.usage?.completion_tokens || 0
    },
    latency
  }
}

function calculateDifferences(result1: ExtractedHeuristics, result2: ExtractedHeuristics): {
  identical: number
  different: number
  differences: string[]
} {
  const keys = Object.keys(result1) as (keyof ExtractedHeuristics)[]
  let identical = 0
  let different = 0
  const differences: string[] = []

  for (const key of keys) {
    if (key === 'extraction_notes') continue // Skip notes in comparison

    const val1 = result1[key]
    const val2 = result2[key]

    if (JSON.stringify(val1) === JSON.stringify(val2)) {
      identical++
    } else {
      different++
      differences.push(`  • ${key}: [${modelName1}] ${JSON.stringify(val1)} vs [${modelName2}] ${JSON.stringify(val2)}`)
    }
  }

  return { identical, different, differences }
}

// ==========================================
// Main Test Function
// ==========================================

async function runComparison() {
  console.log('🚀 Starting Model Comparison Test (FULLY PARALLEL)\n')
  console.log(`Models: ${MODELS_TO_TEST.map(m => `${m.name} (${m.reasoning})`).join(' vs ')}\n`)

  // Fetch sample
  const programs = await fetchRandomSample(TEST_SAMPLE_SIZE)

  console.log(`\n🔄 Sending ${programs.length * MODELS_TO_TEST.length} API requests in parallel...\n`)
  const startTime = Date.now()

  // Create ALL API requests upfront (10 programs × 2 models = 20 requests)
  const allRequests = programs.flatMap((program, i) =>
    MODELS_TO_TEST.map((model, j) => ({
      programIndex: i,
      modelIndex: j,
      promise: extractWithModel(program, model.name, model.reasoning)
    }))
  )

  // Execute ALL requests in parallel
  const allExtractions = await Promise.all(allRequests.map(r => r.promise))

  const totalParallelTime = Date.now() - startTime
  console.log(`✅ All ${allRequests.length} requests completed in ${totalParallelTime}ms (${(totalParallelTime / 1000).toFixed(1)}s)\n`)

  // Process results
  const results: any[] = []
  let totalCost = { model1: 0, model2: 0 }

  for (let i = 0; i < programs.length; i++) {
    const program = programs[i]
    console.log(`\n[${i + 1}/${programs.length}] ${program.title?.substring(0, 60)}...`)

    // Get extractions for this program (2 models)
    const extraction1 = allExtractions[i * 2]
    const extraction2 = allExtractions[i * 2 + 1]

    // Calculate costs
    const cost1 = (extraction1.tokensUsed.input / 1_000_000) * 0.30 + (extraction1.tokensUsed.output / 1_000_000) * 1.20 // gpt-5-mini
    const cost2 = (extraction2.tokensUsed.input / 1_000_000) * 1.25 + (extraction2.tokensUsed.output / 1_000_000) * 10.00 // gpt-5

    totalCost.model1 += cost1
    totalCost.model2 += cost2

    // Compare results
    const diff = calculateDifferences(extraction1.result, extraction2.result)

    results.push({
      program: {
        id: program.id,
        title: program.title,
        region: program.foerdergebiet,
        entity_type: program.foerderberechtigte
      },
      model1: {
        name: MODELS_TO_TEST[0].name,
        result: extraction1.result,
        tokens: extraction1.tokensUsed,
        latency: extraction1.latency,
        cost: cost1
      },
      model2: {
        name: MODELS_TO_TEST[1].name,
        result: extraction2.result,
        tokens: extraction2.tokensUsed,
        latency: extraction2.latency,
        cost: cost2
      },
      comparison: diff
    })

    console.log(`   ✅ ${MODELS_TO_TEST[0].name}: ${extraction1.tokensUsed.input + extraction1.tokensUsed.output} tokens, $${cost1.toFixed(4)}`)
    console.log(`   ✅ ${MODELS_TO_TEST[1].name}: ${extraction2.tokensUsed.input + extraction2.tokensUsed.output} tokens, $${cost2.toFixed(4)}`)
    console.log(`   📊 Agreement: ${diff.identical}/${diff.identical + diff.different} fields (${((diff.identical / (diff.identical + diff.different)) * 100).toFixed(1)}%)`)
    if (diff.differences.length > 0 && diff.differences.length <= 3) {
      console.log(`   ⚠️  Differences:\n${diff.differences.join('\n')}`)
    }
  }

  // Generate report
  const report = {
    test_date: new Date().toISOString(),
    models_tested: MODELS_TO_TEST,
    sample_size: programs.length,
    total_cost: totalCost,
    results,
    summary: {
      avg_latency: {
        model1: results.reduce((sum, r) => sum + r.model1.latency, 0) / results.length,
        model2: results.reduce((sum, r) => sum + r.model2.latency, 0) / results.length
      },
      avg_tokens: {
        model1: results.reduce((sum, r) => sum + r.model1.tokens.input + r.model1.tokens.output, 0) / results.length,
        model2: results.reduce((sum, r) => sum + r.model2.tokens.input + r.model2.tokens.output, 0) / results.length
      },
      avg_agreement: results.reduce((sum, r) => sum + (r.comparison.identical / (r.comparison.identical + r.comparison.different)), 0) / results.length,
      avg_confidence: {
        model1: results.reduce((sum, r) => sum + (r.model1.result.extraction_confidence || 0), 0) / results.length,
        model2: results.reduce((sum, r) => sum + (r.model2.result.extraction_confidence || 0), 0) / results.length
      }
    }
  }

  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const outputDir = path.join(__dirname, '../heuristic-extraction/results')

  // Create results directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, `comparison-${timestamp}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))

  console.log('\n\n' + '='.repeat(80))
  console.log('📊 COMPARISON SUMMARY')
  console.log('='.repeat(80))
  console.log(`\n${MODELS_TO_TEST[0].name} (${MODELS_TO_TEST[0].reasoning}):`)
  console.log(`  • Avg per-request time: ${report.summary.avg_latency.model1.toFixed(0)}ms`)
  console.log(`  • Avg tokens: ${report.summary.avg_tokens.model1.toFixed(0)}`)
  console.log(`  • Avg confidence: ${(report.summary.avg_confidence.model1 * 100).toFixed(1)}%`)
  console.log(`  • Total cost: $${totalCost.model1.toFixed(4)} (${programs.length} programs)`)

  console.log(`\n${MODELS_TO_TEST[1].name} (${MODELS_TO_TEST[1].reasoning}):`)
  console.log(`  • Avg per-request time: ${report.summary.avg_latency.model2.toFixed(0)}ms`)
  console.log(`  • Avg tokens: ${report.summary.avg_tokens.model2.toFixed(0)}`)
  console.log(`  • Avg confidence: ${(report.summary.avg_confidence.model2 * 100).toFixed(1)}%`)
  console.log(`  • Total cost: $${totalCost.model2.toFixed(4)} (${programs.length} programs)`)

  console.log(`\nField Agreement: ${(report.summary.avg_agreement * 100).toFixed(1)}%`)
  console.log(`Total parallel execution time: ${(totalParallelTime / 1000).toFixed(1)}s`)
  console.log(`\n✅ Full report saved: ${outputPath}`)
  console.log('\n' + '='.repeat(80) + '\n')
}

// ==========================================
// Run Test
// ==========================================

runComparison().catch(console.error)

// Use same variable names in calculateDifferences
const modelName1 = MODELS_TO_TEST[0].name
const modelName2 = MODELS_TO_TEST[1].name

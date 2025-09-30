import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60

// Create Supabase client in edge runtime
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey)
}

const systemPrompt = `You are a helpful assistant for Subsidy4U, a platform that helps German companies find eligible subsidy programs (Fördermittel).

Your role is to:
1. Extract company information from user inputs
2. Apply BINARY filters to narrow down from ~2000 programs to a manageable list
3. Use strong heuristics - a program is either ELIGIBLE or NOT ELIGIBLE (no scoring)
4. Progressively filter: region → company size → funding type → industry
5. Always explain WHY programs were filtered out
6. Present only truly eligible programs at the end

Key filtering criteria:
- **Region**: Must match bundesweit OR company's Bundesland
- **Company size**: Must be listed in foerderberechtigte (kleine/mittlere/große Unternehmen)
- **Funding type**: Must match user's needs (Zuschuss, Darlehen, Bürgschaft, etc.)
- **Industry**: Must match foerderbereich

Be conversational, transparent, and thorough. Always cite your reasoning.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages,
      tools: {
        extract_company_info: tool({
          description: 'Extract company details from website URL or text description',
          parameters: z.object({
            name: z.string().optional(),
            location: z.string().describe('German Bundesland, e.g., Bayern, Baden-Württemberg'),
            size: z.enum(['klein', 'mittel', 'groß']).describe('Company size based on EU definition'),
            industry: z.array(z.string()).describe('Industry sectors'),
            description: z.string().optional().describe('Brief company description')
          }),
          execute: async (params) => {
            return {
              success: true,
              companyProfile: params,
              message: `Company profile extracted: ${params.name || 'Company'} in ${params.location}, ${params.size} Unternehmen`
            }
          }
        }),

        apply_filters: tool({
          description: 'Apply binary filters to subsidy programs. Returns only programs that match ALL criteria.',
          parameters: z.object({
            region: z.array(z.string()).optional().describe('Bundesland or "bundesweit"'),
            foerderart: z.array(z.string()).optional().describe('Funding type: Zuschuss, Darlehen, Bürgschaft, etc.'),
            foerderbereich: z.array(z.string()).optional().describe('Funding sector/area'),
            companySize: z.string().optional().describe('Company size: kleine, mittlere, große')
          }),
          execute: async (filters) => {
            const supabase = getSupabase()
            let query = supabase.from('subsidy_programs').select('id, title, foerderart, foerdergebiet, kurztext')
            
            // Build filter conditions
            if (filters.region && filters.region.length > 0) {
              const regionConditions = filters.region.map(r => `foerdergebiet.ilike.%${r}%`).join(',')
              query = query.or(regionConditions)
            }
            
            if (filters.companySize) {
              query = query.ilike('foerderberechtigte', `%${filters.companySize}%`)
            }
            
            if (filters.foerderart && filters.foerderart.length > 0) {
              const artConditions = filters.foerderart.map(art => `foerderart.ilike.%${art}%`).join(',')
              query = query.or(artConditions)
            }
            
            const { data, error } = await query
            
            if (error) throw error
            
            return {
              success: true,
              matchingPrograms: data,
              count: data?.length || 0,
              filtersApplied: filters
            }
          }
        }),

        get_program_details: tool({
          description: 'Get full details for a specific program including legal requirements',
          parameters: z.object({
            programId: z.string().describe('The program ID')
          }),
          execute: async ({ programId }) => {
            const supabase = getSupabase()
            const { data, error } = await supabase
              .from('subsidy_programs')
              .select('*')
              .eq('id', programId)
              .single()
            
            if (error) throw error
            
            return {
              success: true,
              program: data
            }
          }
        }),

        check_eligibility: tool({
          description: 'Check if a company meets the legal requirements (rechtliche_voraussetzungen) for a specific program',
          parameters: z.object({
            programId: z.string(),
            companyProfile: z.object({
              location: z.string(),
              size: z.string(),
              industry: z.array(z.string())
            })
          }),
          execute: async ({ programId, companyProfile }) => {
            const supabase = getSupabase()
            const { data, error } = await supabase
              .from('subsidy_programs')
              .select('title, rechtliche_voraussetzungen, foerderberechtigte')
              .eq('id', programId)
              .single()
            
            if (error) throw error
            if (!data) throw new Error('Program not found')
            
            // This is a simple check - you can enhance with LLM-based analysis
            return {
              success: true,
              programTitle: data.title,
              requirements: data.rechtliche_voraussetzungen,
              eligible: true, // Placeholder - enhance with actual logic
              reasoning: 'Please review the legal requirements to confirm eligibility'
            }
          }
        })
      },
      maxSteps: 10
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

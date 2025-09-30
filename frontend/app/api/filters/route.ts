import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { FilterCriteria } from '@/types'

export async function POST(request: Request) {
  try {
    const filters: FilterCriteria = await request.json()
    
    let query = supabase.from('subsidy_programs').select('*')
    
    // Apply region filter
    if (filters.region && filters.region.length > 0) {
      const regionConditions = filters.region.map(r => 
        `foerdergebiet.ilike.%${r}%`
      ).join(',')
      query = query.or(regionConditions)
    }
    
    // Apply foerderart filter
    if (filters.foerderart && filters.foerderart.length > 0) {
      const artConditions = filters.foerderart.map(art => 
        `foerderart.ilike.%${art}%`
      ).join(',')
      query = query.or(artConditions)
    }
    
    // Apply foerderbereich filter
    if (filters.foerderbereich && filters.foerderbereich.length > 0) {
      const bereichConditions = filters.foerderbereich.map(b => 
        `foerderbereich.ilike.%${b}%`
      ).join(',')
      query = query.or(bereichConditions)
    }
    
    // Apply company size filter
    if (filters.companySize) {
      query = query.ilike('foerderberechtigte', `%${filters.companySize}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      programs: data,
      count: data?.length || 0,
      filters
    })
  } catch (error) {
    console.error('Error applying filters:', error)
    return NextResponse.json(
      { error: 'Failed to apply filters' },
      { status: 500 }
    )
  }
}

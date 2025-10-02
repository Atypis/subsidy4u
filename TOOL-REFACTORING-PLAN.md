# AI Assistant Tools Refactoring Plan

**Created**: 2025-10-02
**Status**: Planning Phase
**Goal**: Integrate Ontology v4.0 (11-filter system) into AI assistant tools for accurate filtering

---

## Executive Summary

The current AI assistant tools use **outdated filtering logic** based on text matching (`.ilike`, `.contains`) on raw database fields. We need to **refactor to use the extracted heuristics** from Ontology v4.0 for precise, binary filtering.

### Current State Problems

1. **❌ Using raw fields instead of heuristics**
   - `foerdergebiet`, `foerderberechtigte`, `foerderart` are scraped fields (noisy, inconsistent)
   - Should use extracted heuristics: `kmu_erforderlich`, `mitarbeiter_limit_max`, etc.

2. **❌ Weak text matching logic**
   - `.ilike('%klein%')` matches substrings unreliably
   - `.overlaps()` on arrays is better but still not using extracted booleans

3. **❌ No temporal filtering**
   - Missing: `richtlinie_gueltigkeit_bis`, `antragsfrist` checks
   - Programs may be expired but still shown

4. **❌ Incomplete `check_eligibility` tool**
   - Currently just returns placeholder
   - Should do deep LLM-based analysis of `rechtliche_voraussetzungen`

5. **❌ No extraction_confidence filtering**
   - Should filter out programs with low extraction confidence
   - No quality threshold applied

---

## Analysis: Current Tool Implementation

### Tool #1: `extract_company_info` ✅ Good

**Current**:
```typescript
tool({
  description: 'Extract company details from website URL or text description',
  parameters: z.object({
    name: z.string().optional(),
    location: z.string().describe('German Bundesland, e.g., Bayern'),
    size: z.enum(['klein', 'mittel', 'groß']),
    industry: z.array(z.string()),
    description: z.string().optional()
  }),
  execute: async (params) => {
    return { success: true, companyProfile: params }
  }
})
```

**Status**: ✅ **KEEP AS IS** (but enhance parameters)

**Improvements Needed**:
- Add `employees: number` for precise `mitarbeiter_limit_max` checks
- Add `revenue: number` (EUR) for `umsatz_limit_max_eur` checks
- Add `foundingYear: number` for `unternehmensalter_max_jahre` checks
- Add `isDistressed: boolean` for `ausschluss_unternehmen_in_schwierigkeiten`
- Add `sector: string` for `agvo_sektorausschluss` checks

---

### Tool #2: `apply_filters` ❌ NEEDS MAJOR REFACTORING

**Current Problems**:
```typescript
// ❌ Using raw foerdergebiet field (noisy)
query = query.overlaps('foerdergebiet', filters.region)

// ❌ Using text matching on foerderberechtigte
query = query.contains('foerderberechtigte', [filters.companySize])

// ❌ No temporal filtering
// ❌ No KMU checks
// ❌ No funding amount checks
```

**Proposed Refactoring**:

```typescript
tool({
  description: 'Apply Phase 1 heuristic filtering (2,446 → ~50 programs)',
  parameters: z.object({
    companyProfile: z.object({
      location: z.string(), // Berlin, Bayern, etc.
      employees: z.number().optional(),
      revenue: z.number().optional(), // EUR
      foundingYear: z.number().optional(),
      isDistressed: z.boolean().optional(),
      sector: z.enum(['agriculture', 'fisheries', 'aquaculture', 'coal', 'steel', 'other']),
      fundingNeed: z.number().optional(), // EUR
      preferredFundingTypes: z.array(z.string()).optional() // ['Zuschuss', 'Darlehen']
    })
  }),
  execute: async ({ companyProfile }) => {
    const supabase = getSupabase()
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('subsidy_programs')
      .select('id, title, url, foerderart, foerdergebiet, kurztext, extraction_confidence, *')

    // ==========================================
    // TIER S: Universal Hard Filters
    // ==========================================

    // Filter #1: Validity deadline (expired programs)
    query = query.or(`richtlinie_gueltigkeit_bis.is.null,richtlinie_gueltigkeit_bis.gte.${today}`)

    // Filter #2: Application deadline (missed deadlines)
    query = query.or(`antragsfrist.is.null,antragsfrist.eq.laufend,antragsfrist.gte.${today}`)

    // Filter #3: Distressed companies exclusion
    if (companyProfile.isDistressed) {
      query = query.or('ausschluss_unternehmen_in_schwierigkeiten.is.null,ausschluss_unternehmen_in_schwierigkeiten.eq.false')
    }

    // Filter #4: AGVO sector exclusions (46% of programs!)
    if (['agriculture', 'fisheries', 'aquaculture', 'coal', 'steel'].includes(companyProfile.sector)) {
      query = query.or('agvo_sektorausschluss.is.null,agvo_sektorausschluss.eq.false')
    }

    // Filter #5: Funding amount range
    if (companyProfile.fundingNeed) {
      query = query.or(`foerderbetrag_max_eur.is.null,foerderbetrag_max_eur.gte.${companyProfile.fundingNeed}`)
      query = query.or(`foerderbetrag_min_eur.is.null,foerderbetrag_min_eur.lte.${companyProfile.fundingNeed}`)
    }

    // ==========================================
    // TIER A: Specific Hard Filters
    // ==========================================

    // Filter #6: SME requirement + explicit limits
    if (companyProfile.employees) {
      // Check explicit limit first (overrides KMU)
      query = query.or(`mitarbeiter_limit_max.is.null,mitarbeiter_limit_max.gte.${companyProfile.employees}`)

      // Check KMU requirement (if no explicit limit)
      if (companyProfile.employees > 250) {
        query = query.or('kmu_erforderlich.is.null,kmu_erforderlich.eq.false')
      }
    }

    if (companyProfile.revenue) {
      query = query.or(`umsatz_limit_max_eur.is.null,umsatz_limit_max_eur.gte.${companyProfile.revenue}`)

      if (companyProfile.revenue > 50_000_000) {
        query = query.or('kmu_erforderlich.is.null,kmu_erforderlich.eq.false')
      }
    }

    // Filter #7: Company age limit
    if (companyProfile.foundingYear) {
      const companyAge = new Date().getFullYear() - companyProfile.foundingYear
      query = query.or(`unternehmensalter_max_jahre.is.null,unternehmensalter_max_jahre.gte.${companyAge}`)
    }

    // Filter #8: Region matching (keep original logic for now)
    query = query.or(`foerdergebiet.cs.{bundesweit},foerdergebiet.cs.{${companyProfile.location}}`)

    // Filter #9: Extraction confidence threshold
    query = query.gte('extraction_confidence', 0.7)

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      matchingPrograms: data,
      count: data?.length || 0,
      filtersApplied: {
        temporal: true,
        region: companyProfile.location,
        sizeFilters: !!companyProfile.employees || !!companyProfile.revenue,
        sectorExclusions: companyProfile.sector !== 'other'
      },
      eliminatedByFilter: {
        expired: 0, // Calculate from count diff
        agvo: 0,
        kmu: 0,
        funding: 0
      }
    }
  }
})
```

---

### Tool #3: `get_program_details` ✅ Good

**Status**: ✅ **KEEP AS IS**

Already fetches full program details including:
- All scraped fields
- All extracted heuristics
- Legal requirements
- Richtlinie text

**Minor Enhancement**: Add extraction metadata to response:
```typescript
return {
  success: true,
  program: data,
  extractionMetadata: {
    confidence: data.extraction_confidence,
    date: data.extraction_date,
    notes: data.extraction_notes
  }
}
```

---

### Tool #4: `check_eligibility` ❌ NEEDS COMPLETE REWRITE

**Current**: Just returns placeholder

**Proposed**: LLM-based deep eligibility analysis

```typescript
tool({
  description: 'Deep eligibility check using LLM to analyze legal requirements (rechtliche_voraussetzungen)',
  parameters: z.object({
    programId: z.string(),
    companyProfile: z.object({
      name: z.string().optional(),
      location: z.string(),
      employees: z.number().optional(),
      revenue: z.number().optional(),
      foundingYear: z.number().optional(),
      industry: z.array(z.string()),
      projectDescription: z.string().optional()
    })
  }),
  execute: async ({ programId, companyProfile }) => {
    const supabase = getSupabase()

    // Fetch program details
    const { data: program, error } = await supabase
      .from('subsidy_programs')
      .select('title, rechtliche_voraussetzungen, volltext, richtlinie, extraction_notes')
      .eq('id', programId)
      .single()

    if (error || !program) throw new Error('Program not found')

    // Use Claude/GPT to analyze eligibility
    const analysisPrompt = `Analyze eligibility for subsidy program:

**Program**: ${program.title}

**Company Profile**:
${JSON.stringify(companyProfile, null, 2)}

**Legal Requirements**:
${program.rechtliche_voraussetzungen || 'N/A'}

**Full Text**:
${program.volltext || 'N/A'}

**Extraction Notes** (may contain uncertainties):
${program.extraction_notes || 'N/A'}

Provide:
1. **eligible**: true/false/maybe
2. **confidence**: 0.0-1.0
3. **reasoning**: Why eligible or not (cite specific requirements)
4. **blockers**: List of hard blockers (if any)
5. **warnings**: Potential issues to review

Return as JSON.`

    // Call LLM (Claude Sonnet 4)
    const llmResponse = await callLLM(analysisPrompt)

    return {
      success: true,
      programTitle: program.title,
      eligibilityAnalysis: llmResponse
    }
  }
})
```

---

### Tool #5: NEW - `rank_programs` 🆕

**Purpose**: Score and rank filtered programs by relevance

```typescript
tool({
  description: 'Rank programs by relevance to company profile (after Phase 1 filtering)',
  parameters: z.object({
    programIds: z.array(z.string()),
    companyProfile: z.object({
      industry: z.array(z.string()),
      projectDescription: z.string().optional(),
      fundingNeed: z.number().optional()
    })
  }),
  execute: async ({ programIds, companyProfile }) => {
    const supabase = getSupabase()

    // Fetch programs
    const { data: programs } = await supabase
      .from('subsidy_programs')
      .select('id, title, kurztext, foerderbereich, foerderbetrag_max_eur, de_minimis_beihilfe')
      .in('id', programIds)

    // Score each program (0-100)
    const scored = programs.map(program => {
      let score = 50 // Base score

      // Industry match (+30)
      const industryMatch = companyProfile.industry.some(ind =>
        program.foerderbereich?.toLowerCase().includes(ind.toLowerCase())
      )
      if (industryMatch) score += 30

      // Funding amount match (+20)
      if (companyProfile.fundingNeed && program.foerderbetrag_max_eur) {
        if (program.foerderbetrag_max_eur >= companyProfile.fundingNeed) {
          score += 20
        }
      }

      // De-minimis bonus (easier to apply) (+10)
      if (program.de_minimis_beihilfe === true) score += 10

      return {
        programId: program.id,
        title: program.title,
        score,
        reasoning: `Industry: ${industryMatch ? 'match' : 'no match'}, Funding: ${program.foerderbetrag_max_eur ? 'compatible' : 'unknown'}`
      }
    })

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    return {
      success: true,
      rankedPrograms: scored.slice(0, 20), // Top 20
      total: scored.length
    }
  }
})
```

---

## Implementation Plan

### Phase 1: Update Database Schema ✅ (Already Done)

- ✅ Migration v4.0 created (`20251002000000_add_heuristic_fields_v4.sql`)
- ⏭️ **Action**: Apply migration to Supabase
- ⏭️ **Action**: Run extraction on all 2,446 programs

### Phase 2: Refactor `apply_filters` Tool (3-4 hours)

**Tasks**:
1. ✅ Update `extract_company_info` parameters (add employees, revenue, etc.)
2. ✅ Rewrite `apply_filters` logic to use heuristics
3. ✅ Add temporal filtering (richtlinie_gueltigkeit_bis, antragsfrist)
4. ✅ Add AGVO sector exclusion logic
5. ✅ Add KMU + explicit limit logic
6. ✅ Add extraction_confidence filtering
7. ✅ Return detailed filter breakdown

**Files to Edit**:
- `app/api/chat/route.ts` (main file)
- Create `lib/filters.ts` (filter logic helpers)

**Testing**:
- Test with sample company profiles
- Verify filter counts (2,446 → ~50-100)
- Check edge cases (null handling, overrides)

### Phase 3: Implement `check_eligibility` Tool (2-3 hours)

**Tasks**:
1. ✅ Create LLM eligibility analysis function
2. ✅ Add structured output parsing
3. ✅ Handle extraction_notes (uncertainties)
4. ✅ Return confidence scores + blockers

**Files to Edit**:
- `app/api/chat/route.ts`
- Create `lib/eligibility-checker.ts`

**Testing**:
- Test with real programs
- Verify reasoning quality
- Check for false positives/negatives

### Phase 4: Add `rank_programs` Tool (1-2 hours)

**Tasks**:
1. ✅ Implement scoring algorithm
2. ✅ Add industry matching logic
3. ✅ Add funding amount compatibility
4. ✅ Sort by relevance

**Files to Edit**:
- `app/api/chat/route.ts`
- Create `lib/ranking.ts`

### Phase 5: Update System Prompt (1 hour)

**Tasks**:
1. ✅ Update filtering strategy description
2. ✅ Add Ontology v4.0 reference
3. ✅ Add filter order guidance
4. ✅ Add extraction confidence handling

**File to Edit**:
- `app/api/chat/route.ts` (systemPrompt)

### Phase 6: Testing & Validation (2-3 hours)

**Tasks**:
1. ✅ End-to-end test with real company
2. ✅ Validate filter counts at each stage
3. ✅ Check tool transparency (show filter reasoning)
4. ✅ Test edge cases (null values, missing data)
5. ✅ Performance testing (query speed)

**Testing Scenarios**:
- Berlin startup, 50 employees, €2M revenue, tech industry
- Bayern SME, 200 employees, €30M revenue, manufacturing
- Bundesweit company, 500 employees, €100M revenue, finance

### Phase 7: Frontend Integration (2-3 hours)

**Tasks**:
1. ✅ Update filter breadcrumbs UI
2. ✅ Show filter reasoning in chat
3. ✅ Display extraction confidence badges
4. ✅ Add program card status indicators
5. ✅ Animate filter transitions

**Files to Edit**:
- `app/page.tsx` (chat interface)
- `components/ProgramCard.tsx`
- `components/FilterBreadcrumbs.tsx`

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Database Migration | ✅ Done | None |
| 2. Refactor apply_filters | 3-4 hours | Phase 1 |
| 3. Implement check_eligibility | 2-3 hours | Phase 2 |
| 4. Add rank_programs | 1-2 hours | Phase 2 |
| 5. Update System Prompt | 1 hour | Phase 2-4 |
| 6. Testing & Validation | 2-3 hours | Phase 2-5 |
| 7. Frontend Integration | 2-3 hours | Phase 6 |

**Total**: ~12-16 hours (1.5-2 working days)

---

## Success Metrics

**Before Refactoring**:
- ❌ Filtering: ~500-1000 programs (too many false positives)
- ❌ Filter time: 2-3 queries, ~1-2 seconds
- ❌ Accuracy: ~60-70% (text matching unreliable)
- ❌ False negatives: ~10-15% (eligible programs filtered out)

**After Refactoring**:
- ✅ Filtering: ~50-100 programs (Phase 1), ~10-20 (Phase 2)
- ✅ Filter time: 1 query with AND-linked filters, <500ms
- ✅ Accuracy: >90% (heuristic-based binary filters)
- ✅ False negatives: <5% (permissive null handling)
- ✅ Transparency: Show why each program was filtered

---

## Risk Mitigation

### Risk: Heuristics not yet extracted
**Status**: ⚠️ High Priority
**Mitigation**:
- Run extraction test (in progress) to validate ontology
- Run full extraction on 2,446 programs (~$73, 2-3 hours)
- Fall back to original logic if extraction_date IS NULL

### Risk: Extraction confidence too low
**Mitigation**:
- Set threshold at 0.7 (drop programs with confidence <0.7)
- Show confidence badges in UI
- Allow users to override filters

### Risk: Performance issues with complex queries
**Mitigation**:
- Use indexes (already created in migration)
- Optimize query with EXPLAIN ANALYZE
- Cache filter results in memory (Next.js)

### Risk: LLM eligibility analysis too slow
**Mitigation**:
- Only use for Phase 2 (after heuristic filtering to ~50 programs)
- Batch eligibility checks (analyze 5 programs at once)
- Cache results per program + company profile hash

---

## File Structure (After Refactoring)

```
frontend/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts          # Main chat endpoint with 5 tools
├── lib/
│   ├── supabase.ts               # ✅ Keep
│   ├── filters.ts                # 🆕 Heuristic filter logic
│   ├── eligibility-checker.ts    # 🆕 LLM-based eligibility
│   ├── ranking.ts                # 🆕 Scoring/ranking logic
│   └── utils.ts                  # ✅ Keep
├── types/
│   ├── database.ts               # ✅ Already updated to v4.0
│   └── filters.ts                # 🆕 Filter types
└── heuristic-extraction/
    └── ONTOLOGY.md               # ✅ Single source of truth
```

---

## Next Steps (Priority Order)

1. ⏳ **Wait for extraction test to complete** (currently running)
2. 🔄 **Apply database migration v4.0** (Supabase dashboard)
3. 🔄 **Run full extraction** on 2,446 programs (~$73, 2-3 hours)
4. ✅ **Phase 2**: Refactor `apply_filters` tool
5. ✅ **Phase 3**: Implement `check_eligibility` tool
6. ✅ **Phase 4**: Add `rank_programs` tool
7. ✅ **Phase 5**: Update system prompt
8. ✅ **Phase 6**: End-to-end testing
9. ✅ **Phase 7**: Frontend integration

---

## Questions for User

1. **Priority**: Should we wait for extraction to complete before refactoring, or start now with test data?
2. **LLM for eligibility**: Use Claude (current) or GPT-4 for eligibility analysis?
3. **Caching**: Should we cache filter results? (Improves speed, but data may be stale)
4. **Frontend**: Should we show extraction confidence badges on program cards?
5. **Testing**: Do you have specific test companies/scenarios in mind?

---

**Last Updated**: 2025-10-02
**Status**: ⏳ Awaiting extraction test results & user feedback
**Next Action**: Review plan, decide on priorities, begin Phase 2

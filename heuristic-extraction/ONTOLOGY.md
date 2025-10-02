# Subsidy Program Heuristics Ontology

**Version**: 4.0
**Last Updated**: 2025-10-02
**Status**: Active - Single Source of Truth

---

## Version History

- **v4.0** (2025-10-02): Streamlined to 11 core filters, removed noise
- **v3.0** (2025-10-01): Added temporal filters, refined semantics
- **v2.0** (2025-09-30): Evidence-based ontology from 2,446 programs
- **v1.0** (2025-09-29): Initial ontology draft

---

## Overview

This ontology defines **11 heuristic filters** extracted from German subsidy program texts to enable rapid, automated filtering from 2,400+ programs down to ~10-50 relevant matches.

**Design Principles**:
1. **Negative Filtering**: Filters remove only programs that definitively don't match
2. **null-Semantics**: `null` = unknown = **KEEP** (permissive)
3. **Explicit over Implicit**: Hard-coded values override generic rules
4. **High Signal-to-Noise**: Only include filters with >90% extraction reliability

---

## The 11 Core Heuristics

### TIER S: Universal Hard Filters (7)

#### 1. `richtlinie_gueltigkeit_bis`
- **Type**: `DATE | null` (ISO format: YYYY-MM-DD)
- **Source**: `richtlinie` text field
- **Pattern**: "gültig bis DD.MM.YYYY", "befristet bis DD.MM.YYYY"
- **Occurrence**: 6% have explicit deadline (125/2,446)
- **Filter Logic**: If `date < today` → ❌ REMOVE (expired)
- **Null Semantics**: `null` = no expiry = ✅ KEEP
- **Extraction Confidence**: High (80%)

#### 2. `ausschluss_unternehmen_in_schwierigkeiten`
- **Type**: `BOOLEAN | null`
- **Source**: `rechtliche_voraussetzungen`, `richtlinie`
- **Pattern**: "Unternehmen in Schwierigkeiten", "Ausschluss.*Schwierigkeiten"
- **Occurrence**: 12% (247/2,446)
- **Filter Logic**: If `true` AND user is distressed → ❌ REMOVE
- **Null Semantics**: `null` = no restriction = ✅ KEEP
- **EU Definition**: Article 2 No. 18 AGVO (financially viable companies)

#### 3. `agvo_sektorausschluss`
- **Type**: `BOOLEAN | null`
- **Source**: `richtlinie`, `rechtliche_voraussetzungen`
- **Pattern**: "AGVO", "Verordnung.*651/2014", "Artikel 1.*Abs.*2"
- **Excluded Sectors**: Agriculture, Fisheries, Aquaculture, Coal, Steel
- **Occurrence**: 46% (947/2,446) ⚠️ Nearly half!
- **Filter Logic**: If `true` AND user in excluded sector → ❌ REMOVE
- **Null Semantics**: `null` = no AGVO restrictions = ✅ KEEP

#### 4. `foerderbetrag_max_eur`
- **Type**: `NUMBER | null` (EUR)
- **Source**: `volltext`, `rechtliche_voraussetzungen`
- **Pattern**: "bis zu EUR X", "maximal EUR X", "höchstens EUR X"
- **Occurrence**: 53% mention amounts (1,087/2,446)
- **Filter Logic**: If `amount < user.funding_need` → ❌ REMOVE
- **Null Semantics**: `null` = no upper limit = ✅ KEEP
- **Note**: Extract absolute amounts only, NOT formulas

#### 5. `foerderbetrag_min_eur`
- **Type**: `NUMBER | null` (EUR)
- **Source**: `volltext`, `rechtliche_voraussetzungen`
- **Pattern**: "mindestens EUR X", "ab EUR X"
- **Occurrence**: ~25% (estimated from max_eur sample)
- **Filter Logic**: If `amount > user.funding_need` → ❌ REMOVE
- **Null Semantics**: `null` = no lower limit = ✅ KEEP

#### 6. `de_minimis_beihilfe`
- **Type**: `BOOLEAN | null`
- **Source**: `richtlinie`, `rechtliche_voraussetzungen`
- **Pattern**: "De-minimis", "De minimis", "Verordnung.*1407/2013"
- **EU Limit**: €200,000 over 3 fiscal years
- **Occurrence**: 31% (643/2,446)
- **Filter Logic**: INFORMATIONAL only - warn if user.total_aid > €150k
- **Null Semantics**: `null` = not de-minimis = ✅ KEEP

#### 7. `antragsfrist`
- **Type**: `DATE | 'laufend' | null` (ISO format: YYYY-MM-DD)
- **Source**: `volltext`, `rechtliche_voraussetzungen`
- **Pattern**: "Antragsfrist DD.MM.YYYY", "Antragsschluss DD.MM.YYYY", "laufend"
- **Occurrence**: 19% (375/2,446) - 239 dates, 136 "laufend"
- **Filter Logic**: If `date < today` → ❌ REMOVE (deadline passed)
- **Null Semantics**: `null` = ongoing/unknown = ✅ KEEP
- **Extraction Confidence**: High (70%)

---

### TIER A: Specific Hard Filters (4)

#### 8. `kmu_erforderlich`
- **Type**: `BOOLEAN | null`
- **Source**: `rechtliche_voraussetzungen`
- **Pattern**: "KMU", "kleine und mittlere Unternehmen"
- **Standard Definition**: ≤250 employees, ≤€50M revenue (EU)
- **Occurrence**: 21% (430/2,446)
- **Filter Logic**: If `true` AND user exceeds SME thresholds → ❌ REMOVE
- **Null Semantics**: `null` = no SME requirement = ✅ KEEP
- **Override**: `mitarbeiter_limit_max` or `umsatz_limit_max_eur` take precedence!

#### 9. `mitarbeiter_limit_max`
- **Type**: `NUMBER | null` (employees)
- **Source**: `rechtliche_voraussetzungen`
- **Pattern**: "nicht mehr als X Beschäftigte", "maximal X Mitarbeiter"
- **Occurrence**: 1% explicit (23/2,446), 21% implicit via KMU
- **Filter Logic**: If `limit < user.employees` → ❌ REMOVE
- **Null Semantics**: `null` = no explicit limit = ✅ KEEP
- **Note**: Extract ONLY explicit numbers, do NOT infer from `kmu_erforderlich`

#### 10. `umsatz_limit_max_eur`
- **Type**: `NUMBER | null` (EUR annual revenue)
- **Source**: `rechtliche_voraussetzungen`
- **Pattern**: "Jahresumsatz.*höchstens EUR X", "Umsatz.*maximal EUR X"
- **Occurrence**: 3% explicit (61/2,446), 21% implicit via KMU
- **Filter Logic**: If `limit < user.revenue` → ❌ REMOVE
- **Null Semantics**: `null` = no explicit limit = ✅ KEEP
- **Note**: Extract ONLY explicit numbers, do NOT infer from `kmu_erforderlich`

#### 11. `unternehmensalter_max_jahre`
- **Type**: `NUMBER | null` (years since founding)
- **Source**: `rechtliche_voraussetzungen`
- **Pattern**: "nicht länger als X Jahre", "maximal X Jahre seit Gründung"
- **Occurrence**: 2% (36/2,446) - rare but critical for startup programs
- **Filter Logic**: If `limit < user.company_age` → ❌ REMOVE
- **Null Semantics**: `null` = no age limit = ✅ KEEP

---

## Metadata Fields

### `extraction_confidence`
- **Type**: `NUMBER` (0.0 - 1.0)
- **Purpose**: Quality indicator for extraction
- **Calculation**:
  - 1.0 = All fields clear and unambiguous
  - 0.8 = Most fields clear, some uncertain
  - 0.6 = Several fields uncertain
  - 0.4 = Many fields unclear or missing
- **Usage**: Filter out programs with confidence < 0.5 in production

### `extraction_notes`
- **Type**: `STRING`
- **Purpose**: Document uncertainties, conflicts, missing info
- **Examples**:
  - "Förderbetragsformel zu komplex, als null gesetzt"
  - "Widerspruch zwischen Volltext (€500k) und Richtlinie (€1M)"
  - "AGVO-Bezug unklar, als null gesetzt"

---

## Removed Fields (From v3.0)

The following fields were **removed in v4.0** due to high noise/low signal ratio:

- ❌ `sicherheiten_erforderlich` - Too vague ("banküblich"), better in detailed review
- ❌ `foerdersatz_prozent` - Often complex formulas/ranges, not binary filterable
- ❌ `gruendungsfoerdernd` - Too subjective, use `unternehmensalter_max_jahre` instead
- ❌ `antrag_vor_massnahmenbeginn` - Informational, not a hard filter
- ❌ `investition_in_deutschland_erforderlich` - Implicit in regional programs
- ❌ `programm_laufzeit_bis` - Confusable with `richtlinie_gueltigkeit_bis`

**Rationale**: These fields are better handled in Phase 2 (LLM deep review) rather than Phase 1 (heuristic filtering).

---

## Extraction Rules

### 1. null-Semantics
- **If information not found** → `null` (NOT `false`!)
- **Reasoning**: Absence of evidence ≠ evidence of absence
- **Example**: No mention of "KMU" → `kmu_erforderlich: null` (not `false`)

### 2. Date Format
- **Always**: ISO 8601 (YYYY-MM-DD)
- **Conversion**: "31.12.2025" → "2025-12-31"
- **Partial Dates**: "2025" → "2025-12-31" (use end of year)

### 3. Explicit Values Only
- **Extract**: What is explicitly written in text
- **Do NOT**: Infer or calculate
- **Example**: `kmu_erforderlich: true` does NOT automatically mean `mitarbeiter_limit_max: 250`

### 4. Source Priority
- **Primary**: `richtlinie` (most authoritative)
- **Secondary**: `rechtliche_voraussetzungen` (official requirements)
- **Tertiary**: `volltext` (overview text)
- **Last**: `kurztext` (summary only)

### 5. Conflict Resolution
- If sources conflict → use most restrictive value + note in `extraction_notes`
- Example: Volltext says "€500k", Richtlinie says "€1M" → use "€500k" + note conflict

### 6. Confidence Calculation
- Start at 1.0
- Deduct 0.1 for each uncertain field
- Deduct 0.2 for each conflict/ambiguity
- Deduct 0.3 for missing critical fields

---

## TypeScript Schema

```typescript
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
```

---

## Filter Execution Logic

### Phase 1: Heuristic Filtering (Fast, Cheap)
```
Start: 2,446 programs
↓
Apply 11 AND-linked filters based on user profile
↓
Result: ~50-100 programs (depending on user profile)
```

### Phase 2: LLM Deep Review (Slow, Expensive) [Optional]
```
Start: 50-100 programs from Phase 1
↓
LLM reads rechtliche_voraussetzungen + volltext for each
LLM checks detailed eligibility vs company profile
↓
Result: ~10-20 programs (high confidence matches)
```

### Filter Order (Optimization)
1. `richtlinie_gueltigkeit_bis` (no user input, eliminates expired)
2. `antragsfrist` (no user input, eliminates missed deadlines)
3. `foerdergebiet` (from database field, 70-80% elimination) ⚠️ Not in this ontology
4. `agvo_sektorausschluss` (1 user input, affects 46%)
5. `kmu_erforderlich` (2 user inputs: employees, revenue)
6. `mitarbeiter_limit_max` (1 user input)
7. `umsatz_limit_max_eur` (1 user input)
8. `unternehmensalter_max_jahre` (1 user input)
9. `ausschluss_unternehmen_in_schwierigkeiten` (1 user input, ask only if relevant)
10. `foerderbetrag_max_eur` / `foerderbetrag_min_eur` (1 user input, optional)
11. `de_minimis_beihilfe` (informational warning only)

---

## Success Metrics

**Target Performance**:
- Extraction accuracy: >80% per field (manual validation)
- Extraction speed: <3 seconds per program (GPT-5-mini)
- False negatives: <5% (eligible programs incorrectly filtered out)
- Coverage: >70% of programs have ≥3 extractable heuristics

**Quality Thresholds**:
- Confidence ≥0.7 → Use in production
- Confidence <0.7 → Flag for manual review
- Confidence <0.4 → Skip program entirely

---

## Usage Notes

### For LLM Extraction
- Use this ontology as system prompt foundation
- Include all pattern examples and null-semantics rules
- Validate output against TypeScript schema
- Always provide extraction_confidence and extraction_notes

### For Backend Filtering
- AND-link all filters (one failure = program removed)
- Treat `null` as permissive (keep program)
- Log which filters eliminated which programs (transparency)

### For Frontend Display
- Show extraction_confidence as quality indicator
- Surface extraction_notes for ambiguous programs
- Allow users to override filters (progressive disclosure)

---

## Next Steps

1. ✅ Ontology v4.0 defined
2. 🔄 Update extraction script to use 11 fields only
3. 🔄 Test extraction on diverse sample (N=10)
4. 🔄 Run full extraction on all 2,446 programs
5. 🔄 Validate extraction quality (manual spot-checks)
6. 🔄 Integrate into backend filtering API

---

**Maintained by**: @a1984
**Questions/Feedback**: Update this document and increment version number

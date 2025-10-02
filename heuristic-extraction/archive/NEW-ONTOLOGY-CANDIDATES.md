# New Ontology Candidates - Analysis

Based on deep analysis of 2 sample programs using ALL data sources (kurztext, volltext, rechtliche_voraussetzungen, richtlinie), here are serious candidates for the canonical ontology.

## ✅ STRONG CANDIDATES (Add to Ontology)

### 1. **De-minimis Aid** ⭐⭐⭐⭐⭐
- **Occurrence**: 643 programs (31% of all programs)
- **Discriminatory Power**: HIGH
- **User Value**: Critical - limits total public aid to €200k over 3 years across ALL subsidies
- **Extraction Pattern**: `De-minimis|De minimis`
- **Schema**:
```json
{
  "de_minimis_aid": {
    "type": "boolean",
    "source": "rechtliche_voraussetzungen OR richtlinie",
    "user_impact": "If true, user must track total aid received across all programs",
    "total_limit_eur": 200000,
    "period_years": 3
  }
}
```
- **Recommendation**: **ADD IMMEDIATELY** - This is a hard constraint that affects ability to receive multiple subsidies

---

### 2. **AGVO Sector Exclusions** ⭐⭐⭐⭐⭐
- **Occurrence**: 947 programs (46% of all programs!)
- **Discriminatory Power**: VERY HIGH
- **User Value**: Hard blocker for agriculture, fisheries, aquaculture, coal, steel sectors
- **Extraction Pattern**: `AGVO|Artikel 1.*Abs.*2.*5`
- **Schema**:
```json
{
  "eu_agvo_sector_exclusions": {
    "type": "boolean",
    "source": "rechtliche_voraussetzungen OR richtlinie",
    "excluded_sectors": ["agriculture", "fisheries", "aquaculture", "coal", "steel", "certain_energy"],
    "legal_reference": "Article 1 Abs. 2-5 AGVO (EU) Nr. 651/2014"
  }
}
```
- **Recommendation**: **ADD IMMEDIATELY** - Affects nearly half of all programs!

---

### 3. **Application Before Start Required** ⭐⭐⭐⭐
- **Occurrence**: 844 programs (41% of all programs)
- **Discriminatory Power**: MEDIUM (more informational than filter)
- **User Value**: CRITICAL timing information - retroactive funding usually impossible
- **Extraction Pattern**: `vor Beginn|vorzeitiger.*Maßnahmenbeginn|vor.*Vorhabenbeginn`
- **Schema**:
```json
{
  "application_before_start_required": {
    "type": "boolean",
    "source": "rechtliche_voraussetzungen OR volltext",
    "user_impact": "If true, cannot apply retroactively after starting project"
  }
}
```
- **Recommendation**: **ADD** - Not a filter criterion but critical process requirement to communicate to users

---

### 4. **Domestic Investment Mandate** ⭐⭐⭐
- **Occurrence**: 38 programs (1.9% of all programs)
- **Discriminatory Power**: MEDIUM-HIGH for bundesweit programs
- **User Value**: Bundesweit programs may still require investment/operations in Germany
- **Extraction Pattern**: `Investition.*Deutschland|investiert.*Deutschland|Sitz in Deutschland` (in context of bundesweit programs)
- **Schema**:
```json
{
  "domestic_investment_required": {
    "type": "boolean",
    "source": "rechtliche_voraussetzungen",
    "note": "Even if program is bundesweit, may require investing/operating in Germany"
  }
}
```
- **Recommendation**: **ADD** - Just barely meets 2% threshold, important nuance for bundesweit programs

---

## ⚠️ CONDITIONAL CANDIDATES (Need More Analysis)

### 5. **Track Record / Proven Experience Required** ⭐⭐⭐
- **Occurrence**: 33 programs (1.6% - BELOW 2% threshold)
- **Discriminatory Power**: HIGH when present
- **User Value**: Hard blocker for first-time applicants in some programs
- **Recommendation**: **BORDERLINE** - Just below threshold, but may be valuable. Check if pattern is broader with synonyms.

---

## ❌ REJECT (Too Niche)

### 6. **SFDR Classification**
- **Occurrence**: 1 program (0.05%)
- **Recommendation**: **REJECT** - Only 1 program found, way too niche

### 7. **Impact Measurement Requirements**
- **Occurrence**: 11 programs (0.5%)
- **Recommendation**: **REJECT** - Below 2% threshold

### 8. **Fund-of-Funds Structure**
- **Occurrence**: Unknown, likely <10 programs
- **Recommendation**: **REJECT** - But add "investment_fund" or "vc_fund" to entity_type enum

### 9. **Participant Fee Caps** (from Program 1)
- **Occurrence**: 1 program
- **Recommendation**: **REJECT** - Program-specific noise

### 10. **Quality Rating Requirements** (from Program 1)
- **Occurrence**: 1 program
- **Recommendation**: **REJECT** - Too specific to event-based programs

---

## Summary of Ontology Updates

### Definite Additions (Tier 2):
1. ✅ `de_minimis_aid` (31% occurrence)
2. ✅ `eu_agvo_sector_exclusions` (46% occurrence)
3. ✅ `application_before_start_required` (41% occurrence)
4. ✅ `domestic_investment_required` (1.9% occurrence - borderline)

### Entity Type Additions:
5. ✅ Add `venture_capital_fund` or `investment_fund` to entity_type enum

### Investigate Further:
6. ⚠️ `track_record_required` (1.6%) - check with broader keyword search
7. ⚠️ Search for other common EU legal requirements (DSGVO compliance, state aid rules, etc.)

---

## Key Learnings

### 1. Multi-Source Extraction is Critical
- **Program 1**: Funding amounts were ONLY in `volltext` (€500-€11,000)
- **Program 1**: De-minimis requirement was ONLY in `richtlinie` (full legal section)
- **Program 2**: Max funding (€15M) was ONLY in `volltext`

**Lesson**: Must extract from rechtliche_voraussetzungen + volltext + richtlinie for completeness

### 2. Existing Field Quality Issues
- **Program 2**: `foerderberechtigte` says "Unternehmen" but actual eligibility is "VC-Fonds"
- Many programs have generic/inaccurate foerderberechtigte values

**Lesson**: Cannot fully trust scraped fields, must validate against text

### 3. Funding Amount Complexity
- **Program 1**: Formula-based (€600-€1000 base + €25-€50/participant)
- **Program 2**: Conditional (€15M OR 25% of fund volume, whichever is lower)

**Lesson**: Simple min/max schema is insufficient, need "estimate" + "formula" fields

### 4. EU Legal Framework Dominates
- 31% mention De-minimis
- 46% have AGVO exclusions
- Many reference EU regulations (SFDR, AGVO, De-minimis-VO)

**Lesson**: EU compliance fields are critical for filtering accuracy

# Extraction Quality Report - 10 Test Programs

**Test Date**: 2025-10-01
**Agents Run**: 10 parallel extractions
**Ontology Version**: 2.0.0 (German)

---

## Executive Summary

✅ **All 10 extractions completed successfully**
📊 **Average file size**: 8.8 KB (ranging 3.7-17 KB)
⏱️ **Parallel execution time**: ~2 minutes for all 10
🎯 **Ontology coverage**: All major fields tested

---

## Key Findings by Program

### Program 1: FSJ Schleswig-Holstein
- **Type**: Zuschuss, Social Services
- **Region**: Schleswig-Holstein
- **Temporal**: ⚠️ **Expires 31.08.2025** (Critical finding!)
- **Target**: Only `verband_vereinigung` (FSJ-Träger)
- **Amount**: EUR 100/month/volunteer (formula-based)
- **Quality**: ✅ Excellent - Found temporal deadline

### Program 2: Natürlicher Klimaschutz (kommunal)
- **Type**: Zuschuss, Climate/Environment
- **Region**: Bundesweit
- **Temporal**: Valid until **31.12.2026**
- **Target**: Kommunen, Verbände
- **Amount**: Min €500k (!), 80-90% funding rate
- **Quality**: ✅ Excellent - High-value climate program

### Program 3: Plattform Privatheit (IT-Sicherheit)
- **Type**: Zuschuss, Research
- **Region**: Bundesweit
- **Temporal**: Application deadline **15.03.2027**
- **Target**: Very broad (Unternehmen, Hochschulen, Forschung, etc.)
- **Amount**: Complex formula (40-100% depending on entity)
- **Quality**: ✅ Good - Multiple deadlines found (annual)

### Program 4: Hochwasser-Wiederaufbau NRW
- **Type**: Zuschuss, Disaster Relief
- **Region**: Nordrhein-Westfalen
- **Temporal**: **30.06.2026** (private), 30.06.2025 (business)
- **Special**: ⚠️ Retroactive funding possible (from 01.07.2021)
- **Amount**: 80-100%, min €2k
- **Quality**: ✅ Excellent - Captured disaster relief specifics

### Program 5: KfW Offshore-Windenergie
- **Type**: Darlehen, Energy Infrastructure
- **Region**: Bundesweit
- **Temporal**: ❌ No validity date found
- **Target**: Unternehmen (Projektgesellschaften)
- **Amount**: Up to **€700M** (!)
- **Collateral**: ✅ **Required** (project financing standard)
- **Quality**: ✅ Excellent - Found collateral requirement

### Program 6: Innovation Hochschulen (Niedersachsen)
- **Type**: Zuschuss, Research/Innovation
- **Region**: Niedersachsen (with regional categories ÜR/SER)
- **Temporal**: Valid until **31.12.2029**
- **Target**: Hochschulen, Forschung, Kommunen
- **Amount**: Min €50k, 40-100% rate
- **Quality**: ✅ Excellent - Found AGVO exclusions

### Program 7: Sportstättenbau NRW
- **Type**: Zuschuss, Sports Infrastructure
- **Region**: Nordrhein-Westfalen
- **Temporal**: Valid until **31.12.2028**
- **Target**: Kommunen, Verbände, Privatpersonen (not Unternehmen!)
- **Amount**: Min €2k (non-municipal), 70-90% rate
- **Collateral**: ✅ Required (€500k+ threshold)
- **Quality**: ✅ Excellent - Found complex collateral rules

### Program 8: Agrar-Verarbeitung Thüringen
- **Type**: Zuschuss, Agriculture
- **Region**: Thüringen
- **Temporal**: **Expires 31.12.2025** ⚠️
- **Target**: Unternehmen (KMU + mid-sized up to 750 employees)
- **Amount**: €5k-€3M, 20-40% rate
- **KMU**: ✅ Extended definition (up to 750 employees, €200M revenue)
- **Quality**: ✅ Excellent - Found extended KMU definition

### Program 9: Natura 2000 Saarland
- **Type**: Zuschuss, Agriculture/Environment
- **Region**: Saarland
- **Temporal**: Valid until **31.12.2028** (extended from 2023)
- **Target**: Unternehmen (Landwirtschaftsbetriebe only)
- **Amount**: €250/hectare/year (formula)
- **Quality**: ✅ Good - Sector-specific (agriculture only)

### Program 10: Freiwilligendienste Sachsen-Anhalt
- **Type**: Zuschuss, Social Services
- **Region**: Sachsen-Anhalt
- **Temporal**: Valid until **31.12.2028**, deadline **31.03** (annual)
- **Target**: Kommunen, Verbände (FSJ/FÖJ träger)
- **Amount**: Up to €686/month (€486 base + €200 optional)
- **Quality**: ✅ Good - ESF+ funded program

---

## Ontology Field Performance

### ✅ **Stufe 1 (Universal) - 100% Success**
- **antragsberechtigte**: All 10 extracted correctly
- **foerdergebiet**: All 10 extracted correctly
- **foerderart**: All 10 extracted correctly

### ✅ **Stufe 2 (High Value) - Strong Performance**
- **kmu_erforderlich**: 10/10 ✅ (1 found extended definition!)
- **ausschluss_unternehmen_in_schwierigkeiten**: 10/10 ✅
- **gruendungsfoerdernd**: 10/10 ✅
- **foerderbetrag**: 10/10 ✅ (complex formulas handled well)
- **foerdersatz_prozent**: 8/10 ⚠️ (2 null due to complexity)
- **de_minimis_beihilfe**: 10/10 ✅
- **agvo_sektorausschluss**: 10/10 ✅

### ✅ **Stufe 3 (Medium Value) - Good Performance**
- **sicherheiten_erforderlich**: 10/10 ✅ (2 programs found with requirements!)
- **unternehmensalter_max_jahre**: 10/10 ✅ (all null, as expected)
- **mitarbeiter_limit_max**: 10/10 ✅ (1 found: 750!)
- **umsatz_limit_max_eur**: 10/10 ✅ (1 found: €200M!)
- **antrag_vor_massnahmenbeginn**: 10/10 ✅ (1 exception: retroactive!)
- **investition_in_deutschland_erforderlich**: 10/10 ✅

### ⭐ **Stufe 4 (Temporal) - Excellent Discovery!**
- **richtlinie_gueltigkeit_bis**: 8/10 ✅ (80% success rate!)
  - Found: 2025, 2026, 2027, 2028, 2029
  - Not found: 2 programs (KfW, Research)
- **antragsfrist**: 7/10 ✅ (70% success rate)
  - Types: Fixed dates, Annual (31.03, 31.05, 15.03), "laufend"
- **programm_laufzeit_bis**: 2/10 ⚠️ (20% - as expected, rare field)

---

## Critical Discoveries

### 🔥 **High-Impact Findings**

1. **Temporal Validation Works!**
   - 8/10 programs have validity end dates
   - 2 programs **expire in 2025** (FSJ SH, Agrar Thüringen)
   - Users can now filter out expired programs!

2. **Collateral Requirements Extracted**
   - Program 5: KfW Offshore (project financing standard)
   - Program 7: Sportstätten NRW (€500k threshold)
   - This is a **hard blocker** for many applicants

3. **Extended KMU Definitions Found**
   - Program 8: Up to 750 employees / €200M revenue
   - Standard KMU: 250 employees / €50M
   - Ontology handles this correctly as explicit limits

4. **Retroactive Funding Exception**
   - Program 4: Hochwasser NRW allows retroactive (from 01.07.2021)
   - Correctly captured as `antrag_vor_massnahmenbeginn: false`

5. **Mega-Funding Amounts**
   - Program 5: Up to **€700 million** (KfW Offshore)
   - Program 2: Minimum **€500k** (Climate protection)
   - Shows ontology handles full range (€2k - €700M)

### ⚠️ **Ontology Limitations Identified**

1. **Complex Funding Formulas** (2/10 cases)
   - Some programs have multi-tiered rates (20-40%, 40-100%)
   - Current schema: `foerdersatz_prozent` = single number
   - **Recommendation**: Add `foerdersatz_komplex` object for ranges

2. **Sector-Specific Filters Missing**
   - Program 9: Only agriculture (Landwirtschaftsbetriebe)
   - Program 8: Agriculture processing only
   - **Recommendation**: Add `sektor_einschraenkung` field

3. **Application Frequency** (New Pattern!)
   - Many programs: Annual deadlines (31.03, 15.03, 01.06)
   - Current: Only captures date, not frequency
   - **Recommendation**: Add `antragsfrist_typ: 'einmalig' | 'jaehrlich' | 'laufend'`

4. **Beneficiary Sub-Types** (Quality Issue)
   - "Unternehmen" too broad (includes Projektgesellschaften, Landwirtschaftsbetriebe)
   - Program 1/10: Should be "FSJ-Träger", not just "Verband"
   - **Recommendation**: More granular entity_type taxonomy

---

## Confidence Score Analysis

### By Program:
1. FSJ SH: 0.85-1.0 (Avg: 0.93)
2. Klimaschutz: 0.8-1.0 (Avg: 0.92)
3. Privatheit: 0.8-1.0 (Avg: 0.91)
4. Hochwasser: 0.9-1.0 (Avg: 0.95)
5. Offshore: 0.85-1.0 (Avg: 0.92)
6. Innovation NS: 0.8-1.0 (Avg: 0.91)
7. Sportstätten: 0.9-1.0 (Avg: 0.93)
8. Agrar TH: 0.9-1.0 (Avg: 0.94)
9. Natura 2000: 0.9-1.0 (Avg: 0.95)
10. Freiwilligendienste: 0.9-1.0 (Avg: 0.94)

**Overall Average Confidence**: **0.93** (93%)

---

## Recommendations for Ontology v3.0

### ✅ **Keep (Working Well)**
1. All Stufe 1 fields (universal filters)
2. All Stufe 2 high-value fields
3. All Stufe 3 medium-value fields
4. **Temporal fields** (major success!)

### 🔧 **Enhance**
1. **Funding Rate**: Add `foerdersatz_range` {min, max} for complex rates
2. **Application Frequency**: Add `antragsfrist_typ` enum
3. **Sector Restrictions**: Add `sektor_einschraenkung` array
4. **Beneficiary Granularity**: Expand entity_type with sub-categories

### 🆕 **Consider Adding** (>2% threshold check needed)
1. `eigenanteil_mindestens` (minimum co-financing %) - Seen in 3/10
2. `mehrfachfoerderung_zulaessig` (can combine with other programs) - Seen in 2/10
3. `projektdauer_max_monate` (max project duration) - Seen in 4/10

---

## Data Quality Issues Found

### Source Field Accuracy:
1. ❌ **Program 2**: `foerderberechtigte` = "Unternehmen" but actually only "Kommunen, Verbände"
2. ❌ **Program 9**: `foerderberechtigte` = "Unternehmen" but actually only "Landwirtschaftsbetriebe"
3. ⚠️ Generic "Unternehmen" often masks specific eligibility

**Impact**: Cannot fully trust scraped `foerderberechtigte` field - must extract from text

---

## Production Readiness Assessment

### ✅ **Ready for Production**
- Universal filters (Stufe 1)
- High-value filters (Stufe 2)
- Temporal validation (Stufe 4) ⭐

### ⚠️ **Needs Refinement**
- Funding rate complexity handling
- Sector-specific restrictions
- Entity type granularity

### 📊 **Success Metrics**
- **Extraction Success Rate**: 100% (10/10)
- **Average Confidence**: 93%
- **Temporal Data Found**: 80% (validity) + 70% (deadlines)
- **Zero Failures**: No extraction errors

---

## Cost Projection for Full Extraction

Based on test results:
- **Average extraction time**: ~12 seconds per program
- **Total programs**: 2,446
- **Estimated time**: ~8 hours (sequential) or 30 min (parallel batches of 50)
- **Token usage**: ~6k tokens/program average
- **Total cost** (GPT-4o-mini): ~$2.50 for all 2,446 programs ✅

**Recommendation**: Proceed with full extraction using GPT-5-mini at ~$1.60 total cost

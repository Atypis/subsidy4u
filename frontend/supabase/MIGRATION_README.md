# Database Migration Instructions

## Migration v4.0: Add Heuristic Fields (2025-10-02)

This migration adds **14 new columns** to the `subsidy_programs` table to support the **Ontology v4.0** (11-filter system).

### How to Apply This Migration

**Option 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/20251002000000_add_heuristic_fields_v4.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd+Enter)
7. Verify success - should see "Success. No rows returned"

**Option 2: Supabase CLI (If you have it installed)**

```bash
cd frontend
npx supabase db push
```

**Option 3: Direct psql (If you have database credentials)**

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase/migrations/20251001000000_add_heuristic_fields.sql
```

---

## What This Migration Does

### Adds 14 New Columns (Ontology v4.0):

**TIER S: Universal Hard Filters (7):**
1. `richtlinie_gueltigkeit_bis` (DATE) - Program validity deadline
2. `ausschluss_unternehmen_in_schwierigkeiten` (BOOLEAN) - Excludes distressed companies
3. `agvo_sektorausschluss` (BOOLEAN) - EU sector exclusions (affects 46% of programs!)
4. `foerderbetrag_max_eur` (NUMERIC) - Max funding amount
5. `foerderbetrag_min_eur` (NUMERIC) - Min funding amount
6. `de_minimis_beihilfe` (BOOLEAN) - De-minimis aid (€200k/3y limit)
7. `antragsfrist` (DATE) - Application deadline

**TIER A: Specific Hard Filters (4):**
8. `kmu_erforderlich` (BOOLEAN) - SME requirement (≤250 employees, ≤€50M revenue)
9. `mitarbeiter_limit_max` (INTEGER) - Explicit max employees (overrides KMU)
10. `umsatz_limit_max_eur` (NUMERIC) - Explicit max revenue (overrides KMU)
11. `unternehmensalter_max_jahre` (INTEGER) - Max company age (critical for startups)

**Metadata (3):**
12. `extraction_confidence` (NUMERIC) - LLM confidence (0.0-1.0, use ≥0.7 for production)
13. `extraction_date` (TIMESTAMPTZ) - When extraction was performed
14. `extraction_notes` (TEXT) - Uncertainties, conflicts, context

**Removed from v3.0** (not included):
- ❌ `sicherheiten_erforderlich` (too vague)
- ❌ `foerdersatz_prozent` (often complex formulas)
- ❌ `gruendungsfoerdernd` (too subjective)
- ❌ `antrag_vor_massnahmenbeginn` (informational, not filter)
- ❌ `investition_in_deutschland_erforderlich` (implicit)
- ❌ `programm_laufzeit_bis` (confusable with gueltigkeit)
- ❌ `antragsfrist_typ` (redundant)

### Creates 7 Performance Indexes:
- `idx_programs_gueltigkeit_v4` - Temporal filtering (expired programs)
- `idx_programs_antragsfrist_v4` - Deadline filtering
- `idx_programs_kmu_v4` - SME filtering
- `idx_programs_mitarbeiter_v4` - Employee limit filtering
- `idx_programs_umsatz_v4` - Revenue limit filtering
- `idx_programs_extraction_date_v4` - Extraction tracking
- `idx_programs_extraction_confidence_v4` - Quality threshold filtering

### Adds Column Comments:
Detailed documentation for each heuristic field explaining:
- What the field means
- How it affects filtering (hard blocker vs. soft filter)
- NULL handling (always permissive)

---

## Verification

After running the migration, verify it worked:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subsidy_programs'
  AND column_name LIKE '%heuristic%' OR column_name IN (
    'richtlinie_gueltigkeit_bis',
    'kmu_erforderlich',
    'extraction_date'
  )
ORDER BY column_name;

-- Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subsidy_programs'
  AND indexname LIKE 'idx_programs%';

-- Count programs (should still be 2,446)
SELECT COUNT(*) FROM subsidy_programs;
```

Expected results:
- ✅ 14 new columns visible
- ✅ 7 new indexes created
- ✅ All existing data intact (2,446 rows)
- ✅ All new columns have NULL values (until extraction runs)

---

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Drop all v4.0 columns
ALTER TABLE subsidy_programs
  DROP COLUMN IF EXISTS richtlinie_gueltigkeit_bis,
  DROP COLUMN IF EXISTS ausschluss_unternehmen_in_schwierigkeiten,
  DROP COLUMN IF EXISTS agvo_sektorausschluss,
  DROP COLUMN IF EXISTS foerderbetrag_max_eur,
  DROP COLUMN IF EXISTS foerderbetrag_min_eur,
  DROP COLUMN IF EXISTS de_minimis_beihilfe,
  DROP COLUMN IF EXISTS antragsfrist,
  DROP COLUMN IF EXISTS kmu_erforderlich,
  DROP COLUMN IF EXISTS mitarbeiter_limit_max,
  DROP COLUMN IF EXISTS umsatz_limit_max_eur,
  DROP COLUMN IF EXISTS unternehmensalter_max_jahre,
  DROP COLUMN IF EXISTS extraction_confidence,
  DROP COLUMN IF EXISTS extraction_date,
  DROP COLUMN IF EXISTS extraction_notes;

-- Indexes will be automatically dropped with columns
```

---

## Next Steps After Migration

1. ✅ Migration v4.0 applied
2. ⏭️ Test extraction script (`scripts/test-extraction.ts`)
3. ⏭️ Run extraction on all 2,446 programs
4. ⏭️ Update AI filtering tools to use 11 filters
5. ⏭️ Test end-to-end filtering (2,446 → ~50 programs)

---

**Migration Files:**
- **Current (v4.0):** `migrations/20251002000000_add_heuristic_fields_v4.sql` ⭐
- **Previous (v3.0):** `migrations/20251001000000_add_heuristic_fields.sql` (superseded)

**Ontology:** See `../../heuristic-extraction/ONTOLOGY.md` (v4.0)
**Created:** 2025-10-02
**Impact:** Non-breaking (only adds columns, no data changes)
**Reversible:** Yes (see rollback section)

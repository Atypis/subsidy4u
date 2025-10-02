-- Add extracted heuristic columns for Ontology v4.0 (11 filters)
-- Migration created: 2025-10-02
-- Purpose: Enable automated filtering based on extracted program criteria
-- Ontology Version: 4.0 (streamlined from v3.0)

-- ==========================================
-- TIER S: Universal Hard Filters (7 fields)
-- ==========================================

-- Filter #1: Program validity deadline (when richtlinie expires)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS richtlinie_gueltigkeit_bis DATE DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.richtlinie_gueltigkeit_bis IS
'Program validity deadline (from richtlinie). NULL = no expiry. Filter: Remove if date < today';

-- Filter #2: Exclusion of companies in difficulty (EU Article 2 No. 18 AGVO)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS ausschluss_unternehmen_in_schwierigkeiten BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.ausschluss_unternehmen_in_schwierigkeiten IS
'Excludes financially distressed companies. NULL = no restriction. Filter: Remove if true AND user.isDistressed';

-- Filter #3: AGVO sector exclusions (EU regulation 651/2014)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS agvo_sektorausschluss BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.agvo_sektorausschluss IS
'EU sector exclusions: agriculture, fisheries, aquaculture, coal, steel. NULL = no exclusions. Filter: Remove if true AND user in excluded sector';

-- Filter #4: Max funding amount (EUR)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerderbetrag_max_eur NUMERIC DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.foerderbetrag_max_eur IS
'Maximum funding amount in EUR. NULL = no upper limit. Filter: Remove if amount < user.funding_need';

-- Filter #5: Min funding amount (EUR)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerderbetrag_min_eur NUMERIC DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.foerderbetrag_min_eur IS
'Minimum funding amount in EUR. NULL = no lower limit. Filter: Remove if amount > user.funding_need';

-- Filter #6: De-minimis aid (EU Regulation 1407/2013, €200k/3y limit)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS de_minimis_beihilfe BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.de_minimis_beihilfe IS
'De-minimis aid (€200k over 3 years). NULL = not de-minimis. Filter: Informational warning only, not blocker';

-- Filter #7: Application deadline
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS antragsfrist DATE DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.antragsfrist IS
'Application deadline. NULL or "laufend" = ongoing. Filter: Remove if date < today';

-- ==========================================
-- TIER A: Specific Hard Filters (4 fields)
-- ==========================================

-- Filter #8: SME requirement (EU definition: ≤250 employees, ≤€50M revenue)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS kmu_erforderlich BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.kmu_erforderlich IS
'SME (KMU) requirement. NULL = no restriction. Filter: Remove if true AND user exceeds SME thresholds';

-- Filter #9: Max employee limit (explicit, overrides kmu_erforderlich)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS mitarbeiter_limit_max INTEGER DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.mitarbeiter_limit_max IS
'Explicit max employees. NULL = no limit. Filter: Remove if limit < user.employees. Overrides kmu_erforderlich!';

-- Filter #10: Max revenue limit (EUR, explicit, overrides kmu_erforderlich)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS umsatz_limit_max_eur NUMERIC DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.umsatz_limit_max_eur IS
'Explicit max annual revenue in EUR. NULL = no limit. Filter: Remove if limit < user.revenue. Overrides kmu_erforderlich!';

-- Filter #11: Max company age (years since founding)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS unternehmensalter_max_jahre INTEGER DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.unternehmensalter_max_jahre IS
'Max company age in years. NULL = no age limit. Filter: Remove if limit < user.company_age. Critical for startup programs';

-- ==========================================
-- Metadata Fields (2 fields)
-- ==========================================

-- Extraction quality indicator (0.0 - 1.0)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT NULL
CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0);

COMMENT ON COLUMN subsidy_programs.extraction_confidence IS
'LLM extraction confidence (0.0-1.0). Use ≥0.7 for production. NULL = not extracted yet';

-- Extraction timestamp
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS extraction_date TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.extraction_date IS
'When heuristics were extracted. NULL = not extracted yet. Use for tracking extraction progress';

-- Extraction notes (uncertainties, conflicts, context)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS extraction_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.extraction_notes IS
'LLM extraction notes: uncertainties, conflicts, important context. NULL = no notes';

-- ==========================================
-- Performance Indexes
-- ==========================================

-- Temporal filters (high selectivity)
CREATE INDEX IF NOT EXISTS idx_programs_gueltigkeit_v4
ON subsidy_programs(richtlinie_gueltigkeit_bis)
WHERE richtlinie_gueltigkeit_bis IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_antragsfrist_v4
ON subsidy_programs(antragsfrist)
WHERE antragsfrist IS NOT NULL;

-- SME and size filters
CREATE INDEX IF NOT EXISTS idx_programs_kmu_v4
ON subsidy_programs(kmu_erforderlich)
WHERE kmu_erforderlich IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_mitarbeiter_v4
ON subsidy_programs(mitarbeiter_limit_max)
WHERE mitarbeiter_limit_max IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_umsatz_v4
ON subsidy_programs(umsatz_limit_max_eur)
WHERE umsatz_limit_max_eur IS NOT NULL;

-- Extraction tracking
CREATE INDEX IF NOT EXISTS idx_programs_extraction_date_v4
ON subsidy_programs(extraction_date)
WHERE extraction_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_extraction_confidence_v4
ON subsidy_programs(extraction_confidence)
WHERE extraction_confidence IS NOT NULL;

-- ==========================================
-- Verification Query
-- ==========================================

-- Run this after migration to verify:
-- SELECT COUNT(*) as total_programs,
--        COUNT(richtlinie_gueltigkeit_bis) as with_gueltigkeit,
--        COUNT(kmu_erforderlich) as with_kmu,
--        COUNT(extraction_date) as extracted_count
-- FROM subsidy_programs;

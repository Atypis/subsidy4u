-- Add extracted heuristic columns for 14-filter ontology
-- Migration created: 2025-10-01
-- Purpose: Enable automated filtering based on extracted program criteria

-- ==========================================
-- TIER S: Universal Filters (Columns 1-8)
-- ==========================================

-- Filter #3: Program validity deadline
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS richtlinie_gueltigkeit_bis DATE DEFAULT NULL;

-- Filter #4: Exclusion of companies in difficulty
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS ausschluss_unternehmen_in_schwierigkeiten BOOLEAN DEFAULT NULL;

-- Filter #5: AGVO sector exclusions (EU regulation 651/2014)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS agvo_sektorausschluss BOOLEAN DEFAULT NULL;

-- Filter #6: Collateral required
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS sicherheiten_erforderlich BOOLEAN DEFAULT FALSE;

-- Filter #7: Max funding amount
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerderbetrag_max_eur NUMERIC DEFAULT NULL;

ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerderbetrag_min_eur NUMERIC DEFAULT NULL;

-- Filter #8: De-minimis aid (informational, not a blocker)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS de_minimis_beihilfe BOOLEAN DEFAULT NULL;

-- ==========================================
-- TIER A: Specific Filters (Columns 9-14)
-- ==========================================

-- Filter #10: SME requirement
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS kmu_erforderlich BOOLEAN DEFAULT NULL;

-- Filter #11: Application deadline
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS antragsfrist DATE DEFAULT NULL;

ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS antragsfrist_typ TEXT DEFAULT NULL;

-- Filter #12: Max employee limit
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS mitarbeiter_limit_max INTEGER DEFAULT NULL;

-- Filter #13: Max revenue limit
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS umsatz_limit_max_eur NUMERIC DEFAULT NULL;

-- Filter #14: Max company age
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS unternehmensalter_max_jahre INTEGER DEFAULT NULL;

-- ==========================================
-- Additional Extracted Fields
-- ==========================================

-- Funding rate percentage (e.g., 90% = 90.0)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerdersatz_prozent NUMERIC DEFAULT NULL;

-- Support for startup/founding-focused programs
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS gruendungsfoerdernd BOOLEAN DEFAULT NULL;

-- Application must be submitted before project start
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS antrag_vor_massnahmenbeginn BOOLEAN DEFAULT NULL;

-- Investment must be in Germany
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS investition_in_deutschland_erforderlich BOOLEAN DEFAULT NULL;

-- Program runtime end (e.g., "bis 2030")
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS programm_laufzeit_bis DATE DEFAULT NULL;

-- ==========================================
-- Extraction Metadata
-- ==========================================

-- Extraction confidence (0.0 - 1.0)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC DEFAULT NULL;

-- When extraction was performed
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS extraction_date TIMESTAMP DEFAULT NULL;

-- Computed field: is program currently active?
-- (based on richtlinie_gueltigkeit_bis and antragsfrist)
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ==========================================
-- Performance Indexes
-- ==========================================

-- Index for temporal filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_programs_gueltigkeit
ON subsidy_programs(richtlinie_gueltigkeit_bis)
WHERE richtlinie_gueltigkeit_bis IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_antragsfrist
ON subsidy_programs(antragsfrist)
WHERE antragsfrist IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_programs_active
ON subsidy_programs(is_active)
WHERE is_active = TRUE;

-- Index for SME filtering
CREATE INDEX IF NOT EXISTS idx_programs_kmu
ON subsidy_programs(kmu_erforderlich)
WHERE kmu_erforderlich IS NOT NULL;

-- GIN indexes for array fields (existing fields)
CREATE INDEX IF NOT EXISTS idx_programs_foerdergebiet
ON subsidy_programs USING GIN(foerdergebiet);

CREATE INDEX IF NOT EXISTS idx_programs_foerderberechtigte
ON subsidy_programs USING GIN(foerderberechtigte);

CREATE INDEX IF NOT EXISTS idx_programs_foerderart
ON subsidy_programs USING GIN(foerderart);

-- Index for extraction tracking
CREATE INDEX IF NOT EXISTS idx_programs_extraction_date
ON subsidy_programs(extraction_date);

-- ==========================================
-- Comments for Documentation
-- ==========================================

COMMENT ON COLUMN subsidy_programs.richtlinie_gueltigkeit_bis IS
'Program regulation validity end date. Filter out if expired. NULL = assume valid (permissive).';

COMMENT ON COLUMN subsidy_programs.ausschluss_unternehmen_in_schwierigkeiten IS
'TRUE = program excludes companies in financial difficulty. Hard blocker if user is distressed.';

COMMENT ON COLUMN subsidy_programs.agvo_sektorausschluss IS
'TRUE = program follows AGVO sector exclusions (agriculture, fisheries, coal, steel). Hard blocker for excluded sectors.';

COMMENT ON COLUMN subsidy_programs.sicherheiten_erforderlich IS
'TRUE = collateral required. Hard blocker if user cannot provide collateral.';

COMMENT ON COLUMN subsidy_programs.foerderbetrag_max_eur IS
'Maximum funding amount in EUR. Filter out if user needs more. NULL = unknown limit (permissive).';

COMMENT ON COLUMN subsidy_programs.de_minimis_beihilfe IS
'TRUE = program is de-minimis aid (€200k limit over 3 years). Informational only, not a blocker.';

COMMENT ON COLUMN subsidy_programs.kmu_erforderlich IS
'TRUE = SME status required (≤250 employees, ≤€50M revenue per EU definition). Hard blocker for large companies.';

COMMENT ON COLUMN subsidy_programs.antragsfrist IS
'Application deadline date. Filter out if missed. NULL or antragsfrist_typ=laufend = rolling applications.';

COMMENT ON COLUMN subsidy_programs.antragsfrist_typ IS
'Type of deadline: einmalig, jaehrlich, laufend. laufend = no fixed deadline.';

COMMENT ON COLUMN subsidy_programs.mitarbeiter_limit_max IS
'Maximum employee count. Overrides kmu_erforderlich if explicitly set. NULL = no limit (permissive).';

COMMENT ON COLUMN subsidy_programs.umsatz_limit_max_eur IS
'Maximum annual revenue in EUR. Overrides kmu_erforderlich if explicitly set. NULL = no limit (permissive).';

COMMENT ON COLUMN subsidy_programs.unternehmensalter_max_jahre IS
'Maximum company age in years since founding. Hard blocker for older companies. NULL = no limit (permissive).';

COMMENT ON COLUMN subsidy_programs.foerdersatz_prozent IS
'Funding rate as percentage (e.g., 90.0 = 90%). Informational for cost calculation.';

COMMENT ON COLUMN subsidy_programs.gruendungsfoerdernd IS
'TRUE = program specifically targets startups/founding companies. May imply unternehmensalter_max_jahre ≤ 5.';

COMMENT ON COLUMN subsidy_programs.is_active IS
'Computed: TRUE if program is currently active (not expired, deadline not passed). Auto-filter to hide inactive programs.';

COMMENT ON COLUMN subsidy_programs.extraction_confidence IS
'LLM extraction confidence score (0.0-1.0). Lower scores may need manual review.';

COMMENT ON COLUMN subsidy_programs.extraction_date IS
'Timestamp when heuristic extraction was performed. Used to track which programs need re-extraction.';

-- Migration: Upgrade from Ontology v4.0 to v4.1
-- Changes:
--   1. Remove antragsfrist column (recurring deadlines don't fit DATE format)
--   2. Add foerderbetrag_unbegrenzt column (for percentage-based uncapped funding)

-- Remove antragsfrist column
ALTER TABLE subsidy_programs
DROP COLUMN IF EXISTS antragsfrist;

COMMENT ON TABLE subsidy_programs IS 'Ontology v4.1: Removed antragsfrist (2025-10-02)';

-- Add foerderbetrag_unbegrenzt column
ALTER TABLE subsidy_programs
ADD COLUMN IF NOT EXISTS foerderbetrag_unbegrenzt BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN subsidy_programs.foerderbetrag_unbegrenzt IS
'Ontology v4.1: TRUE if funding is percentage-based with NO absolute cap (e.g., "80% of costs"). When TRUE, foerderbetrag_max_eur should be NULL. Filter logic: treat as unlimited max.';

-- Create index for uncapped funding filter
CREATE INDEX IF NOT EXISTS idx_programs_unbegrenzt_v41
ON subsidy_programs(foerderbetrag_unbegrenzt)
WHERE foerderbetrag_unbegrenzt = true;

COMMENT ON INDEX idx_programs_unbegrenzt_v41 IS
'Quick lookup for uncapped percentage-based funding programs';

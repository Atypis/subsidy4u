# Heuristic Extraction for Subsidy Programs

**Purpose**: Extract structured heuristics from 2,400+ German subsidy programs to enable fast, automated filtering.

---

## Structure

```
heuristic-extraction/
├── ONTOLOGY.md              # ⭐ Single source of truth - Ontology v4.0 (11 filters)
├── README.md                # This file
├── archive/                 # Historical documentation (v1-v3)
├── test-samples/            # Sample programs for testing extraction
└── results/                 # Extraction test results (gitignored)
```

---

## Quick Start

### 1. Review the Ontology
See **[ONTOLOGY.md](./ONTOLOGY.md)** for:
- 11 core heuristic filters (TIER S + TIER A)
- TypeScript schema
- Extraction rules and patterns
- Filter execution logic

### 2. Run Extraction Test
```bash
cd frontend
npm run test:extraction  # Compare GPT-5 vs GPT-5-mini on 10 programs
```

Test script: `frontend/scripts/test-extraction.ts`

### 3. Run Full Extraction
```bash
# TODO: Add production extraction script
# Will extract all 2,446 programs and store in database
```

---

## Ontology Evolution

| Version | Date | Changes | Fields |
|---------|------|---------|--------|
| v4.0 | 2025-10-02 | **Current** - Streamlined, removed noise | 11 |
| v3.0 | 2025-10-01 | Added temporal filters, refined semantics | 17 |
| v2.0 | 2025-09-30 | Evidence-based from 2,446 programs | 24 |
| v1.0 | 2025-09-29 | Initial draft | 15 |

See `archive/` for historical documentation.

---

## Key Principles

1. **Negative Filtering**: Remove only programs that definitively don't match
2. **null = Keep**: Unknown values are permissive (keep program)
3. **Explicit > Implicit**: Hard-coded values override generic rules
4. **High Signal/Noise**: Only filters with >80% extraction reliability

---

## Extraction Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Data Source: Supabase (subsidy_programs table)      │
│    - kurztext, volltext, rechtliche_voraussetzungen    │
│    - richtlinie (full legal text, 10k chars max)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LLM Extraction (GPT-5-mini or GPT-5)                │
│    - System prompt: ONTOLOGY.md patterns              │
│    - Output: 11 heuristics + confidence + notes        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Validation                                           │
│    - Schema validation (TypeScript types)              │
│    - Confidence threshold (≥0.7 for production)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Storage                                              │
│    - Update subsidy_programs.heuristics (JSONB)        │
│    - Update subsidy_programs.extraction_metadata       │
└─────────────────────────────────────────────────────────┘
```

---

## Quality Metrics

**Target Performance**:
- ✅ Extraction accuracy: >80% per field
- ✅ Extraction speed: <3 seconds per program (GPT-5-mini)
- ✅ False negatives: <5% (eligible programs incorrectly filtered)
- ✅ Coverage: >70% of programs have ≥3 extractable heuristics

---

## Cost Estimation

**Full Extraction (2,446 programs)**:

| Model | Tokens/Program | Cost/Program | Total Cost |
|-------|----------------|--------------|------------|
| GPT-5-mini | ~8,000 | ~$0.03 | ~$73 |
| GPT-5 | ~8,000 | ~$0.12 | ~$293 |

**Recommendation**: Use GPT-5-mini for production (4x cheaper, similar quality)

---

## Archive Contents

The `archive/` folder contains historical documentation:

- `HEURISTIK-RANKING.md` - Detailed ranking of 24 candidate heuristics (v3.0)
- `FILTER-SEMANTIK.md` - Filter execution logic (v3.0)
- `EXTRACTION-QUALITY-REPORT.md` - Quality report from initial tests
- `NEW-ONTOLOGY-CANDIDATES.md` - Analysis of potential new fields
- `ontologie-schema-deutsch.json` - German JSON schema (v2.0)
- `ontology-schema.json` - English JSON schema (v2.0)

**Note**: These are kept for reference but superseded by `ONTOLOGY.md` v4.0.

---

## Next Steps

1. ✅ Ontology v4.0 defined
2. ✅ Test script updated to 11 fields
3. 🔄 Fix TypeScript errors in test script
4. 🔄 Test extraction on 10 diverse programs
5. 🔄 Validate extraction quality
6. 🔄 Run full extraction on all 2,446 programs
7. 🔄 Integrate heuristics into filtering API

---

**Maintained by**: @a1984
**Last Updated**: 2025-10-02

# Filter-Semantik: Einfache Negative Filterung

**Kernprinzip**: Filter entfernen nur Programme, die **definitiv nicht passen**. Bei Unklarheit (null) → Programm durchlassen.

---

## Das Grundprinzip

```
Start: ALLE 2.446 Programme sind sichtbar
↓
Für jede Heuristik:
  IF (Programm hat Ausschlusskriterium) AND (User erfüllt dieses Kriterium)
    → Programm RAUSFILTERN
  ELSE
    → Programm BEHALTEN
↓
Ergebnis: Alle verbleibenden Programme anzeigen
```

**null-Semantik**: `null` = keine Information = **IMMER DURCHLASSEN**

---

## Die 14 Filter (S + A Tiers)

### TIER S: Universelle Filter (8)

#### 1. foerdergebiet (Region)
```
User: location = "Berlin"

KEEP:
✅ program.foerdergebiet includes "Berlin"
✅ program.foerdergebiet includes "bundesweit"
✅ program.foerdergebiet === null

FILTER OUT:
❌ program.foerdergebiet = ["Bayern", "Sachsen"] (andere Regionen only)
```

**Logik**: Rausfiltern wenn Region DEFINITIV nicht passt

---

#### 2. foerderart (Funding Type)
```
User: preferences.fundingType = ["Zuschuss"] (optional)

DEFAULT (User hat keine Präferenz):
✅ ALLE foerderart durchlassen

IF User hat Präferenz:
  KEEP:
  ✅ program.foerderart includes "Zuschuss"
  ✅ program.foerderart === null

  FILTER OUT:
  ❌ program.foerderart = ["Darlehen", "Bürgschaft"] only
```

**Logik**: User-Präferenz, kein Hard Blocker

---

#### 3. richtlinie_gueltigkeit_bis (Validity Deadline)
```
Today: 2025-10-01

KEEP:
✅ program.richtlinie_gueltigkeit_bis > today (noch gültig)
✅ program.richtlinie_gueltigkeit_bis === null (kein Datum = unbegrenzt)

FILTER OUT:
❌ program.richtlinie_gueltigkeit_bis <= today (abgelaufen)
```

**Logik**: Hard Blocker - abgelaufene Programme sind tot

---

#### 4. ausschluss_unternehmen_in_schwierigkeiten (No Distressed Companies)
```
User: isDistressed = true (nur fragen wenn relevant)

KEEP:
✅ program.ausschluss === false
✅ program.ausschluss === null (kein Ausschluss)
✅ user.isDistressed === false

FILTER OUT:
❌ program.ausschluss === true AND user.isDistressed === true
```

**Logik**: Nur rausfiltern wenn BEIDE Bedingungen erfüllt

---

#### 5. agvo_sektorausschluss (EU Sector Exclusions)
```
User: sector = "Landwirtschaft"

KEEP:
✅ program.agvo_sektorausschluss === false
✅ program.agvo_sektorausschluss === null
✅ user.sector NOT IN excluded_sectors

FILTER OUT:
❌ program.agvo_sektorausschluss === true
   AND user.sector IN ["agriculture", "fisheries", "coal", "steel"]
```

**Excluded Sectors**: Landwirtschaft, Fischerei, Aquakultur, Kohle, Stahl

---

#### 6. sicherheiten_erforderlich (Collateral Required)
```
User: canProvideCollateral = false

KEEP:
✅ program.sicherheiten_erforderlich === false
✅ program.sicherheiten_erforderlich === null (keine nötig)
✅ user.canProvideCollateral === true

FILTER OUT:
❌ program.sicherheiten_erforderlich === true
   AND user.canProvideCollateral === false
```

**Logik**: Nur rausfiltern wenn User explizit KEINE Sicherheiten stellen kann

---

#### 7. foerderbetrag_max_eur (Max Funding Amount)
```
User: fundingNeed = 1000000 (€1M)

KEEP:
✅ program.foerderbetrag_max >= 1000000
✅ program.foerderbetrag_max === null (kein Limit bekannt)
✅ user.fundingNeed === null (User hat keinen Bedarf angegeben)

FILTER OUT:
❌ program.foerderbetrag_max < 1000000 (zu wenig)
```

**Logik**: Soft Filter - nur rausfiltern wenn Programm DEFINITIV zu klein

---

#### 8. de_minimis_beihilfe (De-minimis Warning)
```
Program: de_minimis_beihilfe = true
User: totalAidReceived_last3years = 150000

→ ⚠️ WARNING: "De-minimis: €150k bereits erhalten, €50k Spielraum übrig"
→ ✅ Programm trotzdem zeigen (KEIN Filter!)
```

**Logik**: Informational only, kein Ausschlusskriterium

---

### TIER A: Spezifische Filter (6)

#### 9. antragsberechtigte (Eligible Entities)
```
User: entityType = "Unternehmen"

KEEP:
✅ program.antragsberechtigte includes "Unternehmen"
✅ program.antragsberechtigte === null (alle berechtigt)
✅ program.antragsberechtigte === [] (leer = alle)

FILTER OUT:
❌ program.antragsberechtigte = ["Kommunen", "Privatpersonen"]
   (User-Typ nicht in Liste)
```

**Wichtig**: Aus Text extrahieren, nicht aus Feld `foerderberechtigte` vertrauen!

---

#### 10. kmu_erforderlich (SME Required)
```
User: employees = 500 (Großunternehmen)

KEEP:
✅ program.kmu_erforderlich === false
✅ program.kmu_erforderlich === null (keine KMU-Pflicht)
✅ user.employees <= 250 (User ist KMU)
✅ user.employees === null (unklar)

FILTER OUT:
❌ program.kmu_erforderlich === true AND user.employees > 250
```

**Standard KMU-Definition**: ≤250 Mitarbeiter, ≤€50M Umsatz

**Wichtig**: `mitarbeiter_limit_max` überschreibt diese Definition falls explizit angegeben!

---

#### 11. antragsfrist (Application Deadline)
```
Today: 2025-10-01

KEEP:
✅ program.antragsfrist > today (Frist noch offen)
✅ program.antragsfrist === null (laufend)
✅ program.antragsfrist === "laufend"

FILTER OUT:
❌ program.antragsfrist <= today (Frist verpasst)
```

---

#### 12. mitarbeiter_limit_max (Max Employees)
```
User: employees = 500

KEEP:
✅ program.mitarbeiter_limit_max >= 500
✅ program.mitarbeiter_limit_max === null (kein Limit)
✅ user.employees === null (unklar)

FILTER OUT:
❌ program.mitarbeiter_limit_max < 500 (Limit überschritten)
```

**Wichtig**: Explizites Limit überschreibt `kmu_erforderlich`!

Beispiel:
- Program: kmu_erforderlich = true, mitarbeiter_limit_max = 750
- User: employees = 500
- Result: ✅ KEEP (explizites Limit 750 hat Vorrang vor KMU-Standard 250)

---

#### 13. umsatz_limit_max_eur (Max Revenue)
```
User: revenue = 100000000 (€100M)

KEEP:
✅ program.umsatz_limit_max >= 100000000
✅ program.umsatz_limit_max === null (kein Limit)
✅ user.revenue === null (unklar)

FILTER OUT:
❌ program.umsatz_limit_max < 100000000 (Limit überschritten)
```

---

#### 14. unternehmensalter_max_jahre (Max Company Age)
```
User: foundingYear = 2020
Today: 2025
company.age = 5 Jahre

KEEP:
✅ program.unternehmensalter_max >= 5
✅ program.unternehmensalter_max === null (kein Limit)
✅ user.foundingYear === null (unklar)

FILTER OUT:
❌ program.unternehmensalter_max < 5 (zu alt)
```

---

## Filter-Ausführung

### Phase 1: Heuristik-Filter (schnell, billig)
```
Start: 2.446 Programme
↓
Wende alle 14 Filter an (AND-verknüpft)
↓
Result: ~50-100 Programme (abhängig von User-Profil)
```

### Phase 2: LLM Deep Check (genau, teuer) [Optional]
```
Start: 50-100 Programme aus Phase 1
↓
LLM liest rechtliche_voraussetzungen + volltext für jedes Programm
LLM checkt detaillierte Eligibility gegen Company-Profil
↓
Result: ~10-20 Programme (high confidence matches)
```

---

## Filter-Reihenfolge (Optimization)

**Günstigste zuerst** (maximale Elimination mit minimalen Daten):

1. **richtlinie_gueltigkeit_bis** (0 User-Input, eliminiert abgelaufene)
2. **antragsfrist** (0 User-Input, eliminiert verpasste Fristen)
3. **foerdergebiet** (1 User-Input, 70-80% Elimination)
4. **antragsberechtigte** (1 User-Input, 40-70% Elimination)
5. **agvo_sektorausschluss** (1 User-Input, 46% betroffen)
6. **kmu_erforderlich** (2 User-Inputs: employees, revenue)
7. **mitarbeiter_limit_max** (1 User-Input)
8. **umsatz_limit_max_eur** (1 User-Input)
9. **unternehmensalter_max_jahre** (1 User-Input)
10. **sicherheiten_erforderlich** (1 User-Input, explizite Frage)
11. **ausschluss_unternehmen_in_schwierigkeiten** (1 User-Input, nur wenn relevant)
12. **foerderart** (User-Präferenz, optional)
13. **foerderbetrag_max_eur** (User-Präferenz, optional)
14. **de_minimis_beihilfe** (Informational only)

---

## AND-Verknüpfung

**Alle Filter sind AND-verknüpft:**

```
Program is shown IF:
   foerdergebiet ✅
   AND antragsberechtigte ✅
   AND richtlinie_gueltigkeit_bis ✅
   AND antragsfrist ✅
   AND kmu_erforderlich ✅
   AND agvo_sektorausschluss ✅
   AND sicherheiten_erforderlich ✅
   AND ausschluss_unternehmen_in_schwierigkeiten ✅
   AND mitarbeiter_limit_max ✅
   AND umsatz_limit_max_eur ✅
   AND unternehmensalter_max_jahre ✅
   AND foerderart ✅ (wenn User Präferenz hat)
   AND foerderbetrag_max_eur ✅ (wenn User Bedarf angegeben)
```

**Ein einziger ❌ = Programm wird rausgefiltert**

---

## Edge Cases

### 1. User gibt minimale Daten
```
User: location = "Berlin", entityType = "Unternehmen"
Keine Angaben zu: employees, revenue, sector, etc.

Result: Maximale Anzahl Programme durchlassen
→ Nur filtern nach Region & Entity Type
→ Alle Size/Sector/Financial-Filter sind permissive (null = keep)
```

### 2. Erweiterte KMU-Definitionen
```
Program A:
  kmu_erforderlich = true (Standard: ≤250 MA)
  mitarbeiter_limit_max = null

Program B:
  kmu_erforderlich = true
  mitarbeiter_limit_max = 750 (erweitert!)

User: employees = 500

Program A: ❌ FILTER OUT (500 > 250)
Program B: ✅ KEEP (explizites Limit 750 überschreibt KMU-Standard)
```

**Regel**: Explizite Limits (mitarbeiter_limit_max, umsatz_limit_max) haben **Vorrang**!

### 3. Bundesweit vs. Regional
```
User: location = "Berlin"

Program A: foerdergebiet = ["Berlin"] → ✅ KEEP
Program B: foerdergebiet = ["bundesweit"] → ✅ KEEP
Program C: foerdergebiet = ["Bayern"] → ❌ FILTER OUT
Program D: foerdergebiet = null → ✅ KEEP (unklar = durchlassen)
```

### 4. Array-Felder (OR-Logik innerhalb des Arrays)
```
Program: antragsberechtigte = ["Unternehmen", "Kommunen", "Privatpersonen"]
User: entityType = "Unternehmen"

→ ✅ KEEP (User-Typ ist IN der Liste)
```

Arrays sind intern OR-verknüpft (mindestens ein Match reicht)

---

## Zusammenfassung

| # | Filter | Typ | Vorkommen | null → |
|---|--------|-----|-----------|--------|
| 1 | foerdergebiet | Hard | 99% | ✅ Keep |
| 2 | foerderart | Soft | 99% | ✅ Keep |
| 3 | richtlinie_gueltigkeit_bis | Hard | 6% | ✅ Keep |
| 4 | ausschluss_unternehmen_in_schwierigkeiten | Hard | 12% | ✅ Keep |
| 5 | agvo_sektorausschluss | Hard | 46% | ✅ Keep |
| 6 | sicherheiten_erforderlich | Hard | 4% | ✅ Keep |
| 7 | foerderbetrag_max_eur | Soft | 53% | ✅ Keep |
| 8 | de_minimis_beihilfe | Info | 31% | ✅ Keep |
| 9 | antragsberechtigte | Hard | 99% | ✅ Keep |
| 10 | kmu_erforderlich | Hard | 21% | ✅ Keep |
| 11 | antragsfrist | Hard | 19% | ✅ Keep |
| 12 | mitarbeiter_limit_max | Hard | 1% | ✅ Keep |
| 13 | umsatz_limit_max_eur | Hard | 3% | ✅ Keep |
| 14 | unternehmensalter_max_jahre | Hard | 2% | ✅ Keep |

**Universelle Regel**: `null` = keine Einschränkung = **KEEP**

---

## Design-Prinzipien

1. **Negative Filtering**: Filter entfernen nur definitiv unpassende Programme
2. **Permissive bei Unklarheit**: Bei fehlenden Daten (null) → durchlassen
3. **AND-Verknüpfung**: Alle Filter müssen passen (ein ❌ = raus)
4. **Minimale User-Inputs**: Nur fragen was nötig ist (progressive disclosure)
5. **Explizite Limits > Implizite Rules**: mitarbeiter_limit_max überschreibt kmu_erforderlich
6. **Transparenz**: User sieht warum Programme gefiltert wurden (Breadcrumbs)

---

## Nächste Schritte

1. ✅ Filter-Semantik definiert
2. 🔄 Ontologie-Schema v3.0 anpassen (Filter-Typen dokumentieren)
3. 🔄 Extraktions-Prompts schreiben (14 Heuristiken extrahieren)
4. 🔄 Backend-API: `apply_filters(company_profile)` implementieren
5. 🔄 Frontend: Filter-Breadcrumbs & Transparency-UI

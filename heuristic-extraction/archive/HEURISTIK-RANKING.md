# Heuristik-Ranking: Aussagekraft & Eindeutigkeit

**Ziel**: Schwammige Kriterien eliminieren, nur eindeutige Filter behalten

**Bewertungskriterien**:
- ✅ **Eindeutigkeit**: Klar extrahierbar, wenig Interpretationsspielraum
- ✅ **Diskriminierungskraft**: Eliminiert effektiv unpassende Programme
- ✅ **Benutzerrelevanz**: Nutzer können Frage eindeutig beantworten
- ❌ **Schwammigkeit**: Unklar, interpretationsbedürftig, inkonsistent

---

## TIER S: Perfekt Eindeutig (100% behalten)

### 1. **foerdergebiet** ⭐⭐⭐⭐⭐
- **Vorkommen**: 99% (2.428 Programme)
- **Eindeutigkeit**: 10/10 - Liste der 17 Bundesländer, klar definiert
- **Diskriminierung**: 70-80% Elimination
- **Benutzer kann beantworten**: 100% - "Wo ist Ihr Unternehmen?"
- **Extraktionsquelle**: `foerdergebiet` Feld (strukturiert)
- **Schwammigkeit**: 0% - Keine Interpretation nötig
- **KEEP**: ✅ Absolut essentiell

### 2. **foerderart** ⭐⭐⭐⭐⭐
- **Vorkommen**: 99% (2.426 Programme)
- **Eindeutigkeit**: 10/10 - 6 feste Kategorien (Zuschuss, Darlehen, etc.)
- **Diskriminierung**: Mittel (81% sind Zuschuss, aber User präferieren oft bestimmte Art)
- **Benutzer kann beantworten**: 100% - "Zuschuss oder Darlehen?"
- **Extraktionsquelle**: `foerderart` Feld (strukturiert)
- **Schwammigkeit**: 0%
- **KEEP**: ✅ Wichtig für User-Präferenz

### 3. **richtlinie_gueltigkeit_bis** ⭐⭐⭐⭐⭐
- **Vorkommen**: 6% haben explizites Datum (125 Programme)
- **Eindeutigkeit**: 10/10 - Datum im Format DD.MM.YYYY
- **Diskriminierung**: SEHR HOCH - Eliminiert abgelaufene Programme (100%)
- **Benutzer kann beantworten**: 100% - System prüft automatisch gegen heute
- **Extraktionsquelle**: `richtlinie` (Muster: "befristet bis 31.12.2025")
- **Schwammigkeit**: 0% - Datum ist Datum
- **KEEP**: ✅ KRITISCH - Verhindert Bewerbungen auf tote Programme
- **Test-Ergebnis**: 8/10 Programme (80% Erfolgsquote)

### 4. **ausschluss_unternehmen_in_schwierigkeiten** ⭐⭐⭐⭐⭐
- **Vorkommen**: 12% (247 Programme)
- **Eindeutigkeit**: 9/10 - Klare EU-Definition (Artikel 2 Nr. 18 AGVO)
- **Diskriminierung**: SEHR HOCH - Harte Blockade wenn true
- **Benutzer kann beantworten**: 90% - "Ist Ihr Unternehmen zahlungsfähig?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("Unternehmen in Schwierigkeiten")
- **Schwammigkeit**: 10% - EU-Definition technisch, aber User versteht "finanziell gesund"
- **KEEP**: ✅ Harte Blockade

### 5. **agvo_sektorausschluss** ⭐⭐⭐⭐⭐
- **Vorkommen**: 46% (947 Programme!)
- **Eindeutigkeit**: 10/10 - Feste EU-Sektorenliste (Landwirtschaft, Fischerei, Kohle, Stahl)
- **Diskriminierung**: SEHR HOCH - Eliminiert gesamte Sektoren
- **Benutzer kann beantworten**: 100% - "In welcher Branche sind Sie?"
- **Extraktionsquelle**: `richtlinie` ("AGVO", "Artikel 1 Abs. 2-5", "651/2014")
- **Schwammigkeit**: 0%
- **KEEP**: ✅ Betrifft fast die Hälfte aller Programme!

### 6. **sicherheiten_erforderlich** ⭐⭐⭐⭐⭐
- **Vorkommen**: 4% (79 Programme)
- **Eindeutigkeit**: 9/10 - "banküblich", "Besicherung" = Ja/Nein
- **Diskriminierung**: SEHR HOCH - Deal-Breaker für viele
- **Benutzer kann beantworten**: 100% - "Können Sie Sicherheiten stellen?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("banküblich", "Sicherheiten")
- **Schwammigkeit**: 10% - "banküblich" kann variieren, aber Prinzip klar
- **KEEP**: ✅ Harte Blockade
- **Test-Ergebnis**: 2/10 gefunden (KfW Offshore, Sportstätten NRW)

### 7. **foerderbetrag_max_eur** ⭐⭐⭐⭐⭐
- **Vorkommen**: 53% erwähnen Beträge (1.087 Programme)
- **Eindeutigkeit**: 9/10 - Numerischer Wert in EUR
- **Diskriminierung**: SEHR HOCH - User sucht oft nach Mindestbetrag
- **Benutzer kann beantworten**: 100% - "Wie viel Förderung brauchen Sie?"
- **Extraktionsquelle**: `volltext` ("bis zu EUR X", "maximal EUR X")
- **Schwammigkeit**: 10% - Manchmal Formeln (€X + €Y/Teilnehmer)
- **KEEP**: ✅ Essentiell für Bedarfs-Matching
- **Test-Ergebnis**: 10/10 extrahiert (aber 2 als Formel markiert)

### 8. **de_minimis_beihilfe** ⭐⭐⭐⭐⭐
- **Vorkommen**: 31% (643 Programme)
- **Eindeutigkeit**: 10/10 - Boolean, EU-Verordnung 1407/2013
- **Diskriminierung**: HOCH - Begrenzt Gesamtbeihilfe auf €200k/3 Jahre
- **Benutzer kann beantworten**: 80% - "Haben Sie in den letzten 3 Jahren andere Förderungen erhalten?"
- **Extraktionsquelle**: `richtlinie` ("De-minimis", "1407/2013")
- **Schwammigkeit**: 0% - EU-Verordnung ist eindeutig
- **KEEP**: ✅ Wichtig für Mehrfachförderung

---

## TIER A: Sehr Eindeutig (behalten mit kleinen Einschränkungen)

### 9. **antragsberechtigte** ⭐⭐⭐⭐
- **Vorkommen**: 99% (2.443 Programme)
- **Eindeutigkeit**: 7/10 - Liste klar, aber oft zu generisch
- **Diskriminierung**: SEHR HOCH (40-70%)
- **Benutzer kann beantworten**: 90% - "Sind Sie Unternehmen, Kommune, Privatperson?"
- **Extraktionsquelle**: `foerderberechtigte` + `rechtliche_voraussetzungen`
- **Schwammigkeit**: 30% - "Unternehmen" zu breit (inkl. Landwirtschaft, Projektgesellschaften)
- **PROBLEM**: Feld `foerderberechtigte` oft ungenau (Testfall: 2/10 Programme falsch)
- **KEEP**: ✅ Aber aus Text extrahieren, nicht aus Feld verlassen

### 10. **kmu_erforderlich** ⭐⭐⭐⭐
- **Vorkommen**: 21% (430 Programme)
- **Eindeutigkeit**: 8/10 - EU-Definition klar (250 MA, €50M), aber Ausnahmen
- **Diskriminierung**: HOCH - Schließt Großunternehmen aus
- **Benutzer kann beantworten**: 90% - "Weniger als 250 Mitarbeiter?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("KMU", "kleine und mittlere")
- **Schwammigkeit**: 20% - Manche Programme erweitern Definition (750 MA / €200M gefunden!)
- **KEEP**: ✅ Wichtig, aber zusätzlich explizite Limits extrahieren

### 11. **antragsfrist** ⭐⭐⭐⭐
- **Vorkommen**: 19% (239 mit Datum, 136 "laufend")
- **Eindeutigkeit**: 9/10 - Datum oder "laufend"
- **Diskriminierung**: SEHR HOCH - Eliminiert verpasste Fristen
- **Benutzer kann beantworten**: 100% - System prüft gegen heute
- **Extraktionsquelle**: `volltext`, `rechtliche_voraussetzungen` ("Antragsfrist", "Stichtag")
- **Schwammigkeit**: 10% - Manchmal "jährlich zum 31.03" (Wiederholung)
- **KEEP**: ✅ Kritisch
- **Test-Ergebnis**: 7/10 gefunden (70%)

### 12. **mitarbeiter_limit_max** ⭐⭐⭐⭐
- **Vorkommen**: 1% explizit (23), 21% implizit via KMU (430)
- **Eindeutigkeit**: 10/10 - Numerischer Wert
- **Diskriminierung**: SEHR HOCH wenn vorhanden
- **Benutzer kann beantworten**: 100% - "Wie viele Mitarbeiter haben Sie?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("maximal X Beschäftigte")
- **Schwammigkeit**: 0%
- **KEEP**: ✅ Harte Grenze
- **Test-Ergebnis**: 1/10 gefunden (750 MA - erweiterte KMU-Definition)

### 13. **umsatz_limit_max_eur** ⭐⭐⭐⭐
- **Vorkommen**: 3% explizit (61), 21% implizit via KMU
- **Eindeutigkeit**: 10/10 - Numerischer Wert in EUR
- **Diskriminierung**: SEHR HOCH wenn vorhanden
- **Benutzer kann beantworten**: 100% - "Wie hoch ist Ihr Jahresumsatz?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("Jahresumsatz höchstens EUR X")
- **Schwammigkeit**: 0%
- **KEEP**: ✅ Harte Grenze
- **Test-Ergebnis**: 1/10 gefunden (€200M - erweiterte KMU-Definition)

### 14. **unternehmensalter_max_jahre** ⭐⭐⭐⭐
- **Vorkommen**: 2% (36 Programme)
- **Eindeutigkeit**: 10/10 - Numerischer Wert in Jahren
- **Diskriminierung**: SEHR HOCH wenn vorhanden (z.B. nur <3 Jahre)
- **Benutzer kann beantworten**: 100% - "Wann wurde Ihr Unternehmen gegründet?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("nicht länger als X Jahre")
- **Schwammigkeit**: 0%
- **KEEP**: ✅ Harte Grenze für Gründungsförderungen
- **Test-Ergebnis**: 0/10 gefunden (selten, wie erwartet)

---

## TIER B: Eindeutig aber niedriger Mehrwert (behalten, niedrige Priorität)

### 15. **foerderbetrag_min_eur** ⭐⭐⭐⭐
- **Vorkommen**: 53% erwähnen Beträge
- **Eindeutigkeit**: 8/10 - Numerisch, aber oft implizit
- **Diskriminierung**: MITTEL - Viele User brauchen Minimum nicht
- **Benutzer kann beantworten**: 100%
- **Extraktionsquelle**: `volltext` ("mindestens EUR X", "ab EUR X")
- **Schwammigkeit**: 20% - Oft nicht explizit genannt
- **KEEP**: ✅ Nützlich aber nicht kritisch
- **Test-Ergebnis**: 5/10 gefunden (€500k!, €50k, €5k, €2k)

### 16. **foerdersatz_prozent** ⭐⭐⭐⭐
- **Vorkommen**: 69% erwähnen Prozentsätze (1.401 Programme)
- **Eindeutigkeit**: 7/10 - Numerisch, aber oft Range (40-100%)
- **Diskriminierung**: MITTEL - Zeigt Eigenanteil
- **Benutzer kann beantworten**: 80% - "Können Sie 20-50% selbst finanzieren?"
- **Extraktionsquelle**: `volltext` ("X% der förderfähigen Kosten")
- **Schwammigkeit**: 30% - Oft komplexe Formeln oder Ranges
- **KEEP**: ✅ Aber Schema anpassen für Ranges
- **Test-Ergebnis**: 8/10 extrahiert, 2/10 zu komplex (null gesetzt)

### 17. **antrag_vor_massnahmenbeginn** ⭐⭐⭐⭐
- **Vorkommen**: 41% (844 Programme)
- **Eindeutigkeit**: 8/10 - Boolean, aber manchmal Ausnahmen
- **Diskriminierung**: NIEDRIG - Informativ, kein Filter (User startet eh selten vor Antrag)
- **Benutzer kann beantworten**: 100% - "Haben Sie schon begonnen?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("vor Beginn", "vorzeitiger Maßnahmenbeginn")
- **Schwammigkeit**: 20% - Ausnahmen möglich (Hochwasser: retroaktiv!)
- **KEEP**: ✅ Wichtige Info, aber kein harter Filter
- **Test-Ergebnis**: 10/10 erkannt (1 Ausnahme korrekt als false)

### 18. **investition_in_deutschland_erforderlich** ⭐⭐⭐⭐
- **Vorkommen**: 1.9% (38 Programme)
- **Eindeutigkeit**: 9/10 - Boolean, meist klar
- **Diskriminierung**: HOCH für bundesweite Programme (Nuance!)
- **Benutzer kann beantworten**: 100% - "Investieren Sie in Deutschland?"
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("Investition.*Deutschland", "Betriebsstätte.*Deutschland")
- **Schwammigkeit**: 10% - Manchmal implizit
- **KEEP**: ✅ Wichtig für bundesweite Programme mit DE-Anforderung
- **Test-Ergebnis**: 5/10 gefunden (gut!)

---

## TIER C: Mäßig Eindeutig (kritisch prüfen)

### 19. **gruendungsfoerdernd** ⭐⭐⭐
- **Vorkommen**: 9% (184 Programme)
- **Eindeutigkeit**: 6/10 - Subjektive Interpretation
- **Diskriminierung**: MITTEL - Hilft Gründern
- **Benutzer kann beantworten**: 70% - "Gründung" klar, aber wann ist Programm "gründungsfördernd"?
- **Extraktionsquelle**: `rechtliche_voraussetzungen` ("Existenzgründ", "Gründung", "Start-up")
- **Schwammigkeit**: 40% - Was zählt als "gründungsfördernd"?
  - Explizit für Gründer? (klar)
  - Erlaubt Gründer? (schwammig)
  - Bevorzugt Gründer? (interpretativ)
- **PROBLEM**: Inkonsistente Anwendung möglich
- **KEEP**: ⚠️ Mit klarer Definition: "Programm richtet sich EXPLIZIT an Gründer"
- **Test-Ergebnis**: 10/10 extrahiert, aber Definition unklar

### 20. **foerderbetrag_ist_formel** ⭐⭐⭐
- **Vorkommen**: ~20% (geschätzt)
- **Eindeutigkeit**: 5/10 - Was ist "Formel"?
- **Diskriminierung**: NIEDRIG - Informativ, kein Filter
- **Benutzer kann beantworten**: 0% - User interessiert finaler Betrag, nicht Berechnungsart
- **Extraktionsquelle**: `volltext` (komplex)
- **Schwammigkeit**: 50% - Wann ist etwas "Formel" vs. "einfacher Betrag"?
  - €1000 + €25/Teilnehmer = Formel? (Ja)
  - €10k-€50k Range = Formel? (Nein)
  - 40% der Kosten = Formel? (Nein, Prozentsatz)
- **KEEP**: ⚠️ Nur als Metadaten-Flag, nicht als Filter
- **Test-Ergebnis**: Hilft bei Interpretation, aber User-facing-Wert niedrig

---

## TIER D: Schwammig (kritisch überdenken oder eliminieren)

### 21. **programm_laufzeit_bis** ⭐⭐
- **Vorkommen**: 1% (26 Programme)
- **Eindeutigkeit**: 7/10 - Datum/Jahr, aber was bedeutet es?
- **Diskriminierung**: NIEDRIG - Meist informativ
- **Benutzer kann beantworten**: 50% - "Programm läuft bis X" != "Antragsfrist bis X"
- **Extraktionsquelle**: `volltext` ("Programm bis 2030", "Mittel verfügbar bis")
- **Schwammigkeit**: 50% - Verwechslungsgefahr mit Antragsfrist oder Richtliniengültigkeit
- **PROBLEM**: Was heißt "Programm läuft bis 2030"?
  - Mittel erschöpft 2030? (möglich)
  - Kann bis 2030 beantragen? (unklar)
  - Richtlinie gilt bis 2030? (dann besser in richtlinie_gueltigkeit_bis)
- **KEEP**: ⚠️ Nur wenn klar abgegrenzt von anderen Temporal-Feldern
- **Test-Ergebnis**: 2/10 gefunden (selten, unklar)

### 22. **foerdersatz_range** 🆕 (Vorschlag aus Test)
- **Vorkommen**: ~10% (geschätzt aus Test: 2/10 hatten Ranges)
- **Eindeutigkeit**: 6/10 - {min: 40, max: 100} klar, aber was gilt für User?
- **Diskriminierung**: MITTEL
- **Benutzer kann beantworten**: 60% - "Ich bekomme 40-100%"... aber was genau?
- **Schwammigkeit**: 40% - Wovon hängt es ab? (Unternehmenstyp, Region, Fördergegenstand)
- **KEEP**: ⚠️ Besser als `foerdersatz_prozent: null`, aber User braucht Kontext
- **Empfehlung**: Nur wenn Bedingungen mit extrahiert werden

### 23. **sektor_einschraenkung** 🆕 (Vorschlag aus Test)
- **Vorkommen**: ~5% (geschätzt: Landwirtschaft-nur, etc.)
- **Eindeutigkeit**: 7/10 - Array von Sektoren
- **Diskriminierung**: HOCH wenn vorhanden
- **Benutzer kann beantworten**: 90% - "Mein Sektor?"
- **Schwammigkeit**: 30% - Wie granular? (Landwirtschaft vs. Milchwirtschaft vs. Bio-Milch)
- **KEEP**: ⚠️ Nur wenn klare Taxonomie (z.B. NACE-Codes oder Top-Level-Sektoren)
- **Empfehlung**: Warten auf mehr Daten, nicht in v3.0

### 24. **antragsfrist_typ** 🆕 (Vorschlag aus Test)
- **Vorkommen**: 19% (laufend=7%, Datum=12%)
- **Eindeutigkeit**: 8/10 - Enum: 'einmalig' | 'jaehrlich' | 'laufend'
- **Diskriminierung**: NIEDRIG - Informativ
- **Benutzer kann beantworten**: 100% - System prüft
- **Schwammigkeit**: 20% - "Jährlich" = mehrfach beantragbar oder nur 1x pro Jahr?
- **KEEP**: ✅ Gute Ergänzung zu `antragsfrist`
- **Empfehlung**: Hinzufügen in v3.0

---

## Zusammenfassung: KEEP vs. DROP

### ✅ **DEFINITIV BEHALTEN (18 Heuristiken)**

**Tier S - Perfekt (8):**
1. foerdergebiet
2. foerderart
3. richtlinie_gueltigkeit_bis ⭐ NEU
4. ausschluss_unternehmen_in_schwierigkeiten
5. agvo_sektorausschluss
6. sicherheiten_erforderlich
7. foerderbetrag_max_eur
8. de_minimis_beihilfe

**Tier A - Sehr gut (7):**
9. antragsberechtigte (mit Textextraktion, nicht Feld)
10. kmu_erforderlich
11. antragsfrist
12. mitarbeiter_limit_max
13. umsatz_limit_max_eur
14. unternehmensalter_max_jahre

**Tier B - Nützlich (3):**
15. foerderbetrag_min_eur
16. foerdersatz_prozent (mit Range-Support)
17. antrag_vor_massnahmenbeginn
18. investition_in_deutschland_erforderlich

### ⚠️ **MIT EINSCHRÄNKUNGEN (3 Heuristiken)**

19. **gruendungsfoerdernd** - Nur mit klarer Definition ("EXPLIZIT für Gründer")
20. **foerderbetrag_ist_formel** - Nur als Metadaten, nicht User-facing
21. **antragsfrist_typ** 🆕 - Gute Ergänzung, hinzufügen

### ❌ **KRITISCH ÜBERDENKEN (2 Heuristiken)**

22. **programm_laufzeit_bis** - Zu schwammig, Verwechslungsgefahr, DROP oder präzisieren
23. **sektor_einschraenkung** 🆕 - Warten auf mehr Daten, nicht jetzt

---

## Empfehlung für v3.0

### ✅ Hinzufügen:
1. `antragsfrist_typ: 'einmalig' | 'jaehrlich' | 'laufend'`
2. `foerdersatz_min_prozent` + `foerdersatz_max_prozent` (statt einzelner Wert)

### 🔧 Präzisieren:
3. `gruendungsfoerdernd` → Definition: "Programm richtet sich EXPLIZIT an Existenzgründer (im Text genannt)"
4. `antragsberechtigte` → Immer aus Text extrahieren, nicht Feld `foerderberechtigte` vertrauen

### ❌ Entfernen oder auf "nice to have" setzen:
5. `programm_laufzeit_bis` → Nur extrahieren wenn KLAR unterscheidbar von `richtlinie_gueltigkeit_bis`
6. `foerderbetrag_ist_formel` → Nur als Metadaten-Flag, nicht in User-Filter

### 📊 Finale Liste: **20 Heuristiken** (statt 23)
- 8 Tier S (perfekt)
- 7 Tier A (sehr gut)
- 4 Tier B (nützlich)
- 1 Tier C (präzisiert: gruendungsfoerdernd)

---

## Statistik

**Gesamtzahl Heuristiken geprüft**: 24
- ✅ Definitiv behalten: 18 (75%)
- ⚠️ Mit Anpassung: 3 (12.5%)
- ❌ Streichen/Verschieben: 3 (12.5%)

**Durchschnittliche Eindeutigkeit**: 8.2/10
**Durchschnittliche Diskriminierungskraft**: Hoch

**Schwammigkeits-Schwelle überschritten (>40%)**:
- gruendungsfoerdernd (40%)
- programm_laufzeit_bis (50%)
- foerderbetrag_ist_formel (50%)

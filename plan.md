# Subsidy4U - German Fördermittel Assistant

## Project Overview

**Problem**: German companies and startups struggle to navigate 2,000+ subsidy programs (Fördermittel) due to overwhelming complexity and fragmented information.

**Solution**: An AI-powered subsidy assistant that:
- Extracts company details from websites or documents (HR-Auszug)
- Guides users through conversational filtering
- Uses tool-calling to progressively narrow down relevant programs
- Provides transparent, visual feedback on filtering decisions
- Delivers a curated list of eligible subsidy programs with eligibility details

---

## Architecture

### Tech Stack

**Frontend**
- Next.js 15 (App Router)
- AI SDK v5 (Vercel)
- TailwindCSS + shadcn/ui
- Framer Motion (animations)
- TypeScript

**Backend**
- Supabase (PostgreSQL + pgvector)
- Edge Functions (tool execution)
- Row Level Security for multi-tenancy (future)

**Data Pipeline**
- Playwright (web scraping)
- Custom Browser Automation MCP Server
- Python/Node.js scraper scripts

**AI/LLM**
- OpenAI GPT-4 (or Claude) via AI SDK
- Tool calling for filter application
- Embeddings for semantic search (optional enhancement)

---

## Core Features

### 1. Split-Screen Interface

**Left Panel: Conversational Assistant**
- AI SDK v5 chat interface
- Message history
- Tool call transparency (show what the assistant is doing)
- Company info input (URL or file upload)

**Right Panel: Live Visualization**
- Program cards with status indicators:
  - ✅ Eligible / Likely match
  - ⚠️ Partially eligible / Needs review
  - ❌ Filtered out / Not applicable
- Real-time filtering animations (fade out, slide, etc.)
- Progress bar (2,000 → 150 → 12 programs)
- Filter breadcrumbs (active criteria)

### 2. AI Assistant Capabilities

**Tools Available to Assistant:**
- `extract_company_info(url_or_document)` - Parse website or upload
- `apply_filters(criteria)` - Filter by location, size, type, industry, etc.
- `get_program_details(program_id)` - Fetch full description + legal requirements
- `check_eligibility(program_id, company_profile)` - Match company against requirements
- `search_programs(semantic_query)` - Natural language search (optional)
- `rank_programs(filtered_list)` - Score by relevance and eligibility likelihood

**Conversation Flow:**
1. User provides company info (URL/document/manual input)
2. Assistant extracts key details (location, size, industry, stage, etc.)
3. Assistant asks clarifying questions (funding needs, project type, etc.)
4. Assistant applies filters progressively using tools
5. Assistant reviews detailed requirements for top candidates
6. Assistant presents final curated list with rationale

### 3. Data Model

**Subsidy Program Schema:**
```typescript
interface SubsidyProgram {
  id: string;
  title: string;
  description: string;
  url: string;
  
  // Filter attributes
  region: string[]; // bundesweit, Baden-Württemberg, etc.
  programType: string[]; // Zuschuss, Darlehen, Bürgschaft, etc.
  companySize: string[]; // kleine, mittlere, große Unternehmen
  industry: string[]; // Branchen
  fundingStage: string[]; // Gründung, Wachstum, Innovation, etc.
  amountRange?: { min?: number; max?: number };
  
  // Detailed info
  legalRequirements: string; // Extracted from dedicated page
  eligibilityCriteria: string[];
  applicationDeadline?: string;
  contactInfo?: string;
  
  // Metadata
  lastUpdated: Date;
  source: string;
  scrapedAt: Date;
}
```

**Company Profile Schema:**
```typescript
interface CompanyProfile {
  name: string;
  website?: string;
  location: string; // Bundesland
  size: 'small' | 'medium' | 'large'; // based on employees/revenue
  industry: string[];
  foundingYear?: number;
  fundingStage?: string;
  projectDescription?: string;
  
  // Extracted attributes
  employees?: number;
  revenue?: number;
  legalForm?: string; // GmbH, AG, etc.
}
```

---

## Implementation Phases

### Phase 0: Reconnaissance & Setup
**Goal**: Understand data source and set up infrastructure

**Tasks**:
- [ ] Inspect foerderdatenbank.de structure (DOM, API, pagination)
- [ ] Initialize Next.js + Supabase project
- [ ] Set up database schema
- [ ] Create project repository structure

**Deliverables**:
- Database schema
- Scraping strategy document
- Project scaffolding

**Duration**: 1-2 days

---

### Phase 1: Data Scraping
**Goal**: Extract all ~2,000 subsidy programs with metadata

**Tasks**:
- [ ] Build browser automation MCP server (see browser-mcp.md)
- [ ] Write Playwright scraper for foerderdatenbank.de
  - Extract program list with pagination
  - Extract detailed pages (overview, legal requirements)
  - Handle rate limiting and retries
- [ ] Parse and structure data
- [ ] Validate data quality (missing fields, duplicates, etc.)
- [ ] Load data into Supabase

**Deliverables**:
- Scraper script (Python or Node.js)
- Cleaned dataset in PostgreSQL
- Data quality report

**Duration**: 3-5 days

**Notes**:
- Respect rate limits (await official API response from ministry)
- Run scraper during off-peak hours
- Consider using proxy rotation if needed
- Store raw HTML as backup for re-parsing

---

### Phase 2: Backend API & Tools
**Goal**: Build tool infrastructure for AI assistant

**Tasks**:
- [ ] Implement filter API endpoints
  - `POST /api/filters` - Apply filter criteria
  - `GET /api/programs/:id` - Get program details
  - `POST /api/eligibility-check` - Match company vs program
- [ ] Build company info extraction
  - Website scraper (basic metadata)
  - Document parser for HR-Auszug (OCR if needed)
- [ ] Create AI SDK tool definitions
- [ ] Implement ranking/scoring logic
- [ ] Add semantic search (optional: embed descriptions, use pgvector)

**Deliverables**:
- API routes
- Tool definitions for AI SDK
- Company extractor utilities

**Duration**: 3-4 days

---

### Phase 3: Frontend - Chat Interface
**Goal**: Build left-panel conversational assistant

**Tasks**:
- [ ] Set up AI SDK v5 chat UI
- [ ] Implement tool calling with streaming
- [ ] Show tool execution status (loading states)
- [ ] Handle company info input (URL field, file upload)
- [ ] Display conversation history with tool transparency
- [ ] Error handling and retry logic

**Deliverables**:
- Functional chat interface
- Tool integration with backend

**Duration**: 2-3 days

---

### Phase 4: Frontend - Visualization Panel
**Goal**: Build right-panel live filtering visualization

**Tasks**:
- [ ] Design program card component
  - Title, description preview
  - Status badge (eligible/maybe/filtered)
  - Quick actions (view details, save)
- [ ] Implement grid layout with animations
  - Fade out filtered programs
  - Highlight newly matched programs
  - Smooth transitions
- [ ] Add filter breadcrumbs
- [ ] Add progress indicator (program count)
- [ ] Implement detail modal/drawer
- [ ] Sync state with chat (listen to tool calls)

**Deliverables**:
- Visualization panel UI
- Real-time synchronization with assistant

**Duration**: 3-4 days

---

### Phase 5: Integration & Polish
**Goal**: Connect all components and refine UX

**Tasks**:
- [ ] Connect chat tools to visualization updates
- [ ] Implement state management (Zustand or React Context)
- [ ] Add loading states throughout
- [ ] Implement error boundaries
- [ ] Add toast notifications for key events
- [ ] Optimize performance (virtualization for large lists)
- [ ] Mobile responsiveness (optional for MVP)
- [ ] Add analytics (PostHog or similar)

**Deliverables**:
- Fully integrated application
- Polished user experience

**Duration**: 2-3 days

---

### Phase 6: Testing & Deployment
**Goal**: Validate end-to-end flow and launch

**Tasks**:
- [ ] End-to-end testing with real company examples
- [ ] Test edge cases (no matches, ambiguous criteria, etc.)
- [ ] Load testing (if expecting traffic)
- [ ] Deploy to Vercel + Supabase
- [ ] Set up monitoring (Sentry for errors, logs)
- [ ] Create demo video/walkthrough
- [ ] Soft launch to beta testers

**Deliverables**:
- Deployed application
- Test reports
- User documentation

**Duration**: 2-3 days

---

## Data Source Details

### Foerderdatenbank.de Structure

**Base URL**: `https://www.foerderdatenbank.de`

**Search Endpoint**: 
```
/SiteGlobals/FDB/Forms/Suche/Startseitensuche_Formular.html?filterCategories=FundingProgram&submit=Suchen
```

**Known Filter Parameters** (from URL inspection):
- `cl2Processes_Foerdergebiet` - Region (bundesweit, bayern, etc.)
- `sortOrder` - Sorting (title_text_sort, dateOfIssue_dt)
- Likely more filters for program type, company size (TBD during scraping)

**Program Count**: ~2,000+ (exact count varies by region filter)

**Key Pages to Scrape**:
1. **Search results** - List of programs with basic info
2. **Program overview** - Detailed description per program
3. **Legal requirements** - Eligibility criteria (mentioned by user)

**Scraping Challenges**:
- Pagination mechanism (infinite scroll? page numbers?)
- Dynamic content loading (JavaScript rendering)
- Rate limiting / bot detection
- Data consistency (fields not always present)

---

## Open Questions / Future Enhancements

### Immediate Questions:
- [ ] Does foerderdatenbank.de have an API? (awaiting ministry response)
- [ ] What's the pagination structure?
- [ ] Are there hidden data attributes we can leverage?
- [ ] How often do programs change? (determines refresh cadence)

### Future Features:
- **Saved searches**: User accounts to save company profiles + results
- **Email alerts**: Notify when new matching programs are added
- **Application tracking**: Track application status for each program
- **Multi-company support**: Compare eligibility across multiple companies
- **Advanced eligibility scoring**: ML model trained on successful applications
- **Document generation**: Auto-fill application forms with company data
- **Collaboration**: Share results with team members
- **Historical analysis**: Track which programs are most popular/successful

### Technical Debt to Manage:
- **Data staleness**: Implement automated scraper refresh (weekly? monthly?)
- **Semantic search**: Add embeddings for better matching (Phase 2 enhancement)
- **Caching**: Cache filter results to reduce database load
- **Testing**: Add E2E tests with Playwright
- **Internationalization**: Support English interface (many startups are international)

---

## Success Metrics

**MVP Goals**:
- Successfully scrape and structure 2,000+ programs
- Filter from 2,000 → <20 programs in <3 minutes
- 80%+ user satisfaction with final recommendations
- <5% false negatives (eligible programs incorrectly filtered out)

**Technical Metrics**:
- Page load time <2s
- Tool call latency <1s per filter operation
- Uptime >99%
- Zero data breaches

---

## Timeline Estimate

**Optimistic (full-time focus)**: 2-3 weeks
**Realistic (part-time)**: 4-6 weeks
**With delays (scraping issues, scope creep)**: 6-8 weeks

**Critical Path**:
1. Scraping (blocks everything)
2. Data modeling (blocks backend)
3. Tool APIs (blocks frontend integration)
4. Chat interface (blocks user testing)

---

## Risk Mitigation

### Risk: Website blocks scraper
**Mitigation**: 
- Use respectful rate limiting
- Rotate user agents / proxies
- Fall back to manual data collection for small sample
- Pursue official API access

### Risk: Data quality issues
**Mitigation**:
- Validate during scraping
- Manual spot-checks
- User feedback mechanism to report errors

### Risk: AI misinterprets eligibility
**Mitigation**:
- Always show "likely eligible" not "definitely eligible"
- Provide links to official sources
- Encourage users to verify
- Improve prompts with few-shot examples

### Risk: Scope creep
**Mitigation**:
- Strict MVP definition
- Feature backlog for post-launch
- Regular check-ins on priorities

---

## Next Steps

1. ✅ Create plan.md (this document)
2. ⏳ Create browser-mcp.md (MCP tool specification)
3. Finalize scraping approach (browser MCP vs. quick script)
4. Begin Phase 0 reconnaissance
5. Start development

---

**Last Updated**: 2025-09-30
**Project Status**: Planning Phase
**Team**: Solo (with AI pair programming)

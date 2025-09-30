# Quick Setup Guide

## 1. Environment Variables

Create `/Users/a1984/subsidy4u/frontend/.env.local`:

```env
# Copy from your scraper project
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Get from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...
```

## 2. Start the App

```bash
cd /Users/a1984/subsidy4u/frontend
npm run dev
```

Visit: http://localhost:3000

## 3. Test the Flow

1. **Start a conversation**: "I run a kleine Unternehmen in Bayern focused on software development"
2. **AI will extract** company info using the `extract_company_info` tool
3. **AI will filter** programs using `apply_filters` with binary eligibility
4. **Watch the visualization** as programs appear on the right panel

## 4. Expected Behavior

- **Left Panel**: Chat messages with tool call indicators
- **Right Panel**: Program cards with status badges (✅ Eligible, ❌ Filtered, ⏳ Analyzing)
- **Stats Bar**: Shows counts of eligible/filtered programs
- **Animations**: Cards fade in/out as filters are applied

## Known Issues

- TypeScript warning in `chat/route.ts` (lines 136-137) - doesn't affect functionality, will resolve after first successful query returns typed data from Supabase

## Next Steps

1. Test with real company data
2. Refine AI prompts based on filtering accuracy
3. Add program detail modal/drawer
4. Improve filter visualization (breadcrumbs)
5. Add export functionality (PDF/CSV)

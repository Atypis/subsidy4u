# Subsidy4U Frontend

AI-powered German subsidy program finder with split-screen interface and conversational AI assistant.

## Tech Stack

- **Next.js 15** (App Router with Turbopack)
- **AI SDK v5** (Vercel) with Claude 4.5 Sonnet
- **Supabase** (PostgreSQL database)
- **TailwindCSS** + Framer Motion
- **TypeScript**

## Features

- 🤖 **AI Assistant**: Conversational interface powered by Claude 4.5 Sonnet
- 🎯 **Binary Filtering**: Strong heuristic-based eligibility checking
- 📊 **Live Visualization**: Real-time program filtering with animations
- 🔍 **2000+ Programs**: Access to complete German subsidy database
- ⚡ **Tool Calling**: Progressive filtering with transparent AI reasoning

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # AI SDK streaming endpoint
│   │   ├── filters/route.ts     # Filter application
│   │   └── programs/route.ts    # Program fetching
│   ├── layout.tsx
│   └── page.tsx                 # Main split-screen interface
├── components/
│   ├── chat/
│   │   └── chat-interface.tsx   # Chat UI with AI SDK
│   └── programs/
│       ├── program-card.tsx     # Program card component
│       └── program-grid.tsx     # Grid with animations
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # Utilities
├── store/
│   └── app-store.ts             # Zustand state management
└── types/
    ├── database.ts              # Supabase types
    └── index.ts                 # App types
```

## AI Tools

The assistant has access to these tools:

1. **extract_company_info**: Extract company details from text/URL
2. **apply_filters**: Apply binary filters to programs
3. **get_program_details**: Fetch full program information
4. **check_eligibility**: Check company vs program requirements

## Filtering Logic

Binary eligibility model (no percentage scoring):
- ✅ **Eligible**: Matches ALL required criteria
- ❌ **Not Eligible**: Fails at least one criterion
- ⏳ **Analyzing**: Currently being evaluated

Key criteria:
- Region (bundesweit or matching Bundesland)
- Company size (klein/mittel/groß)
- Funding type (Zuschuss, Darlehen, etc.)
- Industry sector

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

Deploy to Vercel with automatic configuration detection.

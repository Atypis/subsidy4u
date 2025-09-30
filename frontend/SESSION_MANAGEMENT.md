# Session Management

## Features

### New Session Button
- Located in header (top right)
- Icon: Plus (+) 
- Text: "New Session"
- Minimal border styling

### Behavior

**Empty Chat:**
- Click → Immediately starts fresh session
- No confirmation needed

**Active Chat:**
- Click → Shows confirmation dialog
- "Start a new session? Current conversation will be lost."
- Cancel → Keeps current session
- OK → Clears everything and starts fresh

### What Gets Reset

On new session:
1. ✅ Chat messages cleared
2. ✅ Program list cleared
3. ✅ Company profile reset
4. ✅ Active filters reset
5. ✅ Filter history cleared
6. ✅ Selected program reset
7. ✅ UI state reset

### How It Works

**Key-based remounting:**
```tsx
<ChatInterface key={`chat-${sessionKey}`} />
<ProgramGrid key={`grid-${sessionKey}`} />
```

When session key changes:
- React unmounts old components
- Fresh instances mount with clean state
- AI SDK chat instance resets
- No residual data

### UI Flow

1. **Fresh load**: Shows empty state
2. **User chats**: Programs populate as AI filters
3. **New Session clicked**: Confirmation (if active)
4. **Confirmed**: Everything clears → back to step 1

### No Auto-Loading

- No programs load on startup
- No mocked data
- Programs only appear when AI tools return results
- Clean slate on every new session

## Technical Details

**Session Key Pattern:**
```tsx
const [sessionKey, setSessionKey] = useState(0)
const handleNewSession = () => {
  resetState()           // Clear Zustand store
  setSessionKey(prev => prev + 1)  // Force remount
}
```

**Store Reset:**
```tsx
resetState: () => set({
  messages: [],
  isLoading: false,
  companyProfile: null,
  allPrograms: [],
  visiblePrograms: [],
  activeFilters: {},
  filterHistory: [],
  selectedProgramId: null,
})
```

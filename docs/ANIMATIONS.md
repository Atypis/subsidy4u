# Filtering Animations - The "Oomph" Factor

## Philosophy
**Show the work.** Every animation communicates that real computation is happening—not just UI tricks. Minimal, purposeful, satisfying.

---

## 1. **Animated Counter** 🔢

**What:** Number counts up/down smoothly instead of jumping  
**Where:** Program count in header  
**Effect:** `917 → 856 → 734 → ... → 23`

**Why it feels good:**
- You *see* the filtering happen in real-time
- Cubic ease-out makes it satisfying (fast start, smooth finish)
- Tabular nums keep digits aligned

```tsx
const displayCount = useCounterAnimation(eligiblePrograms.length, 800ms)
```

---

## 2. **Spring Entrance** 🎯

**What:** Programs slide in from left with spring physics  
**Where:** Each program card on filter  
**Effect:** Slight bounce, staggered appearance

**Why it feels good:**
- Natural physics (spring stiffness: 300, damping: 30)
- Cards feel "real" not just appearing
- Stagger makes you see them arriving

```tsx
initial={{ opacity: 0, x: -20, scale: 0.95 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
```

---

## 3. **Slide Away Exit** 👋

**What:** Filtered-out programs slide right and fade  
**Where:** Cards leaving the list  
**Effect:** Smooth right slide + scale down

**Why it feels good:**
- Clear directionality (gone = right)
- Doesn't just vanish—you see it leave
- Makes room for new cards

```tsx
exit={{ opacity: 0, x: 20, scale: 0.9 }}
```

---

## 4. **Hover Nudge** 👆

**What:** Card slides 4px right on hover  
**Where:** Any program card  
**Effect:** Subtle right shift + arrow darkens

**Why it feels good:**
- Feels interactive without being loud
- Directional hint (click to go deeper)
- Fast transition (150ms)

```tsx
whileHover={{ x: 4 }}
```

---

## 5. **Count Scale Pulse** 💫

**What:** Number briefly scales up when changing  
**Where:** Program count header  
**Effect:** Subtle "pop" on each update

**Why it feels good:**
- Spring physics (not linear)
- Draws eye to the changing number
- Confirms "something happened"

```tsx
initial={{ scale: 0.95 }}
animate={{ scale: 1 }}
transition={{ type: "spring" }}
```

---

## 6. **Strikethrough Slide** ❌

**What:** Original count gets crossed out, slides in  
**Where:** Total count when filtered  
**Effect:** Old number slides from left with line-through

**Why it feels good:**
- Clear before/after comparison
- Strikethrough = "this is old"
- Animation makes it feel intentional

```tsx
<span className="line-through">917</span> → 23
```

---

## 7. **Filtering Overlay** 🌊

**What:** Blurred overlay with spinner during filter  
**Where:** Full program panel  
**Effect:** White 60% opacity + backdrop blur + spinner

**Why it feels good:**
- Clear "work in progress" state
- Doesn't block visibility completely
- Spinner rotation = ongoing process

```tsx
bg-white/60 backdrop-blur-sm
<Loader2 animate={{ rotate: 360 }} />
```

---

## 8. **Layout Shift** 🔄

**What:** Cards rearrange smoothly when filtered  
**Where:** Program list  
**Effect:** Cards slide to new positions

**Why it feels good:**
- Framer Motion's `layout` prop
- No jarring jumps
- Feels like physical objects moving

```tsx
<motion.div layout>
```

---

## Visual Hierarchy

**Fast (150-200ms):**
- Hover effects
- Click feedback

**Medium (300-500ms):**
- Card entrances/exits
- Number transitions

**Slow (800ms-1s):**
- Counter animation
- Complete filtering cycle

---

## The Result

When AI filters programs, you see:

1. ⏳ **Overlay appears** - "Working..."
2. 🔢 **Counter animates down** - 917 → 456 → 123 → 23
3. ❌ **Old count strikes through** - ~~917~~ 
4. 👋 **Cards slide away** - Filtered programs exit right
5. 🎯 **New cards spring in** - Eligible programs enter left
6. 💫 **Number pops** - Final count emphasizes
7. ✨ **Overlay fades** - Done!

**Total experience: ~1.5 seconds of pure satisfaction**

---

## Technical Stack

- **Framer Motion** - Layout animations, springs, gestures
- **Custom hook** - `useCounterAnimation` for number counting
- **CSS** - `backdrop-blur`, `tabular-nums` for polish
- **Spring physics** - Natural, not robotic

---

## The Jony Ive Touch

> "It's not just what it looks like and feels like. Design is how it works."

Every animation **communicates function**:
- Counter = Processing
- Slide out = Filtered away
- Spring in = New matches
- Scale pulse = Update complete

**No decoration. Only communication.**

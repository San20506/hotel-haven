# Design System: Hotel Haven — Andaman Atelier

## 1. Visual Theme & Atmosphere
A restrained, editorial Split Studio — gallery-airy (density 4), offset asymmetric (variance 7), fluid spring (motion 6). Atmosphere is warm coastal boutique: sun-bleached paper, deep atoll ink, single terracotta accent. Like a well-lit island atelier at golden hour.

## 2. Color Palette & Roles
- **Warm Paper** (#FDF9F3) — primary canvas, airy sections
- **Linen Sand** (#F5EEE4) — secondary paper for meta bars
- **Pure Surface** (#FFFFFF) — cards, elevated surfaces
- **Atoll Ink** (#0F1F23) — primary text, navbar dark, footer (Zinc-950 depth, NOT pure black)
- **Muted Reef** (#6B7B7A) — secondary text
- **Whisper Border** (rgba(15,31,35,0.08)) — 1px structural lines
- **Terracotta Tide** (#C16A33) — single accent for CTAs, focus, active (saturation ~62%, passes 1-accent rule)
- **Sea Soft** (#DDE9E6) — muted wash for icons, never for CTA

Max 1 accent. No neon/purple. No pure black.

## 3. Typography Rules
- **Display:** Fraunces (9..144, 700-900) + Instrument Serif italic for emphasis words. Track-tight (-0.04em), controlled scale via clamp(), roman only — no italic headers (Hallmark purity).
- **Body:** Geist + Sora fallback, relaxed leading 1.65, max 68ch
- **Mono:** Geist Mono for eyebrows, prices, metadata (0.68rem, 0.08em tracking, uppercase)
- **Banned:** Inter for premium display, generic Georgia/Times. Fraunces is distinctive modern serif.

## 4. Component Stylings
- **Buttons:** Pill (999px), accent fill primary with soft terracotta shadow, tactile -1px translate + scale 0.98 on active, 8 states covered. Ghost = blurred white.
- **Cards:** 20-28px radius, diffused whisper shadow (tinted to ink), 1px border. Hover lifts 4px.
- **Navbar:** N5 Floating pill — centered, blurred (18px), rounded pill, not full-width slab.
- **Inputs:** Label above (mono), 12px radius, accent focus ring 4px.

## 5. Layout Principles
Split Studio diptych — every major block alternates text/proof. Asymmetric, not centered hero. No 3-equal-cards row (bento-ish 3 but styled with varying tags). Grid via CSS Grid minmax(0,1fr), max-width 1240px. Section gaps clamp(3.5rem,7vw,6.5rem). Mobile single-column collapse <768px, overflow-x:clip.

## 6. Motion & Interaction
Spring physics stiffness 100 damping 20 => CSS cubic-bezier(0.175,0.885,0.32,1.275) for entrances, 0.22,1,0.36,1 for smooth. Staggered cascade reveals (70ms steps). All animations via transform+opacity only. Reduced-motion respects.

## 7. Anti-Patterns (Banned)
No emojis, no Inter display, no pure black, no neon glows, no oversaturated accent, no gradient header text, no custom cursors, no overlapping elements, no 3-col equal cards, no generic names, no invented metrics, no “Elevate/Seamless”, no “Scroll to explore” filler, no re-drawn browser chrome.

## Theme Factory mapping
Custom theme “Andaman Atelier” derived from Ocean Depths + Golden Hour + Forest Canopy — warm maritime boutique. Paper warm, accent terracotta, ink deep atoll.

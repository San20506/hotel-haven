# Explore: Coastal editorial visual redesign

## Problem
The SEO and copy pass improved search-facing content, but the rendered site still uses the original visual system. The user needs a visible redesign before accepting the PR.

## Current State
- Static HTML site with shared `styles.css` and page-specific markup.
- Existing layout, forms, room cards, booking widgets, and navigation must remain functional.
- Current visual system uses bright orange/blue/cyan accents, rounded cards, and dense utility styling.
- Existing fonts, photography, routes, SEO metadata, and JSON-LD are already in place.

## Alternatives
1. **Full markup rewrite** — highest visual freedom, but risks breaking booking forms, selectors, and page-specific behavior.
2. **CSS-first art direction with limited homepage hierarchy edits** — preserves behavior and routes while changing the perceived product substantially.
3. **Add a new framework** — unnecessary for a static site and adds deployment risk.

## Recommendation
Use a CSS-first coastal editorial redesign with small, targeted homepage hierarchy refinements. Establish an ink/sand/sea-glass palette, stronger typography, quieter radii, image-led cards, editorial spacing, visible booking CTAs, and responsive behavior. Preserve existing selectors, forms, routes, copy, SEO tags, and functionality unless a small semantic wrapper is required for composition.

# Design: Coastal editorial visual redesign

## Technical Approach
Use the existing static HTML and shared stylesheet. Replace the visual tokens and component rules in `styles.css`; retain existing class names so all 10 pages inherit the new design. Make only small homepage markup adjustments where the current structure prevents hierarchy improvements. Avoid external fonts, new runtime dependencies, image changes, route changes, and JavaScript rewrites.

Visual direction:
- Ink navy for text and navigation.
- Warm sand/ivory page surfaces.
- Sea-glass teal for quiet accents and utility surfaces.
- Coral used sparingly for primary actions and emphasis.
- Editorial serif-like display treatment using existing Nohemi plus system fallbacks.
- Medium radii, thin borders, soft shadows, and deliberate whitespace instead of oversized rounded cards.
- Photography gets stronger cropping, overlays, and consistent aspect ratios.

## Affected Files
- `styles.css` — shared visual system and responsive component treatment.
- `index.html` — limited composition/hierarchy refinements only if required; preserve SEO and behavior.
- `openspec/changes/coastal-editorial-redesign/*` — change documentation.

## Data Model Changes
None.

## Security Considerations
None beyond preserving existing form actions, API hooks, external links, and scripts.

## Migration & Rollback
The redesign is isolated to the feature branch and can be reverted as one commit. Existing SEO work remains in the parent commits.

## Open Questions
None blocking. Use the coastal editorial direction as the default rather than adding a decision round-trip.

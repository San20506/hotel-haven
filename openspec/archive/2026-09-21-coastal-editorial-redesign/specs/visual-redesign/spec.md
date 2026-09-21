# Visual redesign requirements

## ADDED Requirements

### Requirement: Coastal visual system
The site SHALL use a coherent coastal editorial palette with high-contrast readable text, restrained accent colors, consistent borders, and a consistent elevation model across all pages.

#### Scenario: Desktop page presentation
- GIVEN a visitor opens any HTML page at desktop width
- WHEN the page renders
- THEN the page uses the new coastal palette, typography scale, spacing rhythm, and component treatment consistently.

### Requirement: Clear booking hierarchy
The site SHALL make room discovery and booking actions visually prominent without obscuring content or changing existing destinations.

#### Scenario: Homepage conversion path
- GIVEN a visitor opens the homepage
- WHEN they scan the hero and room sections
- THEN they can identify the property, view rooms, and reach the existing booking/contact actions without searching through decorative content.

### Requirement: Responsive composition
The site SHALL remain usable at mobile widths with no horizontal overflow, clipped controls, or inaccessible navigation.

#### Scenario: Mobile navigation and cards
- GIVEN a visitor opens a page at a narrow viewport
- WHEN they open navigation or browse room/facility cards
- THEN controls remain tappable, cards stack or scroll intentionally, and text remains readable.

### Requirement: Interaction preservation
The redesign SHALL preserve existing links, form controls, IDs, room routes, booking widgets, and script hooks.

#### Scenario: Existing page behavior
- GIVEN the redesigned site is loaded
- WHEN a visitor uses navigation, room links, FAQ controls, date inputs, or booking buttons
- THEN the existing destinations and JavaScript behaviors remain available.

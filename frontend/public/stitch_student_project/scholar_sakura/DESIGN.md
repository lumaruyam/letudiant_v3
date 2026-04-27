# Design System Documentation: The Academic Pulse

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is built to transform the student experience from a static repository of information into a dynamic, editorial journey. We move away from the "standard portal" look by adopting the **Digital Curator** persona—a philosophy that blends the prestige of traditional academia with the kinetic energy of modern gamification.

Our goal is to break the rigid, "boxed-in" feeling of most educational platforms. We achieve this through **intentional asymmetry**, where content blocks vary in visual weight, and **overlapping editorial layouts** that suggest depth and discovery. The interface should feel like a premium digital magazine: authoritative enough to trust, yet vibrant enough to inspire.

---

## 2. Colors: Tonal Depth over Structural Lines
We utilize a sophisticated palette that balances the gravitas of Dark Navy with the urgency of Primary Red and the softness of Sakura-themed accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Traditional dividers create visual noise. Instead, boundaries must be defined solely through background color shifts or whitespace. 
*   *Example:* Place a `surface-container-low` (#f5f2ff) section against a `surface` (#fcf8ff) background to create a logical break without a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the Material-aligned tokens to "stack" depth:
- **Surface (#fcf8ff):** The base canvas.
- **Surface-Container-Low (#f5f2ff):** Secondary navigation or grouped content areas.
- **Surface-Container-Lowest (#ffffff):** High-priority interactive cards or input fields.
- **Inverse-Surface (#2f2e43):** Dark Navy hero sections and primary footer backgrounds.

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" appearance, floating elements (modals, dropdowns, navigation bars) must utilize **Glassmorphism**. Use `surface-tint` effects with a `backdrop-filter: blur(12px)`. Main CTAs should not be flat; use a subtle linear gradient from `primary` (#b5000b) to `primary-container` (#e30613) to give buttons a "tactile soul."

---

## 3. Typography: Editorial Authority
We lead with **Inter**, a typeface that scales from technical precision to bold editorial statements.

*   **Display (Lg/Md/Sm):** Set in Inter 800 (Extra Bold). Used for high-impact hero headings and achievement milestones. The high-contrast scale (up to 3.5rem) creates an "Academic Brutalist" vibe.
*   **Headlines & Titles:** Set in Inter 600–700. These are the anchors of your content hierarchy.
*   **Body (Lg/Md/Sm):** Set in Inter 400. Purposefully legible with generous line-heights (1.6) to ensure long-form educational content is digestible.
*   **Monospace (Courier New):** Reserved exclusively for technical codes, student IDs, or gamified "receipt" styles to provide a tactile, analog contrast to the modern UI.

---

## 4. Elevation & Depth: The Layering Principle
We reject the "drop shadow" defaults. Hierarchy is achieved through **Tonal Layering**.

- **Ambient Shadows:** When an element must float (e.g., a Sakura petal highlight or a primary notification), use a shadow with a blur of 30px–40px and an opacity of 4%-6%. The shadow color should be a tint of `on-surface` (#1a1a2e), never pure black.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in complex forms, use the `outline-variant` token (#e9bcb6) at **15% opacity**. A 100% opaque border is a failure of the design intent.
- **Layered Glass:** Use `surface-container-highest` (#e2e0fc) at 85% opacity with a blur to create "frosted glass" overlays that allow the vibrant colors (Cherry Pink, Deep Purple) to bleed through the background, softening the layout.

---

## 5. Components: Precision & Personality

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), 8px radius, white text. High-energy for "Start Exam" or "Apply."
- **Secondary:** `secondary-container` (#bbaaff) with `on-secondary-container` text. Used for "Save for Later" or "View Details."
- **Tertiary:** No background, `primary` text. Used for low-priority navigation.

### Cards & Lists
- **Rule:** Forbid divider lines. 
- **Execution:** Use the `xl` (1.5rem/24px) radius for containers. Separate list items using 12px of vertical white space or by alternating background tints between `surface-container-low` and `surface-container-lowest`.
- **Match Badges:** Use `Match Orange` (#F97316) for AI-driven recommendations.

### Chips
- **Action Chips:** Use `secondary-fixed` (#e7deff) backgrounds. These should feel like small, tactile "stamps" within the layout.
- **RGPD/Trust Badges:** Use `Success Green` (#22C55E) exclusively for trust-based indicators.

### Input Fields
- **State:** Active inputs should use a `primary` (#b5000b) ghost-border (20% opacity) and a subtle `surface-container-high` fill. Avoid heavy outlines.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Asymmetry:** Let images and text boxes overlap (e.g., a student portrait overlapping a Dark Navy hero section).
- **Use "Sakura" Tones for Softening:** Use `Light Pink Tint` (#FFF0F5) for background washes in sections that require "Friendly" or "Energetic" moods.
- **Prioritize Breathing Room:** Use the Spacing Scale to push content further apart than you think you need. High-end design lives in the gaps.

### Don't:
- **Don't Use Pure Black:** Use `Dark Navy` (#1A1A2E) for text to maintain a premium, softer contrast.
- **Don't Use Sharp Corners:** Every interactive element must respect the `md` to `xl` roundedness scale. Sharp corners are for "Standard UI"; we are "Custom Editorial."
- **Don't Use Default Shadows:** If the shadow looks like a "box shadow," it’s too heavy. It should look like a glow or a soft atmosphere.

---
*Director's Note: Every pixel should feel like it was placed by an editor, not generated by a framework. Trust the tones, kill the lines.*
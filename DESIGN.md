---
name: Capy’s Money
colors:
  surface: '#fff8f7'
  surface-dim: '#e8d6d7'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f1'
  surface-container: '#fde9ea'
  surface-container-high: '#f7e4e5'
  surface-container-highest: '#f1dedf'
  on-surface: '#23191a'
  on-surface-variant: '#514345'
  inverse-surface: '#392e2f'
  inverse-on-surface: '#ffeced'
  outline: '#837375'
  outline-variant: '#d6c2c4'
  surface-tint: '#864e5a'
  primary: '#864e5a'
  on-primary: '#ffffff'
  primary-container: '#ffb7c5'
  on-primary-container: '#7b4551'
  inverse-primary: '#fbb3c1'
  secondary: '#944652'
  on-secondary: '#ffffff'
  secondary-container: '#fe9da9'
  on-secondary-container: '#79313d'
  tertiary: '#71585c'
  on-tertiary: '#ffffff'
  tertiary-container: '#e3c2c7'
  on-tertiary-container: '#674f53'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9df'
  primary-fixed-dim: '#fbb3c1'
  on-primary-fixed: '#360c19'
  on-primary-fixed-variant: '#6b3743'
  secondary-fixed: '#ffd9dc'
  secondary-fixed-dim: '#ffb2ba'
  on-secondary-fixed: '#3e0312'
  on-secondary-fixed-variant: '#762f3b'
  tertiary-fixed: '#fcdadf'
  tertiary-fixed-dim: '#dfbfc3'
  on-tertiary-fixed: '#29161a'
  on-tertiary-fixed-variant: '#584145'
  background: '#fff8f7'
  on-background: '#23191a'
  surface-variant: '#f1dedf'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  margin-mobile: 20px
  margin-desktop: 48px
  gutter: 16px
---

## Brand & Style

The visual identity of this design system centers on radical friendliness and emotional accessibility. Finance is often associated with anxiety, sharp edges, and rigid structures; this design system subverts those tropes by utilizing a soft-modern aesthetic that feels more like a lifestyle companion than a cold utility.

The style blends elements of **Minimalism**—through its generous use of whitespace and restricted color palette—with **Tactile** softness. It aims to evoke a sense of calm, similar to the "chill" nature of a capybara. Interfaces should feel airy, optimistic, and welcoming, using organic shapes and a gentle color story to lower the user's cognitive load and heart rate during financial management.

## Colors

The palette is anchored in warmth. The primary pastel pink provides a sense of playful energy, while the soft coral serves as an active accent for calls to action and important highlights. 

Instead of traditional blacks and greys, the neutral palette utilizes deep, warm browns and soft mauves to maintain a gentle contrast. The background is a tinted off-white, preventing the "stark" clinical feeling of pure white and ensuring the UI feels cohesive and "dipped" in the brand's signature tones.

- **Primary:** Pastel Pink for main brand elements and primary actions.
- **Secondary:** Soft Coral for emphasis, alerts, and secondary interactions.
- **Tertiary:** Ultra-light pink for subtle containers and hover states.
- **Background:** A creamy, pink-tinted white for maximum softness.

## Typography

This design system utilizes **Plus Jakarta Sans** for its entire type scale. This font was chosen for its modern, geometric construction tempered by soft, rounded terminals that mirror the "bubbly" nature of the UI components.

Headlines should be bold and prominent to guide the user's eye through their financial data without feeling aggressive. Body text is set with generous line-height to ensure maximum readability, especially when viewing transaction lists or budget breakdowns. All caps should be used sparingly for labels to maintain the approachable, conversational tone of the brand.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with high internal margins. The goal is to avoid "clutter" by giving every element significant breathing room. 

A 12-column grid is used for desktop, while a simple flexible column system is used for mobile. The spacing rhythm is based on an 8px scale, but "Large" (40px) and "Extra Large" (64px) units are frequently employed between major sections to emphasize the minimalist, stress-free aesthetic. Content should feel centered and "hugged" by white space rather than pushed to the edges of the screen.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of harsh, black shadows, this design system uses extra-diffused, low-opacity shadows tinted with the primary coral or pink hues (e.g., `rgba(255, 183, 197, 0.2)`).

Depth should feel "pillowy." Components do not simply sit on the background; they appear to float slightly above it. 
- **Level 0 (Surface):** The background off-white.
- **Level 1 (Cards):** Soft white surfaces with 24px blur shadows.
- **Level 2 (Active elements):** Elements being interacted with increase their shadow spread and scale slightly (102%) to provide tactile feedback.
- **Background Blurs:** Used sparingly for overlays and navigation bars to maintain the "light as air" feeling.

## Shapes

The shape language is the most defining characteristic of this design system. It utilizes **Pill-shaped (Level 3)** roundedness to eliminate all sharp corners. 

Standard cards should use a minimum of 32px (2rem) radius, while buttons and chips should be fully pill-shaped. This extreme roundedness transforms financial charts and data tables from intimidating spreadsheets into friendly, organic visualizations. Icons should also follow this rule, using thick strokes and rounded caps.

## Components

### Buttons
Buttons are large, pill-shaped, and vertically generous. Primary buttons use a subtle gradient from the primary pink to the secondary coral. Text inside buttons is semi-bold to ensure legibility against the pastel backgrounds.

### Cards
Cards are the primary container for data. They should feature 32px corner radii, a subtle 1px border in a slightly darker pink tone (`#FFDDE2`), and a diffused shadow. Use "Inner Padding" of 24px to ensure content never feels cramped against the curved edges.

### Inputs
Search bars and text fields should be fully rounded. Instead of a bottom border, use a filled style with the tertiary light pink as the background color. The focus state should be a soft 2px glow in the primary pink.

### Playful Icons
Iconography must be "Chunky" and rounded. Use a 2.5pt stroke weight and avoid sharp 90-degree angles. Where possible, use icons with a "filled-duotone" style where one part of the icon is a solid pastel color and the other is a stroke.

### Progress Bars & Charts
Finance involves charts; in this system, bars in a bar chart are fully rounded (pills), and line charts use "smooth" Bezier curves rather than jagged points. This reinforces the "soft" brand promise across data-heavy screens.
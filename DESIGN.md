---
name: Daily Taaza
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#42493e'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#4a654f'
  on-secondary: '#ffffff'
  secondary-container: '#c9e7cc'
  on-secondary-container: '#4e6953'
  tertiary: '#672304'
  on-tertiary: '#ffffff'
  tertiary-container: '#853919'
  on-tertiary-container: '#ffaf92'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#cceacf'
  secondary-fixed-dim: '#b0ceb4'
  on-secondary-fixed: '#062010'
  on-secondary-fixed-variant: '#334d38'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370d00'
  on-tertiary-fixed-variant: '#793011'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  headline-xl:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is built on the philosophy of "From Soil to Soul." It prioritizes transparency, health, and the warmth of traditional homemade food. The visual language balances professional organic standards with the approachability of a local kitchen.

The aesthetic follows a **Modern Organic** style. It rejects the sterility of corporate health brands in favor of tactile warmth, utilizing generous whitespace to suggest "fresh air" and breathing room. The emotional response should be one of immediate trust, grounding, and nourishment. Subtle grain textures and non-perfect geometric shapes are encouraged to reflect the natural irregularities of organic produce.

## Colors

The palette is derived from a Mediterranean and South Asian earth-tone spectrum:

*   **Deep Forest Green (#2D5A27):** Used for primary actions, heavy headings, and brand-critical elements. It represents density and growth.
*   **Soft Sage Green (#8DAA91):** Used for secondary accents, icons, and supportive backgrounds. It provides a calming contrast to the deep forest green.
*   **Warm Terracotta (#D47651):** The "human" element of the brand. Used sparingly for highlights, artisanal badges, and "Buy" actions to evoke clay pots and sun-dried spices.
*   **Creamy Off-White (#FAF9F6):** The primary background color. It is softer on the eyes than pure white, reinforcing the "homemade" and "unbleached" brand narrative.

## Typography

This design system utilizes a high-contrast typographic pairing to bridge tradition and modernity. 

**Source Serif 4** provides an authoritative, literary, and sturdy feel. It should be used for all editorial content and primary headings. It anchors the brand in history and trust.

**Plus Jakarta Sans** is the functional workhorse. Its soft, rounded terminals complement the organic brand shapes while maintaining high legibility for product descriptions and navigation. 

For mobile, headlines scale down slightly but maintain their Serif character to ensure the brand voice remains prominent even on smaller screens.

## Layout & Spacing

The design system employs a **Fluid Grid** with an 8px base unit. 

*   **Desktop:** A 12-column grid with generous 64px outer margins to create a focused, editorial "magazine" feel. Gutters are kept at 24px to allow elements to breathe.
*   **Mobile:** A 4-column grid with 20px margins. 
*   **Negative Space:** Use "white space" intentionally. Vertical section padding should be aggressive (typically 80px - 120px on desktop) to signify premium quality and avoid a cluttered "discount store" look.

## Elevation & Depth

This system avoids harsh shadows or industrial depth. It uses **Tonal Layers** and **Ambient Shadows**.

*   **Surface Hierarchy:** Most content sits directly on the Creamy Off-White (#FAF9F6) base. Higher-level cards use a pure White (#FFFFFF) surface to subtly lift off the background.
*   **Soft Shadows:** Use very low-opacity, wide-diffusion shadows. For example: `0px 4px 20px rgba(45, 90, 39, 0.05)`. Note the subtle tint of Forest Green in the shadow to keep it earthy rather than grey.
*   **Glassmorphism (Limited):** Use a 12px backdrop blur with 80% opacity on navigation bars when scrolling over content to maintain a "fresh" and "light" feeling.

## Shapes

The shape language is **Soft and Rounded**. Avoid sharp 90-degree corners to maintain the approachable, organic feel. 

*   **Standard Components:** Buttons and inputs use a 0.5rem (8px) radius.
*   **Containers:** Product cards and large modules use a 1rem (16px) radius.
*   **Organic Accents:** For hero images or decorative blobs, use a "squircle" or irregular hand-drawn path rather than a perfect circle. This reinforces the "homemade" aspect of the brand.

## Components

*   **Buttons:** Primary buttons are Solid Forest Green with white text. Secondary buttons are Terracotta to signal specific actions like "Add to Cart." Both use a medium-weight Plus Jakarta Sans label.
*   **Input Fields:** Ghost-style inputs with a Soft Sage (#8DAA91) border. On focus, the border thickens and darkens to Forest Green.
*   **Cards:** Pure white background, subtle ambient shadow, and a 16px corner radius. Image containers within cards should have a 12px top-radius.
*   **Chips/Labels:** Use Soft Sage with 10% opacity for the background and Forest Green for the text. Use these for categories like "Vegan," "Gluten-Free," or "Farm-Fresh."
*   **Badges:** Use Terracotta for "Artisanal" or "Limited Batch" badges, often placed at a slight 2-3 degree tilt to give a "hand-stamped" feel.
*   **Dividers:** Use very thin (1px) lines in Soft Sage with 30% opacity, or occasionally a "wavy" line graphic to separate major sections.
# StickTheBizz: UI, Theme & Animation Guidelines

## 1. Strict Color Palette (The StickTheBizz Identity)
These four colors are the foundation of the brand. Do not introduce new shades of blue, red, or grey unless mathematically derived from these exact hex codes for opacity purposes.

*   **Backgrounds (`#F5EBDD` - Creamy Sand):** 
    *   *Usage:* Main website backgrounds, empty spaces. Prevents harsh outdoor glare.
*   **Primary Action & Highlights (`#F2765E` - Coral Punch):** 
    *   *Usage:* Primary CTA buttons ("Start Free Trial"), interactive streak flames, active toggle states, urgent notifications.
*   **Headers & Secondary Trust (`#315B8C` - Steel Blue):** 
    *   *Usage:* Navigation bars, footers, secondary buttons ("Learn More"), and dashboard headers. Instills financial trust.
*   **Text & Borders (`#413333` - Espresso Dark):** 
    *   *Usage:* All primary typography (headings, paragraphs). Replaces pure black to maintain a premium, warm feel. Use for crisp card borders.
*   **Card Surfaces (`#FFFFFF` - Pure White):** 
    *   *Usage:* Floating punch cards and interactive widgets must sit on white to contrast against the `#F5EBDD` background.

## 2. Interactive Animations (Shopify / Fydo Inspired)
Animations must make the website feel alive, premium, and interactive, but they must *never* slow down the user's phone.

### Homepage Hero & Scroll Animations
*   **Interactive Demos:** The homepage must feature a live, interactive UI element (e.g., a mock phone screen where the user can click a button to see a "Stamp Approved" animation pop up). This builds instant product understanding.
*   **Scroll-Triggered Reveals:** As the user scrolls down the page, text blocks and images should smoothly fade in and slide up (using CSS transitions or lightweight libraries like Framer Motion). 
*   **Micro-interactions:** Buttons must have a slight "scale-down" effect when clicked. Hovering over a pricing card should gently lift it and add a soft shadow.
*   **Performance Rule:** Disable heavy particle effects or continuous animations if the user has "Reduced Motion" enabled on their OS or if the network/battery is low.

## 3. Mandatory Page Structure
To ensure clean routing and separation of concerns, the website must strictly implement the following separate pages:

1.  **`/` (Homepage):** High-energy, animated hero section, interactive demo, 3-step 'How it works', and Pricing.
2.  **`/about` (About Us):** The story of StickTheBizz, our mission for local merchants, and the team.
3.  **`/pricing` (Dedicated Pricing):** Detailed breakdown of tiers, free trials, and ROI calculator.
4.  **`/support` (Customer Support):** FAQ accordions, contact form, and WhatsApp help link.
5.  **`/privacy` & `/terms`:** Standard legal text pages (text-heavy, minimal animations for fast reading).
6.  **`/merchant` (App Dashboard):** The actual software for shop owners (behind a login screen).

## 4. Mobile-First & Touch UI
*   **Touch Targets:** Every button, link, and interactive element must be at least **48px by 48px**. Indian shopkeepers using the app in a hurry must not accidentally tap the wrong button.
*   **Bottom Navigation:** On mobile screens, critical merchant actions (Scan, History, Profile) should move to a sticky bottom navigation bar for easy thumb access.
*   **Typography Scaling:** Fonts must look legible on a 5-inch screen. Do not use ultra-thin font weights.
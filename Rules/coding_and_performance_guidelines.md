# StickTheBizz: Coding & Performance Guidelines

## 1. Core Philosophy: Keep It Simple and Readable (KISS)
Our primary goal is maintainability. Future developers must be able to read this codebase like a book. Code should be written for humans first, and machines second.

### The "10 Lines over 20 Lines" Rule
*   **DO:** Write concise, direct code. If a logic block can be cleanly executed in 10 lines using built-in methods, do not write a 20-line complex custom function.
*   **DO NOT:** Write "clever" or overly complex code (like nested ternary operators) just to show off. If it takes more than 10 seconds to understand, it must be rewritten or refactored.
*   **DO NOT:** Leave unnecessary, commented-out code (dead code) in production files.
*   **DO:** Use highly descriptive variable and function names. `fetchCustomerStreak()` is infinitely better than `getData()`.

## 2. Network-Aware Loading (Mid-Network Optimization)
StickTheBizz must load blazingly fast on mid-tier mobile networks (3G/4G). We do not load the entire website at once.

### Lazy Loading & Code Splitting
*   **DO:** Implement aggressive Lazy Loading. Any image, video, or heavy interactive component that is "below the fold" (not visible on the screen immediately when the site opens) must NOT be loaded until the user scrolls down to it.
*   **DO:** Use pagination or infinite scroll for lists (e.g., transaction history, customer lists). Never fetch 1,000 records from the database if the user only needs to see 20 at a time.
*   **DO:** Use Skeleton Loaders. While the "backside part" (backend data) is loading, show a grey pulsing skeleton so the user knows the app is working, rather than a frozen screen.

## 3. Multi-Page Architecture (No Bloated SPAs)
This is a robust SaaS product, not a Single Page Application (SPA) where everything is crammed into one `index.html`. 

*   **DO:** Separate distinct sections into their own independent pages with unique URLs (e.g., `/home`, `/about`, `/privacy-policy`, `/support`, `/merchant-dashboard`).
*   **WHY:** This allows the browser to cache pages individually, drastically improves SEO (Search Engine Optimization), and prevents the user's phone from crashing by trying to load the dashboard logic while they are just trying to read the Privacy Policy.

## 4. Scalability: Preparing for Millions of Scans
To scale from 10 shops to 10,000 shops without crashing:

*   **DO:** Keep the frontend "dumb" and the backend "smart". The frontend should only display data and handle animations. All complex calculations (streak logic, anti-fraud 12 AM resets) must happen on the server/database.
*   **DO:** Index database columns correctly. If we frequently search for a user by their phone number, the `phone_number` column must be indexed.
*   **DO:** Write independent, modular components. A "Button" component should be written once and reused across the Privacy, Home, and Dashboard pages.

## 5. Summary of Coding DOs and DON'Ts

### ✅ DO (Best Practices)
- Add comments explaining *WHY* you wrote a block of code, not *WHAT* the code is (the code itself tells you what it is).
- Compress all images to WebP format before uploading.
- Handle errors gracefully. If the network fails, show a friendly message ("Oops, internet is slow!") instead of a red, technical error code.

### ❌ DO NOT (Strictly Forbidden)
- Do not use massive external libraries if a simple native HTML/JS solution exists.
- Do not repeat code (DRY principle - Don't Repeat Yourself).
- Do not write functions that do more than one thing. A function called `validateLogin()` should only validate, it should not also redirect the user and fetch their profile.
# StickTheBizz: Security, Data Privacy, and Operations Rules

## 1. Security & Anti-Spam (Protecting Your Wallet)
Since StickTheBizz uses phone numbers and potentially SMS OTPs (One Time Passwords) for logins, protecting the login route is your highest security priority.

*   **DO: Implement Strict Rate Limiting.** A single IP address or phone number must not be allowed to request an OTP more than 3 times in 5 minutes. This prevents malicious bots from draining your SMS budget.
*   **DO: Sanitize All Inputs.** Never trust data typed by a user. If a shop owner enters a custom reward name, the code must sanitize it to prevent SQL Injection or XSS (Cross-Site Scripting) attacks.
*   **DO NOT: Expose Admin Endpoints.** APIs that reset streaks or generate QR codes must be strictly protected with secure tokens (JWT). 

## 2. Data Privacy & Compliance (India DPDP Act)
Indian data privacy laws require strict handling of customer information.

*   **DO: Encrypt Sensitive Data.** Passwords (if used) must be hashed using strong algorithms like bcrypt. Never store passwords in plain text.
*   **DO NOT: Sell or Expose Customer Phone Numbers.** Shop owners can see the phone numbers of *their* customers to verify them, but this data must be locked down. A shop owner cannot export a list and sell it.
*   **DO: Implement a "Delete My Account" button.** Customers must have a clear, easy way to request the deletion of their phone number and streak history from your database to comply with privacy laws.

## 3. Analytics & Tracking (Measuring Success Safely)
You need to know how many people visit the website and click "Start Free Trial," but analytics tools can slow down the site if implemented poorly.

*   **DO: Load Analytics Asynchronously.** Tools like Google Analytics, Meta Pixels, or Mixpanel must be loaded *after* the main website has finished loading.
*   **DO NOT: Track PII (Personally Identifiable Information).** Never send a user's plain-text phone number or name to Google Analytics. Use an anonymized `user_id` instead.
*   **DO: Track Core Events.** The code must fire specific tracking events for: `trial_started`, `qr_scanned`, `reward_claimed`, and `subscription_paid`.

## 4. Testing & Quality Assurance (QA)
"It works on my computer" is not a valid excuse in this project.

*   **DO: Test on Real, Low-End Devices.** Before any major update goes live, the developer MUST test the UI on an actual budget Android phone (e.g., a 3-year-old Redmi or Samsung) on a mobile data connection, not just on a high-end MacBook simulator.
*   **DO: Write Basic Automated Tests.** Critical paths must have automated tests. For example, the function that calculates "has this user scanned today?" must have a script that tests it every time code is pushed.

## 5. SEO & Accessibility (Growing Organically)
Your website needs to be found on Google and be usable by everyone.

*   **DO: Include Dynamic Meta Tags.** Every public page (`/home`, `/about`, `/pricing`) must have proper `<title>`, `<meta description>`, and Open Graph tags so it looks beautiful when shared on WhatsApp or Twitter.
*   **DO: Use Alt Text.** Every image must have descriptive `alt` text. (e.g., `alt="Customer scanning QR code at chai stall"`).
*   **DO: Ensure High Contrast.** (Already covered by our UI rules, but strictly enforced here: text must always have a high contrast ratio against its background).
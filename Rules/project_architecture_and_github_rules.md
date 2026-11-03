# StickTheBizz: Project Architecture & Version Control

## 1. GitHub Version Control & Checkpoints
GitHub is our safety net. No code goes live to customers without passing through a structured checkpoint process.

### Branching Strategy
We will strictly follow the Feature Branch Workflow:
1.  **`main` branch:** This is the sacred, live production code. It must NEVER break. You cannot push code directly to `main`.
2.  **`dev` branch (Development):** All new features are combined here first to test how they work together.
3.  **Feature branches:** When a developer builds a new page (e.g., the Support page), they create a branch called `feature/support-page`. Once finished, it is merged into `dev`, tested, and finally pushed to `main`.

### Commit Messages
Commit messages must explain exactly what changed in simple English.
*   *Bad:* "fixed stuff", "updated code", "test"
*   *Good:* "Fix: Resolved bug where 12 AM reset was triggering at 11 PM"
*   *Good:* "Add: Created Privacy Policy page and linked it to Footer"

## 2. Standardized Folder Structure
To ensure any future developer can jump in and instantly know where things are, we will use a modern framework structure (like Next.js/React):

```text
stickthebizz/
│
├── public/                 # Static assets (Images, Lottie animations, Favicon)
│   ├── images/             # Compressed WebP images only
│   └── fonts/              # Local font files
│
├── src/                    # All application source code
│   ├── components/         # Reusable UI parts (Buttons, Cards, Navbars)
│   │   ├── ui/             # Generic elements (Button.js, Modal.js)
│   │   └── marketing/      # Homepage specific (HeroAnim.js, PricingTable.js)
│   │
│   ├── pages/              # Independent Route Pages (No SPA bloat)
│   │   ├── index.js        # Homepage
│   │   ├── about.js        # About Us page
│   │   ├── privacy.js      # Privacy Policy page
│   │   └── support.js      # Support page
│   │
│   ├── styles/             # Global CSS and Tailwind configs
│   │   └── globals.css     # Contains #F5EBDD, #F2765E, #315B8C, #413333 mapping
│   │
│   ├── utils/              # Helper functions (Date formatting, math)
│   │
│   └── lib/                # Third-party setups (Database connection, APIs)
│
├── .gitignore              # Files to hide from GitHub (node_modules, passwords)
└── README.md               # Quick start guide for new developers
```

## 3. Environment Variables (Security)
*   **Strict Rule:** NEVER hardcode passwords, API keys, or database URLs directly into the code.
*   All secrets must be stored in a `.env` file locally, which is ignored by GitHub (`.gitignore`).
*   Production variables will be set securely inside the hosting provider (e.g., Vercel, AWS).

## 4. Scaling Protocol
As StickTheBizz scales from small shops to large enterprise franchises:
*   **Database Migrations:** Any change to the database structure (adding a new column for "Franchise ID") must be done via structured migration files, keeping a historical record of database changes.
*   **Error Logging:** Implement a lightweight error tracker (like Sentry). If the website fails for a merchant, the system must silently log the exact line of code that broke and send it to our GitHub/Slack, allowing us to fix it before the merchant even complains.
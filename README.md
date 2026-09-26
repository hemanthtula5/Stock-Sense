# StockSense

StockSense is an inventory management web application built with React, Vite, and Supabase.

---

## Features

- **Inventory Tracking:** Real-time monitoring and management of stock items.
- **Authentication & Backend:** User auth and PostgreSQL database integration powered by Supabase.
- **Client-Side Routing:** Dynamic page navigation using React Router.
- **In-App Notifications:** Lightweight toast alerts via React Hot Toast[cite: 1].
- **Iconography:** UI icons provided by Phosphor Icons[cite: 1].
- **Code Quality:** Fast linting configured with Oxlint[cite: 1].

---

## Tech Stack

- **Framework:** React 19 (`react`, `react-dom`)[cite: 1]
- **Build Tool:** Vite[cite: 1]
- **Routing:** `react-router-dom`[cite: 1]
- **Backend / Database Client:** `@supabase/supabase-js`[cite: 1]
- **Toast Notifications:** `react-hot-toast`[cite: 1]
- **Icons:** `@phosphor-icons/react`[cite: 1]
- **Linter:** Oxlint[cite: 1]

---

## Project Structure

```text
stocksense/
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
└── src/
Getting Started
Prerequisites
Node.js (v18 or higher recommended)

npm, pnpm, or yarn

Installation
Clone the repository:

Bash
git clone <repository-url>
cd stocksense
Install dependencies:

Bash
npm install
Set up environment variables:

Bash
cp .env.example .env
Add your Supabase credentials to .env:

Code snippet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Available Scripts
npm run dev — Starts the Vite development server with HMR[cite: 1].

npm run build — Compiles and bundles production assets into dist/[cite: 1].

npm run preview — Previews the production build locally[cite: 1].

npm run lint — Runs Oxlint checks across the codebase[cite: 1].

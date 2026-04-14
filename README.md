# DealerPulse — Automotive Dealership Analytics

DealerPulse is a dataset-agnostic, zero-latency performance analytics dashboard built for automotive dealership networks.

Designed for executives and regional managers, it transforms raw CRM data into structured, actionable intelligence—highlighting bottlenecks, identifying top-performing representatives, and instantly surfacing pipeline risks.

**[Read the Technical Decisions & Architecture Document (DECISIONS.md)](DECISIONS.md)** for a deep dive into the engineering philosophy and product features.

---

## 🔥 Key Features

- **Executive Drill-Down Architecture:** Navigate seamlessly from Network Overview ➔ Branch Deep Dive ➔ Representative Profile.
- **Dataset-Agnostic Engine:** Upload custom dealership data. The UI automatically reads branch names, available dates, and source channels at runtime, completely avoiding hardcoded values.
- **Zero-Latency Client-Side Analytics:** Powered by Zustand and React Server Components. Overdue lead flagging, revenue aggregations, and data filtering run entirely in the browser in under ~10ms.
- **What-If Scenario Simulator:** A deterministic forecasting tool that lets executives model future revenue impact by adjusting funnel transition rates based on actual downstream data.
- **Pipeline Risk Detection:** Proactively flags and floats leads past their `expected_close_date` to the top, automatically excluding closed/won deals that are simply awaiting delivery.
- **Smart Branch Insights:** Generates clean, structured, and color-coded executive summaries programmatically (No LLM API wait times or hallucinations).

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org) + React 19
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Visualization:** [Recharts](https://recharts.org)
- **Styling:** Vanilla CSS Variables + Tailwind v4
- **Date Handling:** `date-fns` for tree-shakeable, immutable date calculations.

---

## 🚀 Getting Started

First, clone the repository and install the dependencies:

```bash
npm install
```

Next, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the live dashboard.

## 📁 Repository Structure

- `src/app/` — Next.js App Router definitions and page layouts.
- `src/components/` — Modular, reusable React components (Charts, UI elements, Layouts).
- `src/lib/` — The deterministic insight engine, calculation formulas, and data loaders.
- `src/store/` — Zustand store managing global filters and dataset state.
- `public/dealership_data.json` — The default schema-compliant dealership dataset.

---

**Author:** Prayag Raj Mathuria  
**Email:** prayag07.mathuria@gmail.com

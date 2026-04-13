# DECISIONS.md — DealerPulse

## What I Built and Why

### Product Vision
DealerPulse is structured as a **three-level drill-down tool** — from network overview, to branch deep dive, to individual rep performance. This mirrors how a CEO actually uses a dashboard:

1. **"How's my business?"** → Executive Overview
2. **"What's happening at this branch?"** → Branch Deep Dive
3. **"How is this person performing?"** → Rep View

Every page also embeds **contextual insights** right where the user is looking — not hidden in a separate analytics tab. A branch manager on the Branch page sees alerts like "8 leads going cold" right there, alongside the data that explains it.

### The Differentiator: Algorithmic Natural Language Summaries
The branch deep dive pages feature an "AI-Powered Branch Analysis" callout that generates a natural language performance summary. Example for Downtown Toyota:

> *"Downtown Toyota generated ₹10.2 Cr in revenue from 40 deliveries (41.2% conversion rate), making it the top-performing branch in the network. This outperforms the network average of 30.1%. Top lost reasons: 'Unresponsive after follow-up' (10) and 'Budget constraints' (8)..."*

This is **algorithmically generated** — not an LLM API call. The templates handle multiple edge cases (good vs bad performance, trends, comparisons) and produce deterministic, instant, free output. I chose this over an AI API because:
- No API key needed in production = recruiter can open the URL anytime without usage costs
- Instant rendering vs 1-3 second API latency
- Deterministic output = same data always shows same summary (critical for a business tool)
- Shows engineering judgment: building intelligence INTO the product, not outsourcing it

---

## Key Product Decisions and Tradeoffs

### 1. Light mode primary, not dark mode
A dealership CEO in a Chennai office wants a clean, professional tool — not a crypto trading terminal. Inspired by Stripe Dashboard and Vercel Analytics. Dark mode is available as a toggle but isn't the default.

### 2. Three focused pages instead of five
I intentionally dropped a standalone Pipeline Explorer and a separate Insights Hub. Instead:
- The **pipeline table** is embedded at the bottom of each Branch page (where a manager would actually look for it)
- **Insights/alerts** appear inline on every page, contextually — the Overview shows network-level alerts, the Branch page shows branch-specific ones
- Depth of analysis per page > number of pages

### 3. Conversion rate as the primary health metric, not just revenue
Revenue depends heavily on car mix (a Camry sale = ₹50L vs Glanza = ₹10L). Conversion rate normalizes this and shows **operational effectiveness**. A branch selling fewer Camrys isn't necessarily underperforming — but a branch losing 92% of its leads is clearly broken.

### 4. Client-side data processing, no backend
The dataset is ~600KB — well within what the browser can handle. Loading it once and computing all metrics client-side means:
- Filter changes (date range) are instant — no API round trips
- Simpler deployment (static export + JSON file)
- One less thing to break

### 5. Date range filter presets over a calendar picker
CEOs don't want to fiddle with date pickers. The presets (All / Q2 / Q3 / Q4 / H2) match how dealership leadership actually thinks about periods — quarterly and half-yearly reviews. Each button instantly re-computes every metric on the page.

---

## Interesting Patterns in the Data

### 🔴 Lakeside Toyota (Bangalore) is in crisis
- **7.6% conversion rate** vs 31-41% for every other branch
- Only **6 deliveries** out of 79 leads across 7 months
- **2-5% monthly target achievement** — never exceeded 5%
- Top lost reasons: "Not ready to purchase" (12), "Unresponsive after follow-up" (10)
- This would be the **#1 topic** at any CEO review meeting

### 📊 Walk-in is king, social media is wasteful
| Source | Conv. Rate |
|---|---|
| Walk-in | **45.7%** |
| Auto Expo | 30.2% |
| Referral | 30.1% |
| Website | 28.0% |
| Phone Enquiry | 27.8% |
| Social Media | **13.9%** |

Walk-in converts **3.3× better** than social media. If I were advising this CEO, I'd say: "Invest in your showroom experience. Your Instagram ads are generating tire-kickers, not buyers."

### 📈 Targets are aspirational, not realistic
No branch exceeds 25% unit target achievement. This is common in Indian dealership culture (targets are set very high to motivate). Rather than making every branch look like a failure, the dashboard shows **relative performance** across branches.

### 🚚 45% of deliveries had delays
72 of 160 deliveries were delayed. "Customer requested date change" (18) is the top reason — not really actionable. But "Vehicle allocation delayed from factory" (11), "Logistics delay" (11), and "Accessory fitment backlog" (10) are all supply chain issues the operations team can fix.

### 📅 December data is incomplete
Only 1 delivery from December-created leads shows in the pipeline — most leads haven't progressed through the full funnel yet. The dashboard handles this correctly by not penalizing December metrics.

---

## What I'd Build Next With More Time

1. **Email/Slack alerts** — Automated notifications when leads go cold (no activity in 5+ days) or when a branch falls below targets
2. **What-if scenarios** — "If we improve test drive → order conversion by 10%, what's the revenue impact?" with sliders
3. **Mobile-optimized view** — The dashboard is responsive on tablets, but a dedicated mobile view for managers checking on their phones would be better
4. **Real-time data connection** — Replace static JSON with a live database + webhooks for real-time lead updates
5. **Comparative branch analytics** — Radar chart overlaying two branches to compare strengths/weaknesses
6. **CSV/PDF export** — Let managers export specific views for offline review or board presentations
7. **Lead assignment optimizer** — Based on historical conversion rates, suggest which rep should get which lead

---

## Technical Choices

| Choice | Rationale |
|---|---|
| Next.js 16 + TypeScript | Vercel deployment, type safety, modern React |
| Recharts | Single charting library — flexible, well-documented, React-native |
| Zustand | Minimal state management for filters and theme |
| Tailwind CSS v4 | Rapid professional UI development |
| Client-side rendering | Instant filter reactivity, simple deployment |
| Algorithmic NL summaries | Deterministic, free, instant, no API dependency |

### Architecture
- `lib/calculations.ts` — All metric computation (pure functions, testable)
- `lib/insights-engine.ts` — Alert generation and NL summary templates
- `lib/utils.ts` — Formatting (INR currency with Cr/L notation, dates, percentages)
- `store/filters.ts` — Zustand store for date range and theme
- Components organized by page context (dashboard/, branch/, layout/)

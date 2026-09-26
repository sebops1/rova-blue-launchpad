# RovaX Launchpad

Build a polished production-quality full-stack web app called "RovaX Blue Launch Command Center" for the RovaX Blue Beach • Water • Experiences project in Sierra Leone. This is an internal digital operating system for the founder/team to move from concept to a validated 90-day pilot.

DESIGN:
- Premium coastal luxury look: deep navy, turquoise/aqua, white, champagne-gold accents.
- Liquid-glass / glassmorphism cards, subtle 3D depth, refined animations, high-end hospitality feel.
- Fully responsive desktop/tablet/mobile.
- Professional enough to demo to investors and strategic partners, but optimized as a working operations dashboard.
- Use clean icons, progress indicators, charts, status badges and attractive cards. No fake clutter.

CORE MODULES:
1) Executive Dashboard
- Overall launch readiness score.
- KPI cards: sites evaluated, preferred site, permission status, supplier quotes received, validated equipment cost, projected monthly break-even, launch countdown, tasks completed.
- 30-day launch timeline with Week 1 Site Validation, Week 2 Negotiation, Week 2-3 Procurement/Compliance, Week 3 Pre-Sales, Week 4 Go/No-Go.
- Risk/issue panel and next-actions panel.

2) Site Evaluation
Preload candidate sites: River No. 2, Tokeh Beach, Bureh Beach, Lakka Beach, Black Johnson, Kent.
Each site has editable scoring 1-10 for:
water calmness/safety, water clarity/photo quality, visitor traffic, premium customer potential, road access, parking, security, toilets/changing facilities, electricity/power, mobile/data coverage, storage, available operating space, hotel/tourism partnerships, community/government support, operating cost/terms, expansion potential.
- Weighted total score and comparison table.
- Upload/store photos and notes.
- Record weekday/weekend observations, tide/weather notes and GPS/location notes.
- Decision field: Shortlist / Hold / Reject / Preferred.
Do NOT pre-decide the winning location.

3) Site Meeting / Negotiation CRM
- Stakeholder name, organization/community/property, role, phone/email, meeting date, notes, follow-up date.
- Questions checklist: who controls permission; commercial operating approval; 90-day pilot; fixed rent vs revenue share; storage; security; utilities; opening hours; signage; exclusivity; food service; drone operations; insurance; local employment; termination terms.
- Proposed partnership models: 90-day pilot, revenue share, concession, hotel commission, joint promotion.
- Generate/print a one-page meeting summary.

4) Compliance & Safety
Track status: Not Started / In Progress / Submitted / Approved / N/A.
Checklist: company/business documentation, site authorization, tourism/local approvals as applicable, commercial drone/UAS requirements verification with SLCAA, insurance, customer waiver, PFD policy, first aid, rescue equipment, weather/no-go SOP, incident log, staff training, daily equipment inspection, emergency contacts.
Do not falsely claim that any approval is already granted.

5) Procurement
Preload planning items:
- 2 transparent crystal kayaks @ $1,299 each
- DJI Mini 4 Pro Fly More Combo @ $1,099 reference
- DJI Osmo Action 5 Pro @ $319 reference
- 2 premium inflatable SUPs @ $579 each reference
- 10 PFD/life jackets @ $45 planning allowance
- 6 snorkeling sets @ $75 planning allowance
- floating water mat $450
- EcoFlow River 2 Max $289 reference
- 2 premium cabana/canopy setups @ $250 planning each
- dry bags + waterproof storage $350
- marine safety/rescue bundle $600
- floating breakfast/picnic props $500
- reception/signage/QR guest setup $400
- Phase 2 Hydrobike Explorer $2,499 reference, excluded from Phase 1.
Fields: supplier, URL, qty, unit price, item subtotal, freight, import/duty, local delivery, landed cost, quote date, quote expiry, quote attachment, status, priority.
Calculate totals automatically. Clearly distinguish reference price vs validated quote.

6) Financial Model
Editable assumptions, no guaranteed returns.
Default planning assumptions:
- Full pilot planning capital around $20,863 based on current working model; allow founder to change it.
- Monthly operating costs default around $4,400.
- Variable/direct cost default 20% of sales.
- Operating days default 20/month.
- Revenue scenarios: $4k, $6k, $8k, $10k, $12k, $14k.
Automatically calculate contribution, operating profit/loss, break-even monthly sales, break-even daily sales, and simple capital recovery period where positive.
- Scenario builder with customers/day, package mix and average spend.
- 12-month editable cash-flow forecast with opening cash, revenue, variable cost, operating expense, capex, net cash flow, closing cash.
- Charts for monthly revenue, profit and cash balance.
- Label calculations as planning estimates, not promises.

7) Experience & Pricing Manager
Preload editable launch hypotheses:
Crystal Mini $40; Crystal Premium $70; Couples $110; Sunset VIP $150; Proposal/Celebration $275 starting; Floating Breakfast add-on $60; VIP Cabana $40; SUP/Snorkel $15.
Fields: duration, capacity, inclusions, direct cost, price, gross margin, active/inactive.
Support USD and an editable SLE equivalent/exchange-rate setting.
Package-builder for bundles.

8) Pre-Sales / Booking Pipeline
Lead/customer name, phone/WhatsApp/email, source (hotel, Instagram, TikTok, Facebook, WhatsApp, walk-in, tour operator, wedding planner, other), desired package, date, party size, quoted price, deposit, balance, status.
Statuses: New Lead, Contacted, Quote Sent, Deposit Paid, Confirmed, Completed, Cancelled.
Show pipeline value, deposits collected and launch-weekend bookings.

9) Partners
Track hotels/resorts, Airbnb hosts, tour operators, wedding planners, photographers/content creators, food/decor suppliers, transport providers.
Fields for contact, commission/revenue-share %, status, notes, next follow-up.
Partner type filters.

10) Task / 30-Day Launch Board
Kanban: Backlog, This Week, In Progress, Waiting, Done.
Task owner, due date, priority, category, notes.
Preload the key 30-day actions from site validation through launch.
Include calendar/timeline view if practical.

11) Document Center
Sections/placeholders for RovaX Blue concept presentation, equipment catalog, financial model, site photos, supplier quotations, permissions, insurance, SOPs, waivers, partnership agreements.
Allow uploads/links and metadata. Do not fabricate official documents.

12) Reports
Generate clean print/PDF-friendly views for:
- Site comparison report
- Site visit report
- Investor readiness summary
- Procurement/landed-cost summary
- 30-day launch status
- Monthly financial scenario summary
- Partner pipeline
Include RovaX Blue branding and date generated.

DATA / UX:
- Use persistent backend/database rather than static mock screens.
- Seed the app with the planning data above, clearly tagged "Planning / Unvalidated".
- All data should be editable.
- Add search, filters, sorting, validation, empty states, confirmation dialogs and useful toast messages.
- Add authentication and protected admin dashboard. Create roles/structure for Founder/Admin, Operations, Finance/Procurement, and Viewer/Investor; if full role permissions require later configuration, build the data model and UI now.
- Provide a read-only investor/share view that exposes only approved summary data, not private operational notes.
- Add Settings: company details, currency/exchange rate, operating assumptions, scoring weights, branding.
- Do not insert fake government approvals, fake contracts, fake customers, fake supplier quotes or guaranteed investor returns.
- The product should feel complete and functional, not a landing-page prototype.

PUBLIC-FACING MINI PAGE:
Also create a polished public RovaX Blue teaser page inside the app with brand story, experiences, gallery placeholders, "Coming Soon", and Join Waitlist / Partner With Us forms feeding the backend CRM. Positioning: "More Than a Beach. A Memory for Life." and "Experience Sierra Leone Differently."

Use production-quality TypeScript/Tailwind/shadcn patterns, accessible components, responsive navigation, robust forms, and a scalable schema.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rova-blue-launchpad.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/65b6cc61-5506-4674-9fd4-8ec8a791626d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

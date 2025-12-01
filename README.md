# InfluenceFlow CRM Dashboard

A lightweight CRM-style dashboard where brands and influencers manage deals, contracts, deliverables, and real-time performance in one place.

## Features
- **Live campaign tracker:** ROI, spend, revenue, and conversions across collaborations.
- **Automatic contract builder:** fast clauses for usage rights, deliverables, timelines, payment terms.
- **Negotiation messenger:** insert ready-made templates, set target rate, copy/send.
- **AI pricing benchmark:** niche + geo-aware rate suggestion based on followers and engagement.
- **Shared workspace:** deadlines, owners, and status chips for both brand and creator.
- **Auto-invoice & payouts:** snapshot of invoice status and amounts.

## Getting started
1. Open `index.html` in your browser (or run a simple server like `python -m http.server 8000`).
2. Update fields (deliverables, usage rights, dates, pricing inputs) and the dashboard updates instantly.

This prototype is built with vanilla HTML/CSS/JS so it can be dropped into any static host.

## Free hosting & deployment options
All of these work because the app is a static site (HTML/CSS/JS only).

### 1) GitHub Pages (fully free)
1. Push this repository to GitHub (public or private with Pages enabled).
2. In the repo settings, enable **Pages → Deploy from branch → main → /(root)**.
3. GitHub will serve the site at `https://<username>.github.io/<repo>/`. Updates deploy automatically on every push.

### 2) Netlify (free tier)
1. Sign up at [netlify.com](https://www.netlify.com) and click **Add new site → Deploy manually**.
2. Drag `index.html`, `styles.css`, and `main.js` into the deploy dropzone (or connect the GitHub repo).
3. Netlify assigns a free URL; redeploys are instant on each drag-and-drop or git push.

### 3) Vercel (free hobby plan)
1. Sign up at [vercel.com](https://vercel.com) and choose **Add New → Project** to import your GitHub repo.
2. Vercel detects it as a static project—no build step needed. Leave defaults and click **Deploy**.
3. Every push to `main` auto-deploys to a free `vercel.app` URL with preview URLs for branches.

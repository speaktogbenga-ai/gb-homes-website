# GB Homes Real Estate website

A fast, mobile-friendly website for GB Homes Real Estate: first homes and investment properties across Toronto, the GTA and Durham Region.

It is plain HTML, CSS and JavaScript. There is nothing to install or build, so it can be hosted for free on GitHub Pages, Netlify, Cloudflare Pages or any web host.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home page with a live payment estimator, services, featured listings, the buying process and a call to action |
| `listings.html` | Listings with filters (city, type, bedrooms, status) and a pop-up with full details |
| `mortgage-calculator.html` | Canadian mortgage calculator with three tabs: **Payment** (all payment frequencies, CMHC insurance, renewal balance, balance chart, yearly schedule), **Affordability** (stress test, GDS/TDS) and **Closing costs** (Ontario and Toronto land transfer tax with first-time buyer refunds) |
| `first-time-buyers.html` | Step-by-step first-time buyer guide, programs (FHSA, RRSP HBP, land transfer tax refunds), a saved checklist and FAQ |
| `investors.html` | Investor guide plus a rental cash-flow calculator (cap rate, cash-on-cash, DSCR, equity built) |
| `contact.html` | Enquiry form that pre-fills from listing and guide buttons |

## Before going live: fill in your details

Open **`js/config.js`** and fill in:

- `registeredTitle` and `brokerageName`, exactly as registered with RECO. Until these are filled in, the footer shows a yellow reminder.
- `phone` and `email`. Anything left empty is hidden from the site.
- Optional: `formEndpoint` (a free [Formspree](https://formspree.io) form URL) so the contact form sends straight to your inbox. Without it, the form opens the visitor's email app addressed to your `email`.
- Optional: `bookingUrl` (Calendly or similar) to show a "Pick a time" button on the contact page.

## Adding or updating listings

Open **`js/listings-data.js`**. Each listing is one block; copy a block to add a new home. Put photos in `assets/listings/` and list the file names in `photos` (the first photo is the cover). Set `price` to a number (no `$` or commas), or leave it `null` to show "Contact for price".

The Pickering semi-detached listing is already in there; add its price, address, bathrooms, parking and photos.

## Brand

- Logo files in `assets/brand/` were made from the GB Homes logo PDF: a horizontal version for the header, a white version for dark backgrounds, the stacked original, and the GB mark (used as the browser icon).
- Colours: GB Homes red `#E52020` and near-black `#111111` (defined at the top of `css/styles.css`).
- Fonts: Archivo (headings) and Inter (text), from Google Fonts.

## Publishing with GitHub Pages

1. In the repository on GitHub, open **Settings → Pages**.
2. Under "Build and deployment", choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
3. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`. You can then connect your own domain in the same screen.

## Calculator rules (as of November 2026)

- Fixed-rate payments use Canadian semi-annual compounding.
- Minimum down payment: 5% up to $500k, 10% on the portion from $500k to $1.5M, 20% at $1.5M+; 20% on non-owner-occupied rentals.
- CMHC premiums: 2.80% / 3.10% / 4.00% by down payment, plus 0.20% for 30-year insured amortizations (first-time buyers and new builds). 8% Ontario PST on the premium is shown as a closing cost.
- Stress test: higher of contract rate + 2% or 5.25%; GDS 39% and TDS 44%.
- Ontario land transfer tax and Toronto MLTT (including luxury tiers) with first-time buyer refunds of up to $4,000 and $4,475.

The maths lives in `js/finance.js` if any of these rules change.

# Supabase and Cloudflare setup

The website works without either service. Each one switches on when you fill in its settings in `js/config.js`.

| Service | What it does for the site | Cost |
| --- | --- | --- |
| **Supabase** | Saves every contact-form enquiry in a **leads** table, so no lead is lost. Lets you add and edit **listings** in a spreadsheet-style table, with no code. | Free plan |
| **Cloudflare** | Runs your domain's DNS. Adds a fast global cache, free HTTPS, DDoS protection, and private **Web Analytics** (visitors, pages and countries, no cookie banner needed). | Free plan |

---

## Supabase (about 10 minutes)

1. Sign up at **supabase.com** and click **New project**.
   - Name it `gb-homes`.
   - Pick the **Canada (Central)** region.
   - Choose and save a database password.
2. When the project is ready, open **SQL Editor → New query**.
   - Paste the whole of [`supabase/schema.sql`](../supabase/schema.sql) and click **Run**.
   - This creates the **leads** and **listings** tables, adds the Pickering listing, creates a **listing-photos** storage bucket and sets the security rules.
3. Go to **Project Settings → API Keys** and copy two values:
   - the **Project URL**
   - the **Publishable key** (`sb_publishable_…`), or the legacy **anon public** key
4. Paste them into `js/config.js`:
   ```js
   supabaseUrl: "https://xxxxxxxx.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...",
   ```
   The publishable key is designed to be public. The security rules only let visitors **add** a lead and **read** published listings. Never paste a **secret** or **service_role** key into the site.

### Day to day
- **New leads:** Table Editor → **leads**. Change `status` to `contacted`, `client` or `closed` as you go.
- **Email alerts:** Supabase stores leads but doesn't email you. To also get each enquiry by email, set `formEndpoint` to a Formspree link. The form then does both.
- **Add a listing:** Table Editor → **listings** → Insert row.
  - The `id` becomes the link, for example `gbluxuryhomes.ca/listings.html#ajax-2-bed-condo`.
  - Untick `published` to hide a listing. Tick `featured` to show it on the home page.
- **Photos:** Storage → **listing-photos** → Upload. Click the photo → **Get URL**, and paste the URL into the listing's `photos` list. The first photo is the cover.

If Supabase is ever unreachable, the site falls back to the built-in listing in `js/listings-data.js`. The contact form falls back to Formspree or email.

---

## Cloudflare (about 15 minutes, plus DNS update time)

1. Sign up at **cloudflare.com** → **Add a domain** → `gbluxuryhomes.ca` → choose the **Free** plan.
2. Cloudflare imports your DNS records. Check that you have these:

   | Type | Name | Content |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | speaktogbenga-ai.github.io |

   Set each one to **DNS only** (grey cloud) for now.
3. Cloudflare shows two **nameservers**. Go to GoDaddy → **My Products → gbluxuryhomes.ca → DNS → Nameservers → Change → "I'll use my own nameservers"** and paste them in. Changes take from 15 minutes to a few hours.
4. Wait until GitHub → **Settings → Pages** shows the HTTPS certificate is ready. Then tick **Enforce HTTPS**.
5. Back in Cloudflare:
   - Set **SSL/TLS → Overview** to **Full (strict)**.
   - Switch the five DNS records to **Proxied** (orange cloud).
   - Turn on **SSL/TLS → Edge Certificates → Always Use HTTPS**.
6. Turn on **Web Analytics**: Analytics & Logs → **Web Analytics** → Add a site → `gbluxuryhomes.ca`.
   - With the records proxied, choose automatic setup and you're done.
   - Otherwise, copy the `token` value from the snippet into `cloudflareAnalyticsToken` in `js/config.js`.

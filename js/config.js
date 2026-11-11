/* ==========================================================================
   GB Homes — business details
   --------------------------------------------------------------------------
   Edit this one file to update your contact details everywhere on the site.
   Anything left as "" (empty) is hidden, except the brokerage name and your
   registered title, which show a yellow reminder until you fill them in
   (RECO requires the brokerage name on your advertising).
   ========================================================================== */
window.GB_CONFIG = {
  agentName: "Gbenga",                    // e.g. "Oluwagbemiga (Gbenga) …"
  registeredTitle: "REALTOR®",             // e.g. "Sales Representative" or "Broker"
  brokerageName: "Real City Realty",      // e.g. "XYZ Realty Inc., Brokerage" exactly as registered
  brokerageAddress: "",                   // optional
  phone: "(437) 235-2788",                //  e.g. "(416) 555-0123"
  email: "realtorgbh@gmail.com",          //  e.g. "hello@gbhomes.ca"
  instagram: "realtorgbhome",             // handle without the @
  serviceArea: "Toronto, the GTA & Durham Region",

  // Email alerts: every contact-form enquiry is emailed here (via the free
  // FormSubmit service, https://formsubmit.co). A Formspree form URL also works.
  // If left empty, the form opens the visitor's email app instead.
  formEndpoint: "https://formsubmit.co/ajax/realtorgbh@gmail.com",

  // Home page background video. Put an .mp4 file (ideally 1920x1080, under
  // 15 MB, 10-30 seconds, no sound) in assets/video/ and write its path here.
  // Optional poster image shows while the video loads.
  heroVideo: "https://videos.pexels.com/video-files/40807458/17436299_1920_1080_30fps.mp4",                          // e.g. "assets/video/hero.mp4"
  heroPoster: "https://images.pexels.com/videos/40807458/architectural-photography-contemporary-home-interior-design-luxury-interiors-40807458.jpeg?auto=compress&cs=tinysrgb&w=1920",                         // e.g. "assets/video/hero-poster.jpg"

  // Optional: a booking link (Calendly, Google Calendar booking page, etc.).
  bookingUrl: "",

  // Supabase (database for leads and listings). From your Supabase project:
  // Project Settings → API Keys → the "Publishable key" (or legacy "anon public" key).
  // The publishable key is safe to publish; NEVER paste a secret / service_role key here.
  // Run supabase/schema.sql once in the Supabase SQL Editor first.
  supabaseUrl: "https://oskldlkbrmdfuerbeikr.supabase.co",
  supabaseAnonKey: "sb_publishable_c0PQ4nbUKiupUq3Uf8DvaQ_4DyCLwx8",   // publishable key (safe to publish)

  // Cloudflare Web Analytics (free, no cookies). Cloudflare dashboard →
  // Analytics & Logs → Web Analytics → Add a site → copy the token from the
  // snippet (the value after "token":). Not needed if your domain's DNS is on
  // Cloudflare with automatic setup turned on.
  cloudflareAnalyticsToken: "ca81f14b64aa4bf689d490418fbb843b"
};

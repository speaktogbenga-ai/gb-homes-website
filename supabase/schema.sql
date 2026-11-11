-- GB Homes — Supabase setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- 1. Leads from the website contact form ----------------------------------
create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  phone       text check (char_length(phone) <= 40),
  topic       text check (char_length(topic) <= 80),
  timeline    text check (char_length(timeline) <= 80),
  budget      text check (char_length(budget) <= 80),
  message     text check (char_length(message) <= 5000),
  listing_id  text check (char_length(listing_id) <= 120),
  page        text check (char_length(page) <= 300),
  status      text not null default 'new'   -- new / contacted / client / closed
);

alter table public.leads enable row level security;

-- Table privileges (needed when "Automatically expose new tables" is off).
-- Row-level security below still decides which rows each role may touch.
grant usage on schema public to anon, authenticated;
revoke all on public.leads from anon, authenticated;
grant insert (name, email, phone, topic, timeline, budget, message, listing_id, page) on public.leads to anon;

-- Website visitors may ADD a lead, but never read, change or delete any.
drop policy if exists "Visitors can submit a lead" on public.leads;
create policy "Visitors can submit a lead" on public.leads
  for insert to anon with check (true);  -- status always 'new': visitors can't write that column

-- 2. Listings shown on the website ----------------------------------------
create table if not exists public.listings (
  id           text primary key,                 -- e.g. 'pickering-3-bed-semi' (used in links)
  published    boolean not null default true,    -- untick to hide from the site
  featured     boolean not null default false,   -- show on the home page
  sort_order   int not null default 100,         -- lower shows first
  status       text not null default 'For sale', -- For sale / New / Sold / Conditionally sold / Leased
  type         text not null,                    -- Detached / Semi-detached / Townhouse / Condo / Multiplex
  title        text not null,
  address      text,
  city         text not null,
  province     text not null default 'ON',
  price        numeric,                          -- empty = "Contact for price"
  beds         numeric,
  baths        numeric,
  parking      numeric,
  sqft         text,
  mls_number   text,
  photos       text[] not null default '{}',     -- full image URLs (e.g. from Supabase Storage); first = cover
  good_for     text[] not null default '{}',
  summary      text,
  highlights   text[] not null default '{}',
  updated_at   timestamptz not null default now()
);

alter table public.listings enable row level security;

revoke all on public.listings from anon, authenticated;
grant select on public.listings to anon, authenticated;

drop policy if exists "Anyone can read published listings" on public.listings;
create policy "Anyone can read published listings" on public.listings
  for select to anon using (published);

-- Starter row: the Pickering semi (edit it in Table Editor → listings).
insert into public.listings (id, featured, sort_order, status, type, title, city, beds, good_for, summary, highlights)
values (
  'pickering-3-bed-semi', true, 1, 'New', 'Semi-detached', '3-bedroom semi-detached home', 'Pickering', 3,
  array['First-time buyers','Families','Investors'],
  'A 3-bedroom semi-detached home in Pickering, with quick access to Highway 401, the GO train and Toronto. A great fit for first-time buyers stepping out of renting, or investors looking at Durham Region.',
  array['3 bedrooms',
        'Semi-detached: more space and privacy than a townhouse, usually for less than a detached home',
        'Pickering location: close to Highway 401 and Pickering GO for commuting to Toronto']
) on conflict (id) do nothing;

-- 3. Listing photos ---------------------------------------------------------
-- Public bucket: upload photos in Storage → listing-photos, then copy each
-- photo's public URL into the listing's "photos" list.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

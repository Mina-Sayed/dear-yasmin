# Love Quest Deluxe ❤️

A personalized, romantic web game surprise.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Add Your Photos**
   Go to `public/assets/photos/` and add your images:
   - `p1.jpg`
   - `p2.jpg`
   - `p3.jpg`
   - `p4.jpg`
   - `p5.jpg`
   
   *Tip: You can use .png or other formats, just update the paths in `src/content.ts`.*

3. **Customize Content**
   Open `src/content.ts` to change:
   - `heroName`: Her name.
   - `secretCode`: The pin code for the secret gate.
   - `memories`: The list of photos and texts.
   - `finalMessage`: The big love message at the end.

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Open the link shown (usually http://localhost:5173).

5. **Deploy (Production)**
   ```bash
   npm run build
   ```
   This creates a `dist` folder.
   - **Netlify:** Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop).
   - **Vercel:** Run `npx vercel` if you have the CLI, or use their dashboard to import the project.

## Mobile Testing Checklist
- [ ] Check if the game opens in full screen (address bar might hide).
- [ ] Test the Virtual Joystick (left side of screen) in Level 1.
- [ ] Test the "Boost" text/zone (right side) in Level 2.
- [ ] Ensure sound plays (click "Start" usually enables audio context).

## Tech Stack
- Vite + TypeScript
- Canvas2D (Native, Lightwieght)
- WebAudio API

## Shared Uploads With Supabase

To make uploaded photos/audio visible to all users, configure Supabase:

1. Create a Supabase project.
2. Create a public storage bucket named `love-quest-assets`.
3. Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.game_assets (
  id text primary key,
  type text not null check (type in ('photo', 'audio')),
  name text not null,
  path text not null,
  text text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_config (
  key text primary key,
  value jsonb
);

alter table public.game_assets enable row level security;
alter table public.game_config enable row level security;

create policy "public read assets" on public.game_assets
for select to anon using (true);

create policy "public write assets" on public.game_assets
for all to anon using (true) with check (true);

create policy "public read config" on public.game_config
for select to anon using (true);

create policy "public write config" on public.game_config
for all to anon using (true) with check (true);

create policy "public read bucket objects" on storage.objects
for select to anon
using (bucket_id = 'love-quest-assets');

create policy "public write bucket objects" on storage.objects
for insert to anon
with check (bucket_id = 'love-quest-assets');

create policy "public update bucket objects" on storage.objects
for update to anon
using (bucket_id = 'love-quest-assets')
with check (bucket_id = 'love-quest-assets');

create policy "public delete bucket objects" on storage.objects
for delete to anon
using (bucket_id = 'love-quest-assets');
```

4. Add env values in `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

5. Rebuild and deploy:

```bash
npm run build
```

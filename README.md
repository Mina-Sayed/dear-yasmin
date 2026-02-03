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

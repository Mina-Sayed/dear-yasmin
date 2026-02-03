# Love Quest Deluxe - Agent Guide

## Project Overview

Love Quest Deluxe is a personalized romantic web game built as a surprise gift. It's a browser-based game featuring multiple levels, interactive gameplay, photo slideshows, and customizable content.

The game features a state machine architecture with Canvas2D rendering, and is designed to be mobile-friendly with virtual joystick controls.

## Technology Stack

- **Build Tool**: Vite 5.x
- **Language**: TypeScript 5.2+ (ES2020 target)
- **Rendering**: HTML5 Canvas2D API
- **Audio**: WebAudio API + HTMLAudioElement for BGM
- **Styling**: Pure CSS (no external UI frameworks)
- **Module System**: ES Modules (`"type": "module"`)

## Project Structure

```
├── index.html              # Entry HTML, game container layout
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration (strict mode)
├── public/
│   ├── assets/
│   │   ├── photos/         # Game photos (p1.jpg - p5.jpg)
│   │   └── bgm.mp3         # Background music (optional)
│   └── vite.svg
└── src/
    ├── main.ts             # Entry point, initializes engine & game loop
    ├── content.ts          # Game data: names, messages, photos, codes
    ├── styles.css          # Main game styles (animations, UI components)
    ├── style.css           # Default Vite template styles (mostly unused)
    ├── engine/             # Core game engine
    │   ├── renderer.ts     # Canvas2D wrapper, drawing helpers
    │   ├── input.ts        # Keyboard & touch input, virtual joystick
    │   ├── audio.ts        # WebAudio API sound effects & BGM
    │   └── time.ts         # Delta time calculation
    ├── game/               # Game states (State Machine pattern)
    │   ├── stateMachine.ts # State machine implementation
    │   ├── intro.ts        # Title screen with floating hearts
    │   ├── level1.ts       # Top-down heart collection game
    │   ├── codeGate.ts     # PIN code entry screen
    │   ├── slideshow.ts    # Photo memory slideshow
    │   ├── level2.ts       # Rocket ship star collection
    │   └── final.ts        # Victory screen with message
    └── ui/
        └── ui.ts           # UI utility class for DOM manipulation
```

## Build Commands

```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run dev
# Serves on http://localhost:5173 by default

# Production build
npm run build
# Outputs to dist/ folder, ready for deployment

# Preview production build locally
npm run preview
```

## Game Flow & States

The game uses a state machine pattern with the following flow:

1. **IntroState** → Start screen with animated background hearts
2. **Level1State** → Collect all memory hearts (top-down movement)
3. **CodeState** → Enter secret PIN code to unlock
4. **SlideshowState** → Browse through photo memories
5. **Level2State** → Rocket ship star collection (vertical scrolling)
6. **FinalState** → Victory screen with custom message

State transitions use dynamic imports to avoid circular dependencies:
```typescript
import('./level1.ts').then(({ Level1State }) => {
    this.sm.changeState(new Level1State(this.sm));
});
```

## Key Configuration

All customizable content is in `src/content.ts`:

```typescript
export const GameData = {
    heroName: "Yasmin",                    // Player name display
    secretCode: "2024",                    // PIN for code gate
    finalMessage: "Happy Anniversary...",  // Victory message
    memories: [                            // Photos & captions
        { id: 1, text: "...", img: "/assets/photos/p1.jpg" },
        // ... up to 5 memories
    ],
    level2StarsToWin: 10                   // Stars needed in level 2
};
```

## Code Style Guidelines

### TypeScript
- Strict mode enabled with unused locals/parameters checking
- Always use explicit types for public interfaces
- Private fields prefixed with `private` keyword
- Use `.ts` extension in dynamic imports (Vite handles this)

### Naming Conventions
- Classes: PascalCase (`StateMachine`, `Level1State`)
- Interfaces: PascalCase (`State`, `Memory`)
- Methods/Properties: camelCase
- Private fields: No underscore prefix (rely on `private` keyword)

### File Organization
- One class per file, exported as named export
- Related states grouped in `src/game/`
- Engine components in `src/engine/`

## Input System

### Desktop
- **WASD** or **Arrow Keys**: Movement
- **Space**: Action/Thrust (Level 2)

### Mobile (Touch)
- **Left side (bottom half)**: Virtual joystick
- **Right side**: Action button/Thrust zone

Input is normalized and accessible via:
```typescript
const axis = inputManager.getAxis(); // Returns { x, y } normalized vector
const isThrusting = inputManager.actionPressed || inputManager.keys['Space'];
```

## Audio System

Uses WebAudio API for synthesized sound effects:
- `collect`: High-pitched ping for item collection
- `click`: UI button click
- `jump`: Rising pitch for rocket thrust
- `win`: Major chord arpeggio
- `error`: Low sawtooth buzz

BGM loaded from `/assets/bgm.mp3` via HTMLAudioElement.

## Rendering Architecture

- **Canvas2D** with DPR scaling for retina displays
- Alpha channel enabled for transparency effects
- States handle their own clearing and drawing
- Common draw helper: `renderer.drawHeart(x, y, size, color)`

## UI System

Hybrid approach:
- **Canvas**: Game world rendering (hearts, player, effects)
- **DOM**: Static UI screens (HTML injected in `main.ts`)

UI visibility controlled via CSS classes:
```typescript
UIManager.showScreen('game-ui');      // Shows game HUD
UIManager.hideScreen('intro-screen'); // Hides intro
UIManager.showModal(title, img, text, onNext); // Memory popup
```

## Mobile Considerations

- Viewport locked with `user-scalable=no`
- Touch events prevent default scrolling
- Virtual joystick for movement
- Touch-action: none on body
- Responsive canvas resizing

## Testing

No automated test suite. Manual testing checklist:
- [ ] Game opens in fullscreen on mobile
- [ ] Virtual joystick works (Level 1)
- [ ] Boost/action zone works (Level 2)
- [ ] Sound plays after clicking Start
- [ ] All photo paths resolve correctly
- [ ] Secret code validation works

## Deployment

### Build Output
```bash
npm run build
# Creates dist/ folder with:
# - Bundled JS (ES modules)
# - Minified CSS
# - Copied assets from public/
```

### Platforms
- **Netlify**: Drag & drop `dist/` folder to Netlify Drop
- **Vercel**: Run `npx vercel` or connect Git repository
- **Any static host**: Upload `dist/` contents

## Security Considerations

- Secret code is client-side only (not secure, just for fun)
- No sensitive data should be stored in GameData
- Audio requires user interaction (browser autoplay policy)

## Common Tasks

### Adding a New Photo
1. Add image to `public/assets/photos/`
2. Update `src/content.ts` memories array with new path
3. Supports: jpg, png, webp (adjust extension in content.ts)

### Changing the Secret Code
Edit `GameData.secretCode` in `src/content.ts`

### Adding a New Sound Effect
Add case to `AudioManager.play()` in `src/engine/audio.ts`:
```typescript
case 'newSound':
    this.playTone(440, 'sine', 0.2);
    break;
```

### Creating a New Game State
1. Create file in `src/game/newState.ts`
2. Implement `State` interface:
   ```typescript
   export class NewState implements State {
       enter() { /* setup */ }
       update(dt: number) { /* logic */ }
       draw(renderer: Renderer) { /* render */ }
       exit() { /* cleanup */ }
   }
   ```
3. Transition via dynamic import in another state

## Dependencies

**Production**: None (pure TypeScript/Vanilla JS)

**Development**:
- `typescript`: ^5.2.2
- `vite`: ^5.0.0

No external runtime dependencies - keeps bundle small and fast.

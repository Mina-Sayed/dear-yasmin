import './styles.css';
import { Renderer } from './engine/renderer';
import { InputManager } from './engine/input';
import { AudioManager } from './engine/audio';
import { Time } from './engine/time';
import { StateMachine } from './game/stateMachine';
import { IntroState } from './game/intro';
import { GameData } from './content';

// Inject HTML UI
const uiHTML = `
<!-- Intro -->
<div id="intro-screen" class="screen">
    <div style="text-align:center; animation: popIn 1s;">
        <h1 style="font-size: 3.5rem; margin-bottom: 10px; text-shadow: 0 0 30px #ff4081; line-height: 1;">Dear Yasmin<br><span style="font-size: 1.2rem; color: #ff80ab; font-weight: 300;">A small surprise for the girl who means the world</span></h1>
        <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.8; letter-spacing: 1px;">Made with ❤️ just for you</p>
        <button id="start-btn" style="font-size: 1.4rem; padding: 16px 50px;">Start ❤️</button>
    </div>
    <div style="position: absolute; bottom: 20px; opacity: 0.5; font-size: 0.8rem;">Tap to start - Use headphones for best experience</div>
    <!-- Secret admin button (small corner area) -->
    <div id="admin-trigger" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; cursor: pointer; opacity: 0.3; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;" title="Admin">⚙️</div>
</div>

<!-- Game UI -->
<div id="game-ui" class="screen hidden" style="pointer-events: none; background: transparent; justify-content: space-between;">
    <div id="hud-text" class="hud">Loading...</div>
    
    <div style="width: 100%; height: 100px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; margin-bottom: 40px;">
        <!-- Visual cues for controls -->
        <div style="width: 60px; height: 60px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0.4;">
            <span style="font-size: 24px;">🕹️</span>
        </div>
         <div style="width: 60px; height: 60px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0.4;">
            <span style="font-size: 24px;">🚀</span>
        </div>
    </div>
</div>

<!-- Code Screen -->
<div id="code-screen" class="screen hidden">
    <h2 style="margin-bottom: 20px; color: var(--primary);">Access Top Secret</h2>
    <div id="code-container" style="display: flex; flex-direction: column; align-items: center;">
        <div id="code-display" style="font-size: 2rem; letter-spacing: 5px; margin-bottom: 30px; min-height: 40px; color: #ff80ab;"></div>
        <div class="keypad">
            <button class="key-btn" data-val="1">1</button>
            <button class="key-btn" data-val="2">2</button>
            <button class="key-btn" data-val="3">3</button>
            <button class="key-btn" data-val="4">4</button>
            <button class="key-btn" data-val="5">5</button>
            <button class="key-btn" data-val="6">6</button>
            <button class="key-btn" data-val="7">7</button>
            <button class="key-btn" data-val="8">8</button>
            <button class="key-btn" data-val="9">9</button>
            <button class="key-btn" data-val="del" style="background: rgba(233, 30, 99, 0.4)">🔙</button>
            <button class="key-btn" data-val="0">0</button>
            <button class="key-btn" data-val="ok" style="background: rgba(76, 175, 80, 0.4)">✅</button>
        </div>
    </div>
</div>

<!-- Slideshow -->
<div id="slideshow-screen" class="screen hidden">
    <div id="slideshow-content" class="interactive" style="display:flex; flex-direction:column; align-items:center; width: 100%; max-width: 500px; padding: 20px;">
        <img id="slide-img" class="img-frame" style="width: 100%; aspect-ratio: 1; transition: opacity 0.5s;">
        <p id="slide-text" style="font-size: 1.3rem; margin: 20px 0; min-height: 60px; text-align: center; color: #fff;"></p>
        <div id="slide-progress" style="opacity: 0.6; margin-bottom: 20px; font-size: 0.9rem;"></div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px; width: 100%; justify-content: center;">
            <button id="slide-prev" style="padding: 10px 20px;">Prev</button>
            <button id="slide-next" style="padding: 10px 20px;">Next</button>
        </div>
         <button id="slide-finish" class="hidden" style="background: #4caf50; width: 100%; margin-top: 10px; animation: popIn 0.5s;">Start Final Mission 🚀</button>
    </div>
</div>

<!-- Final -->
<div id="final-screen" class="screen hidden" style="text-align: center;">
    <h1 style="font-size: 3rem; margin-bottom: 20px; text-shadow: 0 0 20px #ff4081;">Mission Accomplished!</h1>
    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; margin: 0 20px 40px 20px; backdrop-filter: blur(5px);">
        <p id="final-message-text" style="font-size: 1.4rem; white-space: pre-wrap; line-height: 1.6;"></p>
    </div>
    <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        <button id="copy-btn" class="interactive">Share Link 🔗</button>
        <button id="replay-btn" class="interactive" style="background: transparent; border: 2px solid white;">Replay ↺</button>
    </div>
</div>

<!-- Admin -->
<div id="admin-screen" class="screen hidden">
    <div style="width: 100%; max-width: 600px; padding: 20px; display: flex; flex-direction: column; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: var(--primary);">Admin Panel 🎛️</h2>
            <button id="admin-back" style="padding: 8px 16px; font-size: 0.9rem;">Back</button>
        </div>

        <!-- Photos Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 1.1rem;">📸 Photos (${GameData.memories.length} default)</h3>
                <button id="admin-add-photo" style="padding: 8px 16px; font-size: 0.9rem;">+ Add Photos</button>
                <input type="file" id="admin-photo-input" accept="image/*,.heic,.heif" multiple style="display: none;">
            </div>
            <div id="admin-photo-list" style="max-height: 200px; overflow-y: auto;">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Audio Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 1.1rem;">🎵 Background Music</h3>
                <button id="admin-add-audio" style="padding: 8px 16px; font-size: 0.9rem;">+ Add Audio</button>
                <input type="file" id="admin-audio-input" accept="audio/*" style="display: none;">
            </div>
            <div id="admin-audio-info">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Preview Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; flex: 1;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.1rem;">👁️ Preview</h3>
            <div id="admin-preview">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Reset -->
        <button id="admin-reset" style="background: #e91e63; margin-top: auto;">Reset to Defaults ↺</button>
    </div>
</div>
`;

const uiLayer = document.getElementById('ui-layer');
if (uiLayer) uiLayer.innerHTML = uiHTML;

// Initialize Engine
try {
    const renderer = new Renderer('game-canvas');
    const input = new InputManager();
    const audio = new AudioManager();
    const time = new Time();
    const sm = new StateMachine(renderer, input, audio);

    window.addEventListener('resize', () => {
        sm.resize(renderer.width, renderer.height);
    });

    // Load custom content before starting
    GameData.loadCustomContent().then(() => {
        console.log('Custom content loaded:', 
            GameData.memories.length, 'photos,',
            GameData.useCustomBGM ? 'custom BGM' : 'default BGM'
        );
        
        // Update audio if custom BGM loaded
        if (GameData.useCustomBGM) {
            audio.setupBGM();
        }

        // Initial State
        sm.changeState(new IntroState(sm));

        // Game Loop
        const loop = (now: number) => {
            requestAnimationFrame(loop);
            time.update(now);
            // Safety cap on dt
            const dt = Math.min(time.deltaTime, 0.05);
            sm.update(dt);
            // Always clear before draw? State usually handles clear, but safer here if state misses one
            // renderer.clear(); 
            sm.draw();
        };

        requestAnimationFrame(loop);
        console.log("Game Initialized!");
    });

} catch (e) {
    console.error("Initialization Failed:", e);
    document.body.innerHTML = `<h1 style="color:white; text-align:center; margin-top: 50px;">Sorry, something went wrong :(</h1><p style="color:#aaa; text-align:center;">${e}</p>`;
}

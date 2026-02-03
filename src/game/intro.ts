import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
// Circular dependency: IntroState -> Level1State. 
// We will resolve this by passing the class constructor or using a factory later, 
// but for now I'll just import it. Be careful.
// Actually, strict TS might complain if I don't implement Level1 yet.
// I will just use `any` for the next state for now or import after.

export class IntroState implements State {
    sm: StateMachine;
    hearts: { x: number, y: number, s: number, spd: number, off: number }[] = [];

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('intro-screen');
        this.hearts = [];
        for (let i = 0; i < 30; i++) {
            this.hearts.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                s: 10 + Math.random() * 30,
                spd: 20 + Math.random() * 40, // pixels per second
                off: Math.random() * Math.PI * 2
            });
        }

        // Setup button listener if not already
        const btn = document.getElementById('start-btn');
        if (btn) {
            btn.onclick = () => {
                this.sm.audio.play('click');
                this.sm.audio.startBGM();
                // Dynamic import with .ts extension
                import('./level1.ts').then(({ Level1State }) => {
                    this.sm.changeState(new Level1State(this.sm));
                });
            };
        }

        // Admin trigger (secret access)
        const adminTrigger = document.getElementById('admin-trigger');
        if (adminTrigger) {
            adminTrigger.onclick = () => {
                this.sm.audio.play('click');
                import('./admin.ts').then(({ AdminState }) => {
                    this.sm.changeState(new AdminState(this.sm));
                });
            };
        }
    }

    update(dt: number) {
        this.hearts.forEach(h => {
            h.y -= h.spd * dt;
            h.x += Math.sin(Date.now() / 1000 + h.off) * 0.5;
            if (h.y < -50) {
                h.y = window.innerHeight + 50;
                h.x = Math.random() * window.innerWidth;
            }
        });
    }

    draw(r: Renderer) {
        r.clear('#220510');
        r.ctx.globalCompositeOperation = 'screen';
        this.hearts.forEach(h => {
            // Pulse
            const pulse = 1 + Math.sin(Date.now() / 500 + h.off) * 0.1;
            r.drawHeart(h.x, h.y, h.s * pulse, 'rgba(255, 64, 129, 0.2)');
        });
        r.ctx.globalCompositeOperation = 'source-over';
    }

    resize(_w: number, _h: number) {
        // Re-distribute hearts for new screen size
        this.hearts.forEach(h => {
            h.x = Math.min(h.x, window.innerWidth);
            h.y = Math.min(h.y, window.innerHeight);
        });
    }

    exit() {
        UIManager.hideScreen('intro-screen');
    }
}

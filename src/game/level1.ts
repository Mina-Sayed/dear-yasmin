import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { GameData } from "../content";

export class Level1State implements State {
    sm: StateMachine;
    player = { x: 0, y: 0, r: 12, speed: 250 };
    collectibles: { x: number, y: number, r: number, active: boolean, id: number }[] = [];
    collectedCount = 0;
    isPaused = false;

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('game-ui');
        const totalHearts = GameData.memories.length;
        UIManager.updateHUD(`Collect all ${totalHearts} hearts! ❤️`);

        this.player.x = this.sm.renderer.width / 2;
        this.player.y = this.sm.renderer.height / 2;

        // Spawn collectibles based on number of photos/memories
        this.collectibles = GameData.memories.map((m) => {
            let x, y, dist;
            // Retry until position is valid (not too close to player or walls)
            let tries = 0;
            do {
                const margin = 50;
                x = margin + Math.random() * (this.sm.renderer.width - margin * 2);
                y = margin + Math.random() * (this.sm.renderer.height - margin * 2);
                const dx = x - this.player.x;
                const dy = y - this.player.y;
                dist = Math.sqrt(dx * dx + dy * dy);
                tries++;
            } while (dist < 100 && tries < 50);

            return { x, y, r: 15, active: true, id: m.id };
        });

        this.collectedCount = 0;
    }

    update(dt: number) {
        // If joystick specific UI is needed we can toggle it here
        if (this.isPaused) return;

        const axis = this.sm.input.getAxis();
        // Move
        if (axis.x !== 0 || axis.y !== 0) {
            this.player.x += axis.x * this.player.speed * dt;
            this.player.y += axis.y * this.player.speed * dt;
        }

        // Bounds
        this.player.x = Math.max(15, Math.min(this.sm.renderer.width - 15, this.player.x));
        this.player.y = Math.max(15, Math.min(this.sm.renderer.height - 15, this.player.y));

        // Collisions
        this.collectibles.forEach(c => {
            if (!c.active) return;
            // Heart center approx adjusted
            const hx = c.x;
            const hy = c.y + c.r / 2;

            const dx = hx - this.player.x;
            const dy = hy - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (this.player.r + c.r)) {
                this.collect(c);
            }
        });
    }

    collect(c: typeof this.collectibles[0]) {
        c.active = false;
        this.collectedCount++;
        this.sm.audio.play('collect');
        this.isPaused = true;

        const mem = GameData.memories.find(m => m.id === c.id);
        UIManager.showModal(
            "Captured a Memory!",
            mem?.img || "",
            mem?.text || "",
            () => {
                this.isPaused = false;
                UIManager.updateHUD(`Hearts: ${this.collectedCount}/${GameData.memories.length}`);

                if (this.collectedCount >= GameData.memories.length) {
                    // Slight delay before transition
                    setTimeout(() => {
                        import('./codeGate.ts').then(({ CodeState }) => {
                            this.sm.changeState(new CodeState(this.sm));
                        });
                    }, 500);
                }
            }
        );
    }

    draw(r: Renderer) {
        r.clear('#1b1b2f'); // Deep blue

        // Draw grid
        r.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        r.ctx.lineWidth = 1;
        const cellSize = 50;

        // Offset grid by time for effect? No, keep simple
        for (let x = 0; x < r.width; x += cellSize) { r.ctx.beginPath(); r.ctx.moveTo(x, 0); r.ctx.lineTo(x, r.height); r.ctx.stroke(); }
        for (let y = 0; y < r.height; y += cellSize) { r.ctx.beginPath(); r.ctx.moveTo(0, y); r.ctx.lineTo(r.width, y); r.ctx.stroke(); }

        // Draw Collectibles
        this.collectibles.forEach(c => {
            if (!c.active) return;
            // Pulse
            const blob = Math.sin(Date.now() / 200) * 3;
            r.drawHeart(c.x, c.y, (c.r * 1.5) + blob, '#ff4081');
        });

        // Draw Player
        r.ctx.shadowBlur = 15;
        r.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        r.ctx.fillStyle = '#fff';
        r.ctx.beginPath();
        r.ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
        r.ctx.fill();
        r.ctx.shadowBlur = 0;

        // Name tag
        r.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        r.ctx.font = '14px Outfit';
        r.ctx.textAlign = 'center';
        r.ctx.fillText(GameData.heroName, this.player.x, this.player.y - 25);
    }

    resize(w: number, h: number) {
        // Clamp Player
        this.player.x = Math.max(15, Math.min(w - 15, this.player.x));
        this.player.y = Math.max(15, Math.min(h - 15, this.player.y));

        // Clamp Collectibles
        this.collectibles.forEach(c => {
            if (!c.active) return;
            c.x = Math.max(50, Math.min(w - 50, c.x));
            c.y = Math.max(50, Math.min(h - 50, c.y));
        });
    }

    exit() {
        UIManager.hideScreen('game-ui');
    }
}

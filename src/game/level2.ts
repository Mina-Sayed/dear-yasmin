import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { GameData } from "../content";

export class Level2State implements State {
    sm: StateMachine;
    player = { x: 50, y: 0, w: 30, h: 50, vy: 0 };
    fuel = 100;
    private jumpSoundCooldown = 0;
    private readonly jumpSoundInterval = 0.12;

    stars: { x: number, y: number, r: number, active: boolean }[] = [];
    collectedCount = 0;

    gravity = 600;
    thrust = -1400; // Strong upward force
    speedX = 200;

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('game-ui');

        this.player.x = this.sm.renderer.width / 2;
        this.player.y = this.sm.renderer.height - 150;
        this.player.vy = 0;
        this.fuel = 100;
        this.collectedCount = 0;
        this.jumpSoundCooldown = 0;

        this.stars = [];
        // Generate stars upward
        const startY = this.player.y - 200;
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: 50 + Math.random() * (this.sm.renderer.width - 100),
                y: startY - (i * 200), // Spacing
                r: 15,
                active: true
            });
        }

        UIManager.updateHUD(`Stars: 0/${GameData.level2StarsToWin}`);
    }

    update(dt: number) {
        this.jumpSoundCooldown = Math.max(0, this.jumpSoundCooldown - dt);

        // Physics
        this.player.vy += this.gravity * dt;

        const axis = this.sm.input.getAxis();
        if (axis.x !== 0) {
            this.player.x += axis.x * this.speedX * dt;
        }

        // Thrust input
        const isThrusting = this.sm.input.isActionActive();

        if (isThrusting && this.fuel > 0) {
            this.player.vy += this.thrust * dt;
            this.fuel -= 30 * dt; // Consumption rate
            if (this.jumpSoundCooldown <= 0) {
                this.sm.audio.play('jump');
                this.jumpSoundCooldown = this.jumpSoundInterval;
            }
        } else if (!isThrusting && this.fuel < 100) {
            this.fuel = Math.min(100, this.fuel + 10 * dt); // Regen with clamp
        }

        this.player.y += this.player.vy * dt;

        // Ceiling/Walls
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.sm.renderer.width - this.player.w) this.player.x = this.sm.renderer.width - this.player.w;

        // Floor (Safety net at bottom)

        // Actually, let's keep the floor fixed at the very bottom value we started at
        // But since we use camera relative to player, "Screen Height" changes.
        // Let's just say "If player falls 500px below the lowest star, reset him to latest platform?"
        // Or simpler: infinite floor at starting Y.

        const startingY = this.sm.renderer.height - 150;
        if (this.player.y > startingY) {
            this.player.y = startingY;
            this.player.vy = 0;
        }

        // Collisions
        this.stars.forEach(s => {
            if (!s.active) return;
            const px = this.player.x + this.player.w / 2;
            const py = this.player.y + this.player.h / 2;
            const dist = Math.sqrt((px - s.x) ** 2 + (py - s.y) ** 2);

            if (dist < (30 + s.r)) {
                s.active = false;
                this.collectedCount++;
                this.sm.audio.play('collect');
                this.checkWin();
            }
        });

        UIManager.updateHUD(`Stars: ${this.collectedCount}/${GameData.level2StarsToWin} | Fuel: ${Math.floor(this.fuel)}%`);
    }

    checkWin() {
        if (this.collectedCount >= GameData.level2StarsToWin) {
            this.sm.audio.play('win');
            import('./final.ts').then(({ FinalState }) => {
                this.sm.changeState(new FinalState(this.sm));
            });
        }
    }

    draw(r: Renderer) {
        // We want the camera to follow the player upwards but never go down? 
        // Or just follow player Y with some offset.

        // Center player vertically on screen
        const camY = -this.player.y + r.height * 0.6;

        // Sky gradient
        const grd = r.ctx.createLinearGradient(0, 0, 0, r.height);
        grd.addColorStop(0, "#020024");
        grd.addColorStop(1, "#090979");
        r.ctx.fillStyle = grd;
        r.ctx.fillRect(0, 0, r.width, r.height);

        r.ctx.save();
        r.ctx.translate(0, camY);

        // Draw Stars
        this.stars.forEach(s => {
            if (s.active) {
                // Flashy star
                r.ctx.fillStyle = `hsl(${Date.now() / 10 % 360}, 70%, 70%)`;
                r.ctx.beginPath();
                r.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                r.ctx.fill();
            }
        });

        // Draw Player
        r.ctx.fillStyle = '#ff4081';
        // Simple Rocket Shape
        r.ctx.beginPath();
        r.ctx.moveTo(this.player.x + this.player.w / 2, this.player.y); // Nose
        r.ctx.lineTo(this.player.x + this.player.w, this.player.y + this.player.h);
        r.ctx.lineTo(this.player.x, this.player.y + this.player.h);
        r.ctx.fill();

        // Flame
        if (this.sm.input.isActionActive() && this.fuel > 0) {
            r.ctx.fillStyle = 'orange';
            r.ctx.beginPath();
            r.ctx.moveTo(this.player.x + 10, this.player.y + this.player.h);
            r.ctx.lineTo(this.player.x + this.player.w / 2, this.player.y + this.player.h + 25 + Math.random() * 15);
            r.ctx.lineTo(this.player.x + this.player.w - 10, this.player.y + this.player.h);
            r.ctx.fill();
        }

        r.ctx.restore();

        // HUD Overlay is DOM, but Fuel Bar can be canvas if we want
        // But we are using DOM HUD text.
        // Let's draw Fuel Bar on Canvas for performance/look
        r.ctx.fillStyle = '#333';
        r.ctx.fillRect(10, 60, 100, 10);
        r.ctx.fillStyle = this.fuel > 20 ? '#0f0' : '#f00';
        r.ctx.fillRect(10, 60, this.fuel, 10);
        r.ctx.strokeStyle = '#fff';
        r.ctx.strokeRect(10, 60, 100, 10);
    }

    resize(w: number, _h: number) {
        // Clamp player and potentially stars
        this.player.x = Math.max(0, Math.min(w - this.player.w, this.player.x));
        // Stars are mainly vertical, X might need clamping but they are random anyway.
        this.stars.forEach(s => {
            s.x = Math.max(50, Math.min(w - 50, s.x));
        });
    }

    exit() {
        UIManager.hideScreen('game-ui');
    }
}

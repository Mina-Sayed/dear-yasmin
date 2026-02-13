export class InputManager {
    keys: { [key: string]: boolean } = {};
    joystick: { x: number, y: number, active: boolean } = { x: 0, y: 0, active: false };
    actionPressed: boolean = false;
    private keyboardActionPressed: boolean = false;

    // Joystick config
    private dragStart: { x: number, y: number } | null = null;
    private touchId: number | null = null;
    private actionTouchId: number | null = null;

    constructor() {
        this.startListening();
    }

    startListening() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.keyboardActionPressed = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.keyboardActionPressed = false;
        });

        // Prevent default touch behaviors to stop scrolling
        document.body.addEventListener('touchstart', (e) => {
            // Only prevent if target is the canvas or game controls
            if ((e.target as HTMLElement).tagName === 'CANVAS') e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleTouchStart(e: TouchEvent) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];

            // Check if touch is on a UI element (like a button) - if so, ignore for joystick
            // But simple heuristic: Left side (bottom half) = Joystick, Right side = Action

            const isBottomHalf = t.clientY > window.innerHeight * 0.4;

            if (isBottomHalf && t.clientX < window.innerWidth / 2) {
                if (this.touchId === null) {
                    this.touchId = t.identifier;
                    this.dragStart = { x: t.clientX, y: t.clientY };
                    this.joystick.active = true;
                }
            } else if (isBottomHalf) {
                // Right side -> Action
                if (this.actionTouchId === null) {
                    this.actionTouchId = t.identifier;
                    this.actionPressed = true;
                }
            }
        }
    }

    handleTouchMove(e: TouchEvent) {
        if (this.touchId === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === this.touchId && this.dragStart) {
                const dx = t.clientX - this.dragStart.x;
                const dy = t.clientY - this.dragStart.y;
                const max = 60; // Max radius
                let dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                if (dist > max) dist = max;

                this.joystick.x = Math.cos(angle) * (dist / max);
                this.joystick.y = Math.sin(angle) * (dist / max);
            }
        }
    }

    handleTouchEnd(e: TouchEvent) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === this.touchId) {
                this.touchId = null;
                this.dragStart = null;
                this.joystick = { x: 0, y: 0, active: false };
            }
            if (t.identifier === this.actionTouchId) {
                this.actionTouchId = null;
                this.actionPressed = false;
            }
        }
    }

    isActionActive() {
        return this.actionPressed || this.keyboardActionPressed;
    }

    // WASD Fallback
    getAxis() {
        // If joystick active, use it
        if (this.joystick.active) return { ...this.joystick };

        let x = 0;
        let y = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // Normalize
        if (x !== 0 || y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }

        return { x, y };
    }
}

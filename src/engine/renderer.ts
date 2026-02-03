export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) throw new Error("Canvas not found");

        // Alpha true so we can see CSS background behind canvas if we want
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) throw new Error("2D context not supported");
        this.ctx = ctx;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);
    }

    clear(color: string = 'rgba(0,0,0,0)') {
        this.ctx.fillStyle = color;
        // If transparent, use clearRect
        if (color === 'rgba(0,0,0,0)' || color === 'transparent') {
            this.ctx.clearRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    // Draw heart helper
    drawHeart(x: number, y: number, size: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        // top left curve
        this.ctx.bezierCurveTo(
            x, y,
            x - size / 2, y,
            x - size / 2, y + topCurveHeight
        );
        // bottom left curve
        this.ctx.bezierCurveTo(
            x - size / 2, y + (size + topCurveHeight) / 2,
            x, y + (size + topCurveHeight) / 2,
            x, y + size
        );
        // bottom right curve
        this.ctx.bezierCurveTo(
            x, y + (size + topCurveHeight) / 2,
            x + size / 2, y + (size + topCurveHeight) / 2,
            x + size / 2, y + topCurveHeight
        );
        // top right curve
        this.ctx.bezierCurveTo(
            x + size / 2, y,
            x, y,
            x, y + topCurveHeight
        );
        this.ctx.fill();
        this.ctx.closePath();
    }
}

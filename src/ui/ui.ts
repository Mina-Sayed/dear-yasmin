function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export class UIManager {
    static showScreen(id: string) {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            el.style.opacity = '1';
        }
    }

    static hideScreen(id: string) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    static updateHUD(text: string) {
        const hud = document.getElementById('hud-text');
        if (hud) hud.innerText = text;
    }

    static showModal(title: string, img: string, text: string, onNext: () => void) {
        let modal = document.getElementById('modal-overlay');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-overlay';
            modal.className = 'modal-backdrop hidden';
            document.body.appendChild(modal);
        }

        // Use a placeholder if img fails or is empty, handled by onerror in HTML
        const safeTitle = escapeHtml(title);
        const safeText = escapeHtml(text);
        modal.innerHTML = `
            <div class="modal">
                <h2 style="color: var(--primary); margin: 0 0 12px 0;">${safeTitle}</h2>
                <img src="${img}" class="img-frame" style="background:gray;" alt="Memory Photo">
                <p style="font-size: 1.1rem; line-height: 1.4; margin-bottom: 24px;">${safeText}</p>
                <button id="modal-next">Continue ❤️</button>
            </div>
        `;

        modal.classList.remove('hidden');

        const btn = document.getElementById('modal-next');
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent click from passing to game
                modal!.classList.add('hidden');
                onNext();
            };
        }
    }
}

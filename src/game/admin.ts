import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { storage, StoredAsset } from "../engine/storage";
import { GameData } from "../content";

export class AdminState implements State {
    sm: StateMachine;
    private eventListeners: { el: HTMLElement; type: string; handler: EventListener }[] = [];
    private photos: StoredAsset[] = [];
    private audio: StoredAsset | null = null;

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    async enter() {
        UIManager.showScreen('admin-screen');
        this.eventListeners = [];

        try {
            await storage.init();
        } catch (e) {
            console.error('Failed to init storage:', e);
            alert('Cloud storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.');
            await this.returnToIntro();
            return;
        }

        this.setupEventListeners();
        await this.loadExistingAssets();
        this.updateUI();
    }

    setupEventListeners() {
        const photoInput = document.getElementById('admin-photo-input') as HTMLInputElement;
        const addPhotoBtn = document.getElementById('admin-add-photo');

        if (addPhotoBtn && photoInput) {
            const handler = () => photoInput.click();
            addPhotoBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: addPhotoBtn, type: 'click', handler });

            const changeHandler = (e: Event) => {
                void this.handlePhotoUpload(e);
            };
            photoInput.addEventListener('change', changeHandler);
            this.eventListeners.push({ el: photoInput, type: 'change', handler: changeHandler as EventListener });
        }

        const audioInput = document.getElementById('admin-audio-input') as HTMLInputElement;
        const addAudioBtn = document.getElementById('admin-add-audio');

        if (addAudioBtn && audioInput) {
            const handler = () => audioInput.click();
            addAudioBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: addAudioBtn, type: 'click', handler });

            const changeHandler = (e: Event) => {
                void this.handleAudioUpload(e);
            };
            audioInput.addEventListener('change', changeHandler);
            this.eventListeners.push({ el: audioInput, type: 'change', handler: changeHandler as EventListener });
        }

        const backBtn = document.getElementById('admin-back');
        if (backBtn) {
            const handler = () => {
                void this.returnToIntro();
            };
            backBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: backBtn, type: 'click', handler });
        }

        const resetBtn = document.getElementById('admin-reset');
        if (resetBtn) {
            const handler = () => {
                void this.resetToDefaults();
            };
            resetBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: resetBtn, type: 'click', handler });
        }
    }

    async handlePhotoUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            if (!this.isSupportedImageFile(file)) {
                console.warn('Skipping non-image file:', file.name);
                continue;
            }

            const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            try {
                await storage.saveAsset(id, 'photo', file.name, file);
                this.sm.audio.play('click');
            } catch (err) {
                console.error('Failed to save photo:', err);
            }
        }

        input.value = '';
        await this.loadExistingAssets();
        this.updateUI();
    }

    private isSupportedImageFile(file: File): boolean {
        if (file.type.startsWith('image/')) return true;
        const lowerName = file.name.toLowerCase();
        return lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
    }

    async handleAudioUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('audio/')) {
            alert('Please select an audio file');
            return;
        }

        if (this.audio) {
            await storage.deleteAsset(this.audio.id);
        }

        const id = `bgm_${Date.now()}`;
        try {
            await storage.saveAsset(id, 'audio', file.name, file);
            await storage.setConfig('useCustomBGM', true);
            this.sm.audio.play('click');
        } catch (err) {
            console.error('Failed to save audio:', err);
        }

        input.value = '';
        await this.loadExistingAssets();
        this.updateUI();
    }

    async loadExistingAssets() {
        const allAssets = await storage.getAllAssets();
        this.photos = allAssets.filter(a => a.type === 'photo');
        this.audio = allAssets.find(a => a.type === 'audio') || null;
    }

    private clearChildren(el: HTMLElement) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    private createEmptyMessage(text: string): HTMLParagraphElement {
        const p = document.createElement('p');
        p.style.cssText = 'color: #888; text-align: center;';
        p.textContent = text;
        return p;
    }

    private createPhotoItem(photo: StoredAsset, index: number): HTMLDivElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'admin-item';
        wrapper.dataset.id = photo.id;
        wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;';

        const rowTop = document.createElement('div');
        rowTop.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const img = document.createElement('img');
        img.src = photo.url;
        img.style.cssText = 'width: 60px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;';

        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';

        const slideLabel = document.createElement('div');
        slideLabel.style.cssText = 'font-size: 0.85rem; color: #888; margin-bottom: 4px;';
        slideLabel.textContent = `Slide ${index + 1}`;

        const name = document.createElement('div');
        name.style.cssText = 'font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        name.textContent = photo.name;

        info.append(slideLabel, name);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-delete-photo';
        deleteBtn.dataset.id = photo.id;
        deleteBtn.style.cssText = 'background: #e91e63; padding: 6px 12px; font-size: 0.8rem; flex-shrink: 0;';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            void this.deletePhoto(photo.id);
        };

        rowTop.append(img, info, deleteBtn);

        const rowBottom = document.createElement('div');
        rowBottom.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const emoji = document.createElement('span');
        emoji.style.cssText = 'font-size: 1rem;';
        emoji.textContent = '💬';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'admin-photo-text';
        textInput.dataset.id = photo.id;
        textInput.value = photo.text || '';
        textInput.placeholder = 'Enter a sweet message for this photo...';
        textInput.style.cssText = 'flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; font-size: 0.9rem;';
        textInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                void this.savePhotoText(photo.id, textInput.value);
            }
        };

        const saveBtn = document.createElement('button');
        saveBtn.className = 'admin-save-text';
        saveBtn.dataset.id = photo.id;
        saveBtn.style.cssText = 'background: #4caf50; padding: 6px 12px; font-size: 0.8rem; flex-shrink: 0;';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
            void this.savePhotoText(photo.id, textInput.value);
        };

        rowBottom.append(emoji, textInput, saveBtn);
        wrapper.append(rowTop, rowBottom);

        return wrapper;
    }

    private createAudioSection(audio: StoredAsset): HTMLDivElement {
        const container = document.createElement('div');

        const topRow = document.createElement('div');
        topRow.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;';

        const icon = document.createElement('span');
        icon.style.cssText = 'font-size: 1.5rem;';
        icon.textContent = '🎵';

        const name = document.createElement('span');
        name.style.cssText = 'flex: 1; font-size: 0.9rem;';
        name.textContent = audio.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.style.cssText = 'background: #e91e63; padding: 6px 12px; font-size: 0.8rem;';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            void this.deleteAudio();
        };

        topRow.append(icon, name, deleteBtn);

        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.src = audio.url;
        audioEl.style.cssText = 'width: 100%; margin-top: 10px;';

        container.append(topRow, audioEl);
        return container;
    }

    private createPreviewItem(photo: StoredAsset, index: number): HTMLDivElement {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);';

        const img = document.createElement('img');
        img.src = photo.url;
        img.style.cssText = 'width: 50px; height: 50px; object-fit: cover; border-radius: 6px; flex-shrink: 0;';

        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';

        const slideLabel = document.createElement('div');
        slideLabel.style.cssText = 'font-size: 0.75rem; color: #888;';
        slideLabel.textContent = `Slide ${index + 1}`;

        const text = document.createElement('div');
        text.style.cssText = 'font-size: 0.9rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        text.textContent = photo.text || '(no text)';

        info.append(slideLabel, text);
        row.append(img, info);

        return row;
    }

    updateUI() {
        const photoList = document.getElementById('admin-photo-list');
        if (photoList) {
            this.clearChildren(photoList);
            if (this.photos.length === 0) {
                photoList.appendChild(this.createEmptyMessage('No photos uploaded yet'));
            } else {
                this.photos.forEach((photo, index) => {
                    photoList.appendChild(this.createPhotoItem(photo, index));
                });
            }
        }

        const audioInfo = document.getElementById('admin-audio-info');
        if (audioInfo) {
            this.clearChildren(audioInfo);
            if (this.audio) {
                audioInfo.appendChild(this.createAudioSection(this.audio));
            } else {
                audioInfo.appendChild(this.createEmptyMessage('No custom audio uploaded'));
            }
        }

        this.updatePreview();
    }

    updatePreview() {
        const preview = document.getElementById('admin-preview');
        if (!preview) return;

        this.clearChildren(preview);

        if (this.photos.length === 0) {
            preview.appendChild(this.createEmptyMessage('Upload photos to see preview'));
            return;
        }

        const title = document.createElement('div');
        title.style.cssText = 'text-align: center; margin-bottom: 10px; color: var(--primary);';
        title.textContent = `Slideshow will show ${this.photos.length} photo(s)`;

        const list = document.createElement('div');
        list.style.cssText = 'max-height: 250px; overflow-y: auto; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;';

        this.photos.forEach((photo, index) => {
            list.appendChild(this.createPreviewItem(photo, index));
        });

        preview.append(title, list);
    }

    async deletePhoto(id: string) {
        try {
            await storage.deleteAsset(id);
            this.sm.audio.play('click');
            await this.loadExistingAssets();
            this.updateUI();
        } catch (err) {
            console.error('Failed to delete photo:', err);
        }
    }

    async savePhotoText(id: string, text: string) {
        try {
            await storage.updatePhotoText(id, text);
            this.sm.audio.play('click');

            const btn = document.querySelector(`.admin-save-text[data-id="${id}"]`) as HTMLButtonElement;
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = '✓ Saved';
                btn.style.background = '#2196f3';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '#4caf50';
                }, 1500);
            }

            const photo = this.photos.find(p => p.id === id);
            if (photo) {
                photo.text = text;
            }

            this.updatePreview();
        } catch (err) {
            console.error('Failed to save photo text:', err);
            alert('Failed to save text');
        }
    }

    async deleteAudio() {
        if (!this.audio) return;
        try {
            await storage.deleteAsset(this.audio.id);
            await storage.setConfig('useCustomBGM', false);
            this.sm.audio.play('click');
            await this.loadExistingAssets();
            this.updateUI();
        } catch (err) {
            console.error('Failed to delete audio:', err);
        }
    }

    async resetToDefaults() {
        if (!confirm('This will delete all custom photos and audio. Continue?')) return;

        try {
            const allAssets = await storage.getAllAssets();
            for (const asset of allAssets) {
                await storage.deleteAsset(asset.id);
            }
            await storage.setConfig('useCustomBGM', false);

            this.photos = [];
            this.audio = null;
            this.sm.audio.play('click');
            this.updateUI();
        } catch (err) {
            console.error('Failed to reset:', err);
        }
    }

    private async syncRuntimeContent() {
        try {
            await GameData.loadCustomContent();
        } catch (err) {
            console.error('Failed to sync runtime content:', err);
            GameData.resetToDefaults();
        }

        this.sm.audio.setupBGM();
    }

    async returnToIntro() {
        await this.syncRuntimeContent();
        const { IntroState } = await import('./intro.ts');
        this.sm.changeState(new IntroState(this.sm));
    }

    update(_dt: number) { }

    draw(r: Renderer) {
        r.clear('#1a1a2e');
    }

    exit() {
        this.eventListeners.forEach(({ el, type, handler }) => {
            el.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        UIManager.hideScreen('admin-screen');
    }

    resize(_w: number, _h: number) { }
}

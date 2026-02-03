import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { storage, StoredAsset } from "../engine/storage";

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

        // Initialize storage
        try {
            await storage.init();
        } catch (e) {
            console.error('Failed to init storage:', e);
            alert('Storage not supported in this browser');
            this.returnToIntro();
            return;
        }

        this.setupEventListeners();
        await this.loadExistingAssets();
        this.updateUI();
    }

    setupEventListeners() {
        // Photo upload
        const photoInput = document.getElementById('admin-photo-input') as HTMLInputElement;
        const addPhotoBtn = document.getElementById('admin-add-photo');
        
        if (addPhotoBtn && photoInput) {
            const handler = () => photoInput.click();
            addPhotoBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: addPhotoBtn, type: 'click', handler });

            const changeHandler = (e: Event) => this.handlePhotoUpload(e);
            photoInput.addEventListener('change', changeHandler);
            this.eventListeners.push({ el: photoInput, type: 'change', handler: changeHandler as EventListener });
        }

        // Audio upload
        const audioInput = document.getElementById('admin-audio-input') as HTMLInputElement;
        const addAudioBtn = document.getElementById('admin-add-audio');
        
        if (addAudioBtn && audioInput) {
            const handler = () => audioInput.click();
            addAudioBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: addAudioBtn, type: 'click', handler });

            const changeHandler = (e: Event) => this.handleAudioUpload(e);
            audioInput.addEventListener('change', changeHandler);
            this.eventListeners.push({ el: audioInput, type: 'change', handler: changeHandler as EventListener });
        }

        // Back button
        const backBtn = document.getElementById('admin-back');
        if (backBtn) {
            const handler = () => this.returnToIntro();
            backBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: backBtn, type: 'click', handler });
        }

        // Reset button
        const resetBtn = document.getElementById('admin-reset');
        if (resetBtn) {
            const handler = () => this.resetToDefaults();
            resetBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: resetBtn, type: 'click', handler });
        }
    }

    async handlePhotoUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                console.warn('Skipping non-image file:', file.name);
                continue;
            }

            const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                await storage.saveAsset(id, 'photo', file.name, file);
                this.sm.audio.play('click');
            } catch (err) {
                console.error('Failed to save photo:', err);
            }
        }

        input.value = ''; // Reset input
        await this.loadExistingAssets();
        this.updateUI();
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

        // Delete existing audio first
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

    updateUI() {
        // Update photo list
        const photoList = document.getElementById('admin-photo-list');
        if (photoList) {
            if (this.photos.length === 0) {
                photoList.innerHTML = '<p style="color: #888; text-align: center;">No photos uploaded yet</p>';
            } else {
                photoList.innerHTML = this.photos.map((photo, index) => `
                    <div class="admin-item" data-id="${photo.id}" style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${photo.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.85rem; color: #888; margin-bottom: 4px;">Slide ${index + 1}</div>
                                <div style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${photo.name}</div>
                            </div>
                            <button class="admin-delete-photo" data-id="${photo.id}" style="background: #e91e63; padding: 6px 12px; font-size: 0.8rem; flex-shrink: 0;">Delete</button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1rem;">💬</span>
                            <input type="text" class="admin-photo-text" data-id="${photo.id}" 
                                value="${photo.text || ''}" 
                                placeholder="Enter a sweet message for this photo..."
                                style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; font-size: 0.9rem;">
                            <button class="admin-save-text" data-id="${photo.id}" style="background: #4caf50; padding: 6px 12px; font-size: 0.8rem; flex-shrink: 0;">Save</button>
                        </div>
                    </div>
                `).join('');

                // Add delete handlers
                photoList.querySelectorAll('.admin-delete-photo').forEach(btn => {
                    const handler = (e: Event) => {
                        const id = (e.target as HTMLElement).getAttribute('data-id')!;
                        this.deletePhoto(id);
                    };
                    btn.addEventListener('click', handler as EventListener);
                    this.eventListeners.push({ el: btn as HTMLElement, type: 'click', handler: handler as EventListener });
                });

                // Add text input handlers (save on button click)
                photoList.querySelectorAll('.admin-save-text').forEach(btn => {
                    const handler = (e: Event) => {
                        const id = (e.target as HTMLElement).getAttribute('data-id')!;
                        const input = photoList.querySelector(`.admin-photo-text[data-id="${id}"]`) as HTMLInputElement;
                        if (input) {
                            this.savePhotoText(id, input.value);
                        }
                    };
                    btn.addEventListener('click', handler as EventListener);
                    this.eventListeners.push({ el: btn as HTMLElement, type: 'click', handler: handler as EventListener });
                });

                // Add enter key handler for text inputs
                photoList.querySelectorAll('.admin-photo-text').forEach(input => {
                    const handler = (e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            const id = (e.target as HTMLElement).getAttribute('data-id')!;
                            this.savePhotoText(id, (e.target as HTMLInputElement).value);
                        }
                    };
                    input.addEventListener('keypress', handler as EventListener);
                    this.eventListeners.push({ el: input as HTMLElement, type: 'keypress', handler: handler as EventListener });
                });
            }
        }

        // Update audio info
        const audioInfo = document.getElementById('admin-audio-info');
        if (audioInfo) {
            if (this.audio) {
                audioInfo.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <span style="font-size: 1.5rem;">🎵</span>
                        <span style="flex: 1; font-size: 0.9rem;">${this.audio.name}</span>
                        <button id="admin-delete-audio" style="background: #e91e63; padding: 6px 12px; font-size: 0.8rem;">Delete</button>
                    </div>
                    <audio controls style="width: 100%; margin-top: 10px;" src="${this.audio.url}"></audio>
                `;

                const deleteAudioBtn = document.getElementById('admin-delete-audio');
                if (deleteAudioBtn) {
                    const handler = () => this.deleteAudio();
                    deleteAudioBtn.addEventListener('click', handler);
                    this.eventListeners.push({ el: deleteAudioBtn, type: 'click', handler });
                }
            } else {
                audioInfo.innerHTML = '<p style="color: #888; text-align: center;">No custom audio uploaded</p>';
            }
        }

        // Update preview
        this.updatePreview();
    }

    updatePreview() {
        const preview = document.getElementById('admin-preview');
        if (!preview) return;

        if (this.photos.length === 0) {
            preview.innerHTML = '<p style="color: #888; text-align: center;">Upload photos to see preview</p>';
            return;
        }

        preview.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px; color: var(--primary);">
                Slideshow will show ${this.photos.length} photo(s)
            </div>
            <div style="max-height: 250px; overflow-y: auto; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                ${this.photos.map((p, i) => `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <img src="${p.url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #888;">Slide ${i + 1}</div>
                            <div style="font-size: 0.9rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.text || '(no text)'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
            
            // Show visual feedback
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
            
            // Update local data
            const photo = this.photos.find(p => p.id === id);
            if (photo) {
                photo.text = text;
            }
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
            // Delete all assets
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

    returnToIntro() {
        import('./intro.ts').then(({ IntroState }) => {
            this.sm.changeState(new IntroState(this.sm));
        });
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

import { createAudio } from './audio.js';
import { today } from './dates.js';
import { loadProgress, saveProgress, loadSettings, saveSettings } from './storage.js';
import { h, announce, focusSoon, infoDialog } from './ui/dom.js';
import { renderScene } from './ui/scene.js';
import { renderHome } from './ui/home.js';
import { renderPractice } from './ui/practice.js';
import { renderResults } from './ui/results.js';
import { renderParent } from './ui/parent.js';
import { renderSettings } from './ui/settings.js';
import { renderLessons } from './ui/lessons.js';

const storage = window.localStorage;
const loaded = loadProgress(storage);
const settings = loadSettings(storage);
const main = document.getElementById('main');
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let counter = 0;
const ctx = {
  storage,
  progress: loaded.progress,
  settings,
  today: today(window.location.search),
  audio: createAudio(() => settings),
  newId: (p) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  persist() {
    if (!saveProgress(storage, ctx.progress)) {
      announce('Warning: progress could not be saved in this browser.');
      if (!ctx.warnedSave) { ctx.warnedSave = true; infoDialog({ title: 'Progress not saved', message: 'This browser could not save progress (private window or full storage). Practice still works, but it will not be remembered.' }); }
    }
  },
  saveSettings: () => saveSettings(storage, settings),
  replaceProgress(p) { ctx.progress = p; },
  applyMotion() {
    const reduced = settings.motion === 'reduced' || (settings.motion === 'system' && reduceQuery.matches);
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  },
  download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  go(screen, params = {}) {
    ctx.audio.stopSpeech();
    if (navigator.userActivation?.hasBeenActive) ctx.audio.unlock();
    const views = {
      lessons: renderLessons, home: renderHome, practice: renderPractice, results: renderResults, parent: renderParent, settings: renderSettings,
    };
    document.body.dataset.screen = screen;
    main.replaceChildren(views[screen](ctx, params));
    window.scrollTo(0, 0);
    focusSoon(main.querySelector('[data-autofocus]') ?? main);
  },
};

reduceQuery.addEventListener('change', ctx.applyMotion);
ctx.applyMotion();
renderScene(document.getElementById('scene'));
ctx.go('home');

if (loaded.status === 'unreadable') {
  infoDialog({ title: 'Saved progress could not be read', message: 'Stored progress was unreadable, so the app started empty. The unreadable data was kept in this browser and has not been deleted.' });
}

// Gemeinsame GSAP-UI-Helfer für alle Seiten auf markusstuhr.de
// Nutzung:  import { gsap, ui } from '/lib/ui.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/index.js';

export { gsap };

export const ui = {
  // Panel/Overlay einblenden: Hintergrund faden, Kinder gestaffelt hochfahren
  panelIn(el, { stagger = 0.08 } = {}) {
    el.style.display = 'flex';
    const tl = gsap.timeline();
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
      .fromTo(el.children, { y: 30, autoAlpha: 0, scale: 0.96 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, stagger, ease: 'back.out(1.7)' }, '<0.1');
    return tl;
  },
  panelOut(el) {
    return gsap.timeline({ onComplete: () => { el.style.display = 'none'; } })
      .to(el.children, { y: -20, autoAlpha: 0, duration: 0.25, stagger: 0.04, ease: 'power2.in' })
      .to(el, { autoAlpha: 0, duration: 0.25 }, '<0.1');
  },
  // Großer Schriftzug, der reinploppt und wieder verschwindet
  banner(el, text, hold = 1.4) {
    gsap.killTweensOf(el);
    el.textContent = text;
    return gsap.timeline()
      .fromTo(el, { autoAlpha: 0, scale: 2.2, letterSpacing: '0.6em' },
        { autoAlpha: 1, scale: 1, letterSpacing: '0.08em', duration: 0.5, ease: 'expo.out' })
      .to(el, { autoAlpha: 0, y: -30, duration: 0.4, ease: 'power2.in' }, `+=${hold}`)
      .set(el, { y: 0 });
  },
  // Zahl hochzählen (Score o.ä.)
  countTo(el, value, duration = 0.5) {
    const o = { v: +el.dataset.v || 0 };
    el.dataset.v = value;
    gsap.to(o, { v: value, duration, ease: 'power1.out', overwrite: true,
      onUpdate: () => { el.textContent = Math.round(o.v); } });
  },
  // Kurzer Aufmerksamkeits-Puls
  pulse(el, color) {
    gsap.fromTo(el, { scale: 1.35, color: color || 'inherit' },
      { scale: 1, color: '', duration: 0.45, ease: 'elastic.out(1,0.4)', clearProps: 'color' });
  },
  // Balken (Breite in %) weich nachführen
  bar(el, frac) {
    gsap.to(el, { width: Math.max(0, Math.min(1, frac)) * 100 + '%', duration: 0.25, overwrite: true });
  },
  // Wackeln bei Schaden
  shake(el, strength = 8) {
    gsap.fromTo(el, { x: -strength }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.2)' });
  },
  // Bildschirmblitz (z.B. Treffer, Pickup)
  flash(color = '#fff', opacity = 0.5) {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', inset: 0, background: color, pointerEvents: 'none', zIndex: 999 });
    document.body.appendChild(d);
    gsap.fromTo(d, { opacity }, { opacity: 0, duration: 0.35, onComplete: () => d.remove() });
  },
};

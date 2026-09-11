/* Dolphin Marine — comportamenti del sito. Nessuna libreria esterna. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- testata */

  const head = $('#siteHead');
  const hero = $('.hero');
  if (!hero) document.body.classList.add('no-hero');

  const onScroll = () => {
    const soglia = hero ? Math.min(hero.offsetHeight - 120, 420) : 10;
    head.classList.toggle('stuck', scrollY > soglia);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------- menu mobile */

  const burger = $('#burger'), nav = $('#mainnav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const aperto = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(aperto));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ------------------------------------------------------- scelta lingua */

  const lsBtn = $('.langsw-btn'), lsMenu = $('#langmenu');
  if (lsBtn && lsMenu) {
    const chiudi = () => { lsMenu.hidden = true; lsBtn.setAttribute('aria-expanded', 'false'); };
    lsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const apri = lsMenu.hidden;
      lsMenu.hidden = !apri;
      lsBtn.setAttribute('aria-expanded', String(apri));
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.langsw')) chiudi(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') chiudi(); });
  }

  /* ------------------------------------------- comparsa dei blocchi */

  const reveal = $$('[data-reveal]');
  if (ridotto || !('IntersectionObserver' in window)) {
    reveal.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((voci) => {
      voci.forEach((v, i) => {
        if (!v.isIntersecting) return;
        /* scaglionamento leggero fra elementi vicini: dà ritmo senza far aspettare */
        setTimeout(() => v.target.classList.add('in'), Math.min(i * 70, 280));
        io.unobserve(v.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveal.forEach(el => io.observe(el));
  }

  /* --------------------------------------------------- video nella testata

     Parte solo su schermi grandi, con rete decente e se l'utente non ha
     chiesto meno animazioni: sul telefono resta la foto, che è già pronta. */

  const hv = $('#heroVideo');
  if (hv && !ridotto && innerWidth >= 900 && !(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')))) {
    const avvia = () => {
      hv.preload = 'auto';
      hv.play().then(() => hv.classList.add('on')).catch(() => {});
    };
    if (document.readyState === 'complete') setTimeout(avvia, 600);
    else addEventListener('load', () => setTimeout(avvia, 600));

    /* fermalo quando esce dallo schermo: non serve consumare batteria */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([v]) => { v.isIntersecting ? hv.play().catch(() => {}) : hv.pause(); }, { threshold: 0.1 })
        .observe(hv);
    }
  }

  /* ------------------------------------------------------------ galleria */

  const gal = $('#gallery');
  if (gal) {
    const voci = $$('.gal-item', gal);
    let i = 0, lb = null, ultimoFocus = null;

    const testi = {
      chiudi: gal.dataset.chiudi || 'Close',
      prev: gal.dataset.prev || 'Previous',
      next: gal.dataset.next || 'Next',
    };

    function apri(n) {
      i = n;
      ultimoFocus = document.activeElement;
      if (!lb) {
        lb = document.createElement('div');
        lb.className = 'lb';
        lb.innerHTML =
          '<img alt="">' +
          '<p class="lb-cap"></p>' +
          '<button type="button" class="lb-btn lb-close" aria-label="' + testi.chiudi + '"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
          '<button type="button" class="lb-btn lb-prev" aria-label="' + testi.prev + '"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg></button>' +
          '<button type="button" class="lb-btn lb-next" aria-label="' + testi.next + '"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg></button>';
        document.body.appendChild(lb);
        lb.addEventListener('click', (e) => {
          if (e.target === lb || e.target.closest('.lb-close')) chiudi();
          else if (e.target.closest('.lb-prev')) mostra(i - 1);
          else if (e.target.closest('.lb-next')) mostra(i + 1);
        });
      }
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      mostra(i);
      $('.lb-close', lb).focus();
      document.addEventListener('keydown', tasti);
    }

    function mostra(n) {
      i = (n + voci.length) % voci.length;
      const b = voci[i];
      const img = $('img', lb);
      img.src = b.dataset.full;
      img.alt = b.dataset.alt || '';
      $('.lb-cap', lb).textContent = b.dataset.alt || '';
    }

    function chiudi() {
      lb.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', tasti);
      if (ultimoFocus) ultimoFocus.focus();
    }

    function tasti(e) {
      if (e.key === 'Escape') chiudi();
      else if (e.key === 'ArrowLeft') mostra(i - 1);
      else if (e.key === 'ArrowRight') mostra(i + 1);
      else if (e.key === 'Tab' && lb) {
        /* il fuoco resta dentro la finestra finché è aperta */
        const f = $$('.lb-btn', lb);
        const primo = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
      }
    }

    voci.forEach((b, n) => b.addEventListener('click', () => apri(n)));
  }

  /* --------------------------------------------------------------- FAQ

     Una sola risposta aperta per volta: la pagina resta leggibile. */

  const faq = $$('.faq-item');
  faq.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach(a => { if (a !== d) a.open = false; });
  }));

  /* --------------------------------------------------- consenso ai cookie */

  const CHIAVE = 'dm-consenso';
  const cc = $('#cc'), pannello = $('#ccPanel');
  if (cc && pannello) {
    const leggi = () => { try { return JSON.parse(localStorage.getItem(CHIAVE) || 'null'); } catch { return null; } };
    const scrivi = (v) => { try { localStorage.setItem(CHIAVE, JSON.stringify(v)); } catch {} };

    const linguetta = $('#ccTab');

    const mostraPannello = () => {
      const v = leggi();
      if (v) $('#ccStats').checked = !!v.stat;
      pannello.hidden = false;
      if (linguetta) { linguetta.hidden = true; linguetta.setAttribute('aria-expanded', 'true'); }
    };

    /* Chiuso il pannello resta la linguetta: la scelta sui cookie si può
       cambiare in qualsiasi momento, senza cercare il link nel piede. */
    const nascondi = () => {
      pannello.hidden = true;
      if (linguetta) { linguetta.hidden = false; linguetta.setAttribute('aria-expanded', 'false'); }
    };

    if (leggi()) { if (linguetta) linguetta.hidden = false; }
    else setTimeout(mostraPannello, 900);

    $('#ccAccept').addEventListener('click', () => { scrivi({ stat: true, d: Date.now() }); nascondi(); });
    $('#ccReject').addEventListener('click', () => { scrivi({ stat: false, d: Date.now() }); nascondi(); });
    $('#ccPrefsBtn').addEventListener('click', () => {
      $('#ccPrefs').hidden = false;
      $('#ccPrefsBtn').hidden = true;
      $('#ccSave').hidden = false;
    });
    $('#ccSave').addEventListener('click', () => { scrivi({ stat: $('#ccStats').checked, d: Date.now() }); nascondi(); });

    if (linguetta) linguetta.addEventListener('click', mostraPannello);

    const riapri = $('#ccOpen');
    if (riapri) riapri.addEventListener('click', mostraPannello);
  }

  /* ------------------------------------------- conferma dopo l'invio form */

  const esito = location.search.match(/[?&](ok|errore)=([^&]*)/);
  if (esito) {
    const f = $('#contactForm');
    if (f) {
      const andata = esito[1] === 'ok';
      const box = document.createElement('p');
      box.className = andata ? 'chiusura chiusura-ok' : 'chiusura chiusura-ko';
      box.textContent = andata ? (f.dataset.ok || 'OK') : (f.dataset.ko || '');
      box.setAttribute('role', 'status');
      f.parentNode.insertBefore(box, f);
      if (andata) f.reset();
      box.scrollIntoView({ block: 'center' });
    }
  }
})();

// Header scroll state
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, {passive:true});

// Mobile nav
const burger = document.getElementById('burger');
function closeMobileNav(){
  header.classList.remove('nav-open');
  burger.setAttribute('aria-expanded', false);
  document.body.classList.remove('no-scroll');
}
burger.addEventListener('click', () => {
  const open = header.classList.toggle('nav-open');
  burger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('no-scroll', open);
});
document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', closeMobileNav));
// Close when tapping the backdrop (click landing on header itself, not its children)
header.addEventListener('click', (e) => {
  if(header.classList.contains('nav-open') && e.target === header) closeMobileNav();
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
}, {threshold:.15});
revealEls.forEach(el => io.observe(el));

// Animated counters
const counters = document.querySelectorAll('.stat .num');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      function tick(now){
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    }
  });
}, {threshold:.4});
counters.forEach(c => counterIO.observe(c));

// Testimonial carousel
const track = document.getElementById('carousel-track');
const slides = track.children.length;
const dotsWrap = document.getElementById('carousel-dots');
let current = 0;
for(let i=0;i<slides;i++){
  const d = document.createElement('span');
  if(i===0) d.classList.add('active');
  d.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(d);
}
function goTo(i){
  current = (i + slides) % slides;
  track.style.transform = `translateX(-${current*100}%)`;
  [...dotsWrap.children].forEach((d,idx)=>d.classList.toggle('active', idx===current));
}
document.getElementById('prevBtn').addEventListener('click', () => goTo(current-1));
document.getElementById('nextBtn').addEventListener('click', () => goTo(current+1));
let autoplay = setInterval(() => goTo(current+1), 6000);
[document.getElementById('prevBtn'), document.getElementById('nextBtn')].forEach(b=>{
  b.addEventListener('click', () => { clearInterval(autoplay); autoplay = setInterval(() => goTo(current+1), 6000); });
});

// Réalisations gallery lightbox
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
if (lightbox && galleryItems.length) {
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let galleryIndex = 0;

  function openLightbox(i) {
    galleryIndex = (i + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    const img = item.querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = item.dataset.caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => openLightbox(galleryIndex - 1));
  document.getElementById('lightboxNext').addEventListener('click', () => openLightbox(galleryIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(galleryIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(galleryIndex + 1);
  });
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if(!isOpen){
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// Submit a form to Formspree via AJAX and resolve only on a genuine success.
// Accept: application/json makes Formspree respond with JSON instead of a redirect,
// and a 200 response can still carry an `errors` array (e.g. bad field), so both
// the HTTP status and the payload must be checked before treating this as success.
function submitToFormspree(form) {
  return fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' }
  }).then((response) => {
    return response.json().catch(() => ({})).then((data) => {
      if (!response.ok || data.errors) {
        const detail = data.errors ? data.errors.map((er) => er.message).join(', ') : response.status;
        throw new Error('Formspree submission failed: ' + detail);
      }
      return data;
    });
  });
}

// Devis form
const devisForm = document.getElementById('devisForm');
const devisError = document.getElementById('devisError');
devisForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const submitBtn = devisForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';
  if (devisError) { devisError.hidden = true; devisError.classList.remove('show'); }

  submitToFormspree(devisForm)
    .then(() => {
      devisForm.style.display = 'none';
      document.getElementById('formSuccess').classList.add('show');
    })
    .catch((err) => {
      console.error('[devis form]', err);
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      if (devisError) { devisError.hidden = false; devisError.classList.add('show'); }
    });
});

// Contact form
const contactForm = document.getElementById('contactForm');
const contactError = document.getElementById('contactError');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const btn = contactForm.querySelector('button');
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Envoi en cours…';
  if (contactError) { contactError.hidden = true; contactError.classList.remove('show'); }

  submitToFormspree(contactForm)
    .then(() => {
      btn.textContent = 'Message envoyé ✓';
      contactForm.reset();
      setTimeout(() => { btn.textContent = originalLabel; btn.disabled = false; }, 3000);
    })
    .catch((err) => {
      console.error('[contact form]', err);
      btn.disabled = false;
      btn.textContent = originalLabel;
      if (contactError) { contactError.hidden = false; contactError.classList.add('show'); }
    });
});

// Upload box filename feedback
const photosInput = document.getElementById('photos');
const uploadBox = document.querySelector('.upload-box');
photosInput.addEventListener('change', () => {
  if(photosInput.files.length){
    uploadBox.lastChild.previousSibling.textContent = photosInput.files.length + ' photo(s) sélectionnée(s)';
  }
});

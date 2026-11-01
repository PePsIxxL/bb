(function () {
  const app = document.getElementById('app');
  const footerText = document.getElementById('footer-text');
  const navLogo = document.getElementById('nav-logo');
  const navToggle = document.getElementById('nav-toggle');
  const navMobile = document.getElementById('nav-mobile');

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function youtubeEmbed(url) {
    if (!url) return '';
    let id = '';
    try {
      if (url.includes('/embed/')) return url;
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else id = u.searchParams.get('v') || '';
    } catch {
      return url;
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  function formatEmail(email) {
    const raw = String(email || '').trim();
    if (!raw || raw.includes('[')) return escapeHtml(raw);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return `<a href="mailto:${escapeHtml(raw)}">${escapeHtml(raw)}</a>`;
    }
    return escapeHtml(raw);
  }

  function formatPhone(phone) {
    const raw = String(phone || '').trim();
    if (!raw || raw.includes('[')) return escapeHtml(raw);
    const tel = raw.replace(/[^\d+]/g, '');
    if (tel.length >= 9) {
      return `<a href="tel:${escapeHtml(tel)}">${escapeHtml(raw)}</a>`;
    }
    return escapeHtml(raw);
  }

  function renderSocial(social) {
    const labels = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      telegram: 'Telegram'
    };
    return Object.entries(labels)
      .map(([key, label]) => {
        const href = social[key];
        if (!href || !String(href).trim()) return '';
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      })
      .filter(Boolean)
      .join('');
  }

  function render(data) {
    document.title = data.site.title;
    navLogo.textContent = data.site.title;
    footerText.textContent = data.footer.text;

    app.innerHTML = `
      <section class="hero" id="home">
        <div class="container hero-grid reveal">
          <div>
            <span class="hero-badge">${escapeHtml(data.site.title)}</span>
            <h1><span class="owner-name">${escapeHtml(data.site.ownerName)}</span></h1>
            <p class="profession">${escapeHtml(data.site.profession)}</p>
            <p class="intro">${escapeHtml(data.site.heroIntro)}</p>
            <p class="motto">${escapeHtml(data.site.heroMotto)}</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#portfolio">${escapeHtml(data.site.buttonPortfolio)}</a>
              <a class="btn btn-outline" href="#contacts">${escapeHtml(data.site.buttonContacts)}</a>
            </div>
          </div>
          <div class="hero-image-wrap">
            <img src="${escapeHtml(data.site.heroImage)}" alt="Фото ${escapeHtml(data.site.ownerName)}">
          </div>
        </div>
      </section>

      <section id="about">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.about.title)}</h2>
          </div>
          <div class="about-grid">
            <div class="about-photo reveal">
              <img src="${escapeHtml(data.about.photo)}" alt="Про ${escapeHtml(data.site.ownerName)}">
            </div>
            <div class="about-blocks reveal">
              <div class="info-card"><h3>Біографія</h3><p>${escapeHtml(data.about.bio)}</p></div>
              <div class="info-card"><h3>Освіта / напрям</h3><p>${escapeHtml(data.about.education)}</p></div>
              <div class="info-card"><h3>Інтереси</h3><p>${escapeHtml(data.about.interests)}</p></div>
              <div class="info-card"><h3>Сильні сторони</h3><p>${escapeHtml(data.about.strengths)}</p></div>
              <div class="info-card"><h3>Цінності</h3><p>${escapeHtml(data.about.values)}</p></div>
              <div class="info-card"><h3>Цілі</h3><p>${escapeHtml(data.about.goalsShort)}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" style="background: #f1f5f9;">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.skills.title)}</h2>
            <p>${escapeHtml(data.skills.subtitle)}</p>
          </div>
          <div class="skills-grid">
            ${data.skills.items
              .map(
                (s) => `
              <article class="skill-card reveal">
                <div class="skill-icon">${escapeHtml(s.icon)}</div>
                <h3>${escapeHtml(s.name)}</h3>
                <p>${escapeHtml(s.description)}</p>
              </article>`
              )
              .join('')}
          </div>
        </div>
      </section>

      <section id="portfolio">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.portfolio.title)}</h2>
            <p>${escapeHtml(data.portfolio.subtitle)}</p>
          </div>
          <div class="portfolio-grid">
            ${data.portfolio.items
              .map((p) => {
                const badge = p.isExample
                  ? '<span class="project-badge">Приклад (замініть на свій проєкт)</span>'
                  : '';
                const link =
                  p.link && String(p.link).trim()
                    ? `<a class="project-link" href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer">Переглянути проєкт →</a>`
                    : '';
                return `
              <article class="project-card reveal">
                <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
                <div class="project-body">
                  ${badge}
                  <h3>${escapeHtml(p.title)}</h3>
                  <p>${escapeHtml(p.description)}</p>
                  <div class="project-skills">${escapeHtml(p.skillsUsed)}</div>
                  ${link}
                </div>
              </article>`;
              })
              .join('')}
          </div>
        </div>
      </section>

      <section id="future" style="background: #fff;">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.future.title)}</h2>
          </div>
          <div class="future-grid">
            <div class="goal-list reveal">
              <h3>Короткострокові цілі</h3>
              <ul>${data.future.shortTerm.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
            </div>
            <div class="goal-list reveal">
              <h3>Довгострокові плани</h3>
              <ul>${data.future.longTerm.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
            </div>
            <div class="goal-list reveal">
              <h3>Навички для розвитку</h3>
              <ul>${data.future.skillsToDevelop.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="timeline">
            ${data.future.timeline
              .map(
                (t) => `
              <div class="timeline-item reveal">
                <div class="timeline-period">${escapeHtml(t.period)}</div>
                <div>${escapeHtml(t.text)}</div>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="media-section" id="media">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.media.title)}</h2>
            <p>${escapeHtml(data.media.subtitle)}</p>
          </div>
          <div class="video-wrap reveal">
            ${
              youtubeEmbed(data.media.youtubeUrl)
                ? `<iframe
              src="${escapeHtml(youtubeEmbed(data.media.youtubeUrl))}"
              title="Відео"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>`
                : `<div class="video-placeholder">Вставте посилання на відео YouTube в адмін-панелі (розділ «Відео»).</div>`
            }
          </div>
          <p class="video-caption reveal">${escapeHtml(data.media.caption)}</p>
        </div>
      </section>

      <section id="contacts">
        <div class="container">
          <div class="section-head reveal">
            <h2>${escapeHtml(data.contacts.title)}</h2>
          </div>
          <div class="contacts-grid">
            <div class="reveal">
              <div class="contact-list">
                <div class="contact-item"><strong>Email:</strong> ${formatEmail(data.contacts.email)}</div>
                <div class="contact-item"><strong>Телефон:</strong> ${formatPhone(data.contacts.phone)}</div>
                <div class="contact-item"><strong>Локація:</strong> ${escapeHtml(data.contacts.location)}</div>
              </div>
              <div class="social-links">${renderSocial(data.contacts.social)}</div>
            </div>
            <form class="contact-form reveal" id="contact-form" novalidate>
              <div class="form-group">
                <label for="cf-name">Ім'я</label>
                <input type="text" id="cf-name" name="name" required autocomplete="name">
              </div>
              <div class="form-group">
                <label for="cf-email">Електронна пошта</label>
                <input type="email" id="cf-email" name="email" required autocomplete="email">
              </div>
              <div class="form-group">
                <label for="cf-message">Повідомлення</label>
                <textarea id="cf-message" name="message" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Надіслати</button>
              <p class="form-note">${escapeHtml(data.contacts.formNote)}</p>
              <div class="form-status" id="form-status" role="status"></div>
            </form>
          </div>
        </div>
      </section>
    `;

    initReveal();
    initContactForm();
    closeMobileNavOnLink();
  }

  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      const payload = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Помилка відправки');
        status.className = 'form-status success';
        status.textContent = data.message;
        form.reset();
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = err.message || 'Не вдалося надіслати повідомлення.';
      }
    });
  }

  function closeMobileNavOnLink() {
    navMobile.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navMobile.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  navToggle.addEventListener('click', () => {
    const open = navMobile.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  fetch('/api/content')
    .then((r) => r.json())
    .then(render)
    .catch(() => {
      app.innerHTML =
        '<p class="container" style="padding:3rem;color:#991b1b;">Не вдалося завантажити контент. Переконайтеся, що сервер запущено (npm start).</p>';
    });
})();

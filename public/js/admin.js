(function () {
  let content = null;

  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const toast = document.getElementById('toast');

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function api(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Помилка запиту');
    return data;
  }

  function field(label, id, value, hint, multiline) {
    if (multiline) {
      return `
      <div class="field">
        <label for="${id}">${label}</label>
        <textarea id="${id}" data-path="${id}">${escapeHtml(value)}</textarea>
        ${hint ? `<small>${hint}</small>` : ''}
      </div>`;
    }
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" data-path="${id}" value="${escapeAttr(value)}">
        ${hint ? `<small>${hint}</small>` : ''}
      </div>`;
  }

  function imageField(label, pathKey, url) {
    return `
      <div class="field" data-image-field="${pathKey}">
        <label>${label}</label>
        <div class="image-row">
          <img src="${escapeAttr(url)}" alt="" data-preview="${pathKey}">
          <input type="file" accept="image/*" data-upload="${pathKey}">
          <input type="hidden" data-path="${pathKey}" value="${escapeAttr(url)}">
        </div>
        <small>Завантажте JPG, PNG, WebP або SVG (до 5 МБ).</small>
      </div>`;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return String(s ?? '').replace(/"/g, '&quot;');
  }

  let adminShellReady = false;

  function initAdminShell() {
    if (adminShellReady) return;
    adminShellReady = true;

    document.getElementById('admin-nav').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-panel]');
      if (!btn) return;
      document.querySelectorAll('#admin-nav button').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
      if (btn.dataset.panel === 'panel-messages') renderMessagesPanel();
    });

    adminView.addEventListener('change', (e) => {
      const uploadPath = e.target.matches('[data-upload]') ? e.target.dataset.upload : null;
      if (uploadPath) {
        uploadImage(e.target, uploadPath);
        return;
      }
      if (e.target.matches('[data-upload-project]')) {
        const i = e.target.dataset.uploadProject;
        uploadFile(e.target.files[0])
          .then((url) => {
            const hidden = document.querySelector(`[data-project="${i}"][data-key="image"]`);
            const preview = document.querySelector(`[data-preview="project-${i}"]`);
            if (hidden) hidden.value = url;
            if (preview) preview.src = url;
            if (content.portfolio.items[i]) content.portfolio.items[i].image = url;
            showToast('Зображення завантажено');
          })
          .catch((err) => showToast(err.message, true));
      }
    });

    adminView.addEventListener('click', (e) => {
      if (e.target.id === 'btn-add-skill') {
        content.skills.items.push({
          id: uid('skill'),
          icon: '⭐',
          name: 'Нова навичка',
          description: 'Опис навички'
        });
        renderSkillsPanel();
        return;
      }
      if (e.target.classList.contains('btn-remove-skill')) {
        const i = Number(e.target.closest('[data-skill-index]').dataset.skillIndex);
        content.skills.items.splice(i, 1);
        renderSkillsPanel();
        return;
      }
      if (e.target.id === 'btn-add-project') {
        content.portfolio.items.push({
          id: uid('proj'),
          isExample: false,
          title: 'Новий проєкт',
          image: '/uploads/project-placeholder.svg',
          description: 'Опис проєкту',
          skillsUsed: '',
          link: ''
        });
        renderPortfolioPanel();
        return;
      }
      if (e.target.classList.contains('btn-remove-project')) {
        const i = Number(e.target.closest('[data-project-index]').dataset.projectIndex);
        content.portfolio.items.splice(i, 1);
        renderPortfolioPanel();
        return;
      }
      if (e.target.id === 'btn-add-timeline') {
        content.future.timeline.push({
          id: uid('tl'),
          period: 'Новий період',
          text: 'Опис етапу'
        });
        renderFuturePanel();
        return;
      }
      if (e.target.classList.contains('btn-remove-timeline')) {
        const i = Number(e.target.closest('[data-timeline-index]').dataset.timelineIndex);
        content.future.timeline.splice(i, 1);
        renderFuturePanel();
      }
    });
  }

  function renderAllPanels() {
    renderSitePanel();
    renderAboutPanel();
    renderSkillsPanel();
    renderPortfolioPanel();
    renderFuturePanel();
    renderMediaPanel();
    renderContactsPanel();
  }

  function renderSitePanel() {
    const s = content.site;
    document.getElementById('panel-site').innerHTML = `
      <h3>Головна сторінка</h3>
      ${field('Заголовок сайту', 'site.title', s.title)}
      ${field("Ім'я та прізвище", 'site.ownerName', s.ownerName)}
      ${field('Професія / напрям', 'site.profession', s.profession)}
      ${field('Коротке представлення', 'site.heroIntro', s.heroIntro, '', true)}
      ${field('Девіз / слоган', 'site.heroMotto', s.heroMotto)}
      ${imageField('Фото на головній', 'site.heroImage', s.heroImage)}
      ${field('Текст кнопки «Портфоліо»', 'site.buttonPortfolio', s.buttonPortfolio)}
      ${field('Текст кнопки «Контакти»', 'site.buttonContacts', s.buttonContacts)}
      ${field('Текст у підвалі', 'footer.text', content.footer.text)}
    `;
    fillInputs();
  }

  function renderAboutPanel() {
    const a = content.about;
    document.getElementById('panel-about').innerHTML = `
      <h3>Про мене</h3>
      ${field('Заголовок розділу', 'about.title', a.title)}
      ${field('Біографія', 'about.bio', a.bio, '', true)}
      ${field('Освіта', 'about.education', a.education, '', true)}
      ${field('Інтереси', 'about.interests', a.interests, '', true)}
      ${field('Сильні сторони', 'about.strengths', a.strengths, '', true)}
      ${field('Цінності', 'about.values', a.values, '', true)}
      ${field('Професійні цілі', 'about.goalsShort', a.goalsShort, '', true)}
      ${imageField('Фото', 'about.photo', a.photo)}
    `;
    fillInputs();
  }

  function renderSkillsPanel() {
    const items = content.skills.items
      .map(
        (sk, i) => `
      <div class="list-item" data-skill-index="${i}">
        <div class="list-item-head">
          <strong>Навичка ${i + 1}</strong>
          <button type="button" class="btn btn-danger btn-remove-skill">Видалити</button>
        </div>
        <div class="row-2">
          <div class="field"><label>Іконка (емодзі)</label><input type="text" data-skill="${i}" data-key="icon" value="${escapeAttr(sk.icon)}"></div>
          <div class="field"><label>Назва</label><input type="text" data-skill="${i}" data-key="name" value="${escapeAttr(sk.name)}"></div>
        </div>
        <div class="field"><label>Опис</label><textarea data-skill="${i}" data-key="description">${escapeHtml(sk.description)}</textarea></div>
      </div>`
      )
      .join('');

    document.getElementById('panel-skills').innerHTML = `
      <h3>Навички</h3>
      ${field('Заголовок', 'skills.title', content.skills.title)}
      ${field('Підзаголовок', 'skills.subtitle', content.skills.subtitle, '', true)}
      <div id="skills-list">${items}</div>
      <button type="button" class="btn btn-outline" id="btn-add-skill">+ Додати навичку</button>
    `;
    fillInputs();
  }

  function renderPortfolioPanel() {
    const items = content.portfolio.items
      .map(
        (p, i) => `
      <div class="list-item" data-project-index="${i}">
        <div class="list-item-head">
          <strong>Проєкт ${i + 1}</strong>
          <button type="button" class="btn btn-danger btn-remove-project">Видалити</button>
        </div>
        <div class="field">
          <label><input type="checkbox" data-project="${i}" data-key="isExample" ${p.isExample ? 'checked' : ''}> Позначити як «Приклад»</label>
        </div>
        <div class="field"><label>Назва</label><input type="text" data-project="${i}" data-key="title" value="${escapeAttr(p.title)}"></div>
        <div class="field" data-image-field="project-${i}">
          <label>Зображення</label>
          <div class="image-row">
            <img src="${escapeAttr(p.image)}" alt="" data-preview="project-${i}">
            <input type="file" accept="image/*" data-upload-project="${i}">
            <input type="hidden" data-project="${i}" data-key="image" value="${escapeAttr(p.image)}">
          </div>
        </div>
        <div class="field"><label>Опис</label><textarea data-project="${i}" data-key="description">${escapeHtml(p.description)}</textarea></div>
        <div class="field"><label>Використані навички</label><input type="text" data-project="${i}" data-key="skillsUsed" value="${escapeAttr(p.skillsUsed)}"></div>
        <div class="field"><label>Посилання (необов'язково)</label><input type="url" data-project="${i}" data-key="link" value="${escapeAttr(p.link)}" placeholder="https://"></div>
      </div>`
      )
      .join('');

    document.getElementById('panel-portfolio').innerHTML = `
      <h3>Портфоліо</h3>
      ${field('Заголовок', 'portfolio.title', content.portfolio.title)}
      ${field('Підзаголовок', 'portfolio.subtitle', content.portfolio.subtitle, '', true)}
      <div id="portfolio-list">${items}</div>
      <button type="button" class="btn btn-outline" id="btn-add-project">+ Додати проєкт</button>
    `;
    fillInputs();
  }

  function listEditor(title, arrKey, placeholder) {
    const lines = content.future[arrKey].join('\n');
    return `
      <div class="field">
        <label>${title}</label>
        <textarea data-future-list="${arrKey}" placeholder="${placeholder}">${escapeHtml(lines)}</textarea>
        <small>Кожен пункт — з нового рядка.</small>
      </div>`;
  }

  function renderFuturePanel() {
    const tl = content.future.timeline
      .map(
        (t, i) => `
      <div class="list-item" data-timeline-index="${i}">
        <div class="list-item-head">
          <strong>Етап ${i + 1}</strong>
          <button type="button" class="btn btn-danger btn-remove-timeline">Видалити</button>
        </div>
        <div class="field"><label>Період</label><input type="text" data-timeline="${i}" data-key="period" value="${escapeAttr(t.period)}"></div>
        <div class="field"><label>Опис</label><textarea data-timeline="${i}" data-key="text">${escapeHtml(t.text)}</textarea></div>
      </div>`
      )
      .join('');

    document.getElementById('panel-future').innerHTML = `
      <h3>Цілі та Future Skills</h3>
      ${field('Заголовок', 'future.title', content.future.title)}
      ${listEditor('Короткострокові цілі', 'shortTerm', 'Один пункт на рядок')}
      ${listEditor('Довгострокові плани', 'longTerm', 'Один пункт на рядок')}
      ${listEditor('Навички для розвитку', 'skillsToDevelop', 'Один пункт на рядок')}
      <h4>Часова шкала</h4>
      <div id="timeline-list">${tl}</div>
      <button type="button" class="btn btn-outline" id="btn-add-timeline">+ Додати етап</button>
    `;
    fillInputs();
  }

  function renderMediaPanel() {
    document.getElementById('panel-media').innerHTML = `
      <h3>Мультимедія</h3>
      ${field('Заголовок', 'media.title', content.media.title)}
      ${field('Підзаголовок', 'media.subtitle', content.media.subtitle, '', true)}
      ${field('Посилання YouTube', 'media.youtubeUrl', content.media.youtubeUrl, 'Повне посилання або embed URL')}
      ${field('Підпис під відео', 'media.caption', content.media.caption, '', true)}
    `;
    fillInputs();
  }

  function renderContactsPanel() {
    const c = content.contacts;
    document.getElementById('panel-contacts').innerHTML = `
      <h3>Контакти та соцмережі</h3>
      ${field('Заголовок', 'contacts.title', c.title)}
      ${field('Email', 'contacts.email', c.email)}
      ${field('Телефон', 'contacts.phone', c.phone)}
      ${field('Локація', 'contacts.location', c.location)}
      ${field('Instagram (URL)', 'contacts.social.instagram', c.social.instagram)}
      ${field('Facebook (URL)', 'contacts.social.facebook', c.social.facebook)}
      ${field('LinkedIn (URL)', 'contacts.social.linkedin', c.social.linkedin)}
      ${field('Telegram (URL)', 'contacts.social.telegram', c.social.telegram)}
      ${field('Примітка під формою', 'contacts.formNote', c.formNote, '', true)}
    `;
    fillInputs();
  }

  async function renderMessagesPanel() {
    const panel = document.getElementById('panel-messages');
    panel.innerHTML = '<p>Завантаження…</p>';
    try {
      const messages = await api('/api/messages');
      if (!messages.length) {
        panel.innerHTML = '<h3>Повідомлення з форми</h3><p>Поки немає повідомлень.</p>';
        return;
      }
      panel.innerHTML = `
        <h3>Повідомлення з форми</h3>
        <div class="messages-list">
          ${messages
            .slice()
            .reverse()
            .map(
              (m) => `
            <div class="message-item">
              <strong>${escapeHtml(m.name)}</strong> · ${escapeHtml(m.email)}<br>
              <small>${escapeHtml(m.createdAt)}</small>
              <p>${escapeHtml(m.message)}</p>
            </div>`
            )
            .join('')}
        </div>`;
    } catch (e) {
      panel.innerHTML = `<p style="color:#991b1b;">${escapeHtml(e.message)}</p>`;
    }
  }

  function fillInputs() {
    document.querySelectorAll('[data-path]').forEach((el) => {
      const path = el.dataset.path;
      const val = getByPath(content, path);
      if (el.tagName === 'TEXTAREA') el.value = val ?? '';
      else el.value = val ?? '';
    });
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  }

  function setByPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function collectFromForm() {
    document.querySelectorAll('[data-path]').forEach((el) => {
      setByPath(content, el.dataset.path, el.value);
    });

    document.querySelectorAll('[data-skill]').forEach((el) => {
      const i = Number(el.dataset.skill);
      const key = el.dataset.key;
      if (!content.skills.items[i]) return;
      content.skills.items[i][key] = el.value;
    });

    content.portfolio.items.forEach((item, i) => {
      const cb = document.querySelector(`input[type="checkbox"][data-project="${i}"][data-key="isExample"]`);
      item.isExample = cb ? cb.checked : !!item.isExample;
    });

    document.querySelectorAll('[data-project]').forEach((el) => {
      const i = Number(el.dataset.project);
      const key = el.dataset.key;
      if (!content.portfolio.items[i] || key === 'isExample') return;
      content.portfolio.items[i][key] = el.value;
    });

    document.querySelectorAll('[data-future-list]').forEach((el) => {
      const key = el.dataset.futureList;
      content.future[key] = el.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    });

    document.querySelectorAll('[data-timeline]').forEach((el) => {
      const i = Number(el.dataset.timeline);
      const key = el.dataset.key;
      if (!content.future.timeline[i]) return;
      content.future.timeline[i][key] = el.value;
    });
  }

  async function uploadImage(input, pathKey) {
    try {
      const url = await uploadFile(input.files[0]);
      setByPath(content, pathKey, url);
      const hidden = document.querySelector(`[data-path="${pathKey}"]`);
      const preview = document.querySelector(`[data-preview="${pathKey}"]`);
      if (hidden) hidden.value = url;
      if (preview) preview.src = url;
      showToast('Зображення завантажено');
    } catch (e) {
      showToast(e.message, true);
    }
  }

  async function uploadFile(file) {
    if (!file) throw new Error('Файл не обрано');
    const fd = new FormData();
    fd.append('image', file);
    const data = await api('/api/upload', { method: 'POST', body: fd });
    return data.url;
  }

  async function loadContent() {
    content = await api('/api/content');
    initAdminShell();
    renderAllPanels();
  }

  async function checkSession() {
    const session = await api('/api/session');
    if (session.authenticated) {
      loginView.classList.add('hidden');
      adminView.classList.remove('hidden');
      await loadContent();
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    try {
      await api('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username.value,
          password: loginForm.password.value
        })
      });
      loginView.classList.add('hidden');
      adminView.classList.remove('hidden');
      await loadContent();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    adminView.classList.add('hidden');
    loginView.classList.remove('hidden');
  });

  document.getElementById('btn-save').addEventListener('click', async () => {
    collectFromForm();
    try {
      const res = await api('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      showToast(res.message || 'Збережено');
    } catch (e) {
      showToast(e.message, true);
    }
  });

  document.getElementById('btn-reload').addEventListener('click', async () => {
    await loadContent();
    showToast('Зміни скасовано');
  });

  checkSession();
})();

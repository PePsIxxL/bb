const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const CONTENT_PATH = path.join(DATA_DIR, 'content.json');
const MESSAGES_PATH = path.join(DATA_DIR, 'messages.json');
const ADMIN_PATH = path.join(DATA_DIR, 'admin.json');

const PORT = process.env.PORT || 3000;
const SESSION_SECRET_PATH = path.join(DATA_DIR, 'session-secret.txt');

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (fs.existsSync(SESSION_SECRET_PATH)) {
    return fs.readFileSync(SESSION_SECRET_PATH, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SESSION_SECRET_PATH, secret, 'utf8');
  return secret;
}

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOADS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDirs();
const SESSION_SECRET = getSessionSecret();

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function initAdmin() {
  let admin = readJson(ADMIN_PATH, null);
  if (!admin || !admin.passwordHash) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    admin = {
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: bcrypt.hashSync(defaultPassword, 10)
    };
    writeJson(ADMIN_PATH, admin);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('\n⚠️  Створено обліковий запис адміністратора: login "admin", password "admin123"');
      console.log('   Змініть пароль через змінні ADMIN_USERNAME та ADMIN_PASSWORD у .env\n');
    }
  }
  return admin;
}

const adminAccount = initAdmin();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp|svg\+xml)$/;
    if (allowed.test(file.mimetype) || file.originalname.toLowerCase().endsWith('.svg')) {
      cb(null, true);
    } else {
      cb(new Error('Дозволені лише зображення (JPEG, PNG, GIF, WebP, SVG).'));
    }
  }
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Потрібна авторизація.' });
}

app.get('/api/content', (_req, res) => {
  res.json(readJson(CONTENT_PATH, {}));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== adminAccount.username || !bcrypt.compareSync(password || '', adminAccount.passwordHash)) {
    return res.status(401).json({ error: 'Невірний логін або пароль.' });
  }
  req.session.authenticated = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated, username: req.session.username || null });
});

app.put('/api/content', requireAuth, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || !body.site || !body.skills || !body.portfolio) {
    return res.status(400).json({ error: 'Некоректні дані.' });
  }
  writeJson(CONTENT_PATH, body);
  res.json({ ok: true, message: 'Зміни збережено.' });
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Помилка завантаження.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не обрано.' });
    }
    res.json({ ok: true, url: `/uploads/${req.file.filename}` });
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();
  const trimmedMessage = String(message || '').trim();

  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ error: 'Вкажіть ім\'я (мінімум 2 символи).' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Вкажіть коректну електронну пошту.' });
  }
  if (!trimmedMessage || trimmedMessage.length < 10) {
    return res.status(400).json({ error: 'Повідомлення має містити щонайменше 10 символів.' });
  }

  const messages = readJson(MESSAGES_PATH, []);
  messages.push({
    id: crypto.randomUUID(),
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage,
    createdAt: new Date().toISOString()
  });
  writeJson(MESSAGES_PATH, messages);

  res.json({
    ok: true,
    message: 'Дякуємо! Ваше повідомлення збережено. Власник сайту перегляне його в адмін-панелі.'
  });
});

app.get('/api/messages', requireAuth, (_req, res) => {
  res.json(readJson(MESSAGES_PATH, []));
});

app.use(express.static(path.join(ROOT, 'public')));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(ROOT, 'public', 'admin.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(ROOT, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Сайт доступний: http://localhost:${PORT}`);
  console.log(`Панель редагування: http://localhost:${PORT}/admin`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nПорт ${PORT} уже зайнятий (сервер, можливо, уже працює).`);
    console.error(`Відкрийте: http://localhost:${PORT}`);
    console.error('Або зупиніть старий процес: stop.bat у папці проєкту');
    console.error(`Або інший порт: set PORT=3001 && npm.cmd start\n`);
    process.exit(1);
  }
  throw err;
});

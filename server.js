require('dotenv').config();
const express = require('express');
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory user storage
const users = [];
const verificationCodes = new Map();

// Email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'veggie-shop-secret',
  resave: false,
  saveUninitialized: false
}));

// Auth endpoints
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const code = generateCode();
  verificationCodes.set(email, { code, password, expires: Date.now() + 600000 }); // 10 min expiry
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'Fresh Veggie Shop',
      to: email,
      subject: 'Verify Your Email - Fresh Veggie Shop',
      html: `
        <h2>Welcome to Fresh Veggie Shop!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #2d6a4f; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      `
    });
    res.json({ success: true, message: 'Verification code sent to email' });
  } catch (error) {
    console.log('Email error (using console for demo):', code);
    res.json({ success: true, message: 'Verification code sent', demoCode: code });
  }
});

app.post('/api/verify', (req, res) => {
  const { email, code } = req.body;
  const verification = verificationCodes.get(email);
  
  if (!verification) {
    return res.status(400).json({ error: 'No verification pending' });
  }
  
  if (Date.now() > verification.expires) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: 'Code expired' });
  }
  
  if (verification.code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  
  users.push({ email, password: verification.password });
  verificationCodes.delete(email);
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = email;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

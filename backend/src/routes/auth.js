import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || password === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Normalize
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const nameIsAlphabetic = /^[A-Za-z\s]+$/.test(trimmedName);
    if (!nameIsAlphabetic) {
      return res.status(400).json({ error: 'Name must contain only alphabetic characters and spaces' });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'Password must be a string' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name: trimmedName, email, passwordHash });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d'
    });
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d'
    });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return next(err);
  }
});

export default router;


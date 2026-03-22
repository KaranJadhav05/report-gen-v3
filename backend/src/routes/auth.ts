import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required' }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' }); return;
  }
  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) { res.status(409).json({ message: 'An account with this email already exists' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash, role: 'user' });
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET!, { expiresIn: '8h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ message: 'Email already in use' }); return; }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ message: 'Email and password required' }); return; }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) { res.status(401).json({ message: 'Invalid credentials' }); return; }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) { res.status(401).json({ message: 'Invalid credentials' }); return; }
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET!, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const VALID_ROLES = {
  Admin: 'admin',
  'Delivery Agent': 'agent',
  admin: 'admin',
  agent: 'agent',
  delivery_agent: 'agent',
};

const getJwtSecret = () => process.env.JWT_SECRET || 'aasapure-delivery-secret';

const normalizeRole = (role) => VALID_ROLES[role] || '';

const buildAuthResponse = (user) => {
  const token = jwt.sign({ userId: user._id.toString() }, getJwtSecret(), { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const signup = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = normalizeRole(req.body?.role);

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password, and role are required.',
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        message: 'Public signup is available for delivery agents only.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create account.',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to sign in.',
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) =>
  res.status(200).json({
    user: req.user,
  });

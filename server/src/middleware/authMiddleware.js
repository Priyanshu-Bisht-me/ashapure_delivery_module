import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'aasapure-delivery-secret';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.userId).select('_id name email role');

    if (!user) {
      return res.status(401).json({
        message: 'User session is no longer valid.',
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access is required.',
    });
  }

  return next();
};

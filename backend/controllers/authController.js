const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register — Register a new user
exports.register = async (req, res, next) => {
  try {
    const { p_no, name, password, role } = req.body;

    const existing = await User.findOne({ p_no });
    if (existing) {
      return res.status(409).json({ error: 'User with this P.No already exists' });
    }

    const user = await User.create({ p_no, name, password, role });

    const token = jwt.sign(
      { id: user._id, p_no: user.p_no, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login — Login
exports.login = async (req, res, next) => {
  try {
    const { p_no, password } = req.body;

    const user = await User.findOne({ p_no });
    if (!user) {
      return res.status(401).json({ error: 'Invalid P.No or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid P.No or password' });
    }

    const token = jwt.sign(
      { id: user._id, p_no: user.p_no, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ user, token });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — Get current user info
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

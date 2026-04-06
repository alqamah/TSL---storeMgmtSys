const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'store-mgmt-secret-key-change-in-production';

// Middleware: Require authentication for write operations
// Guests (no token) can still read, but writes are blocked
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: Optionally attach user info if token present (for reads)
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Token is invalid — that's fine for reads, just skip
    }
  }

  next();
}

module.exports = { requireAuth, optionalAuth, JWT_SECRET };

const router = require('express').Router();
const ctrl = require('../controllers/logController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All log routes require auth and admin
router.use(requireAuth, requireAdmin);

router.get('/', ctrl.getAllLogs);

module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/issueController');
const { requireAuth } = require('../middleware/auth');

// Reads — open to guests
router.get('/active', ctrl.getActive);
router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);

// Writes — require authentication
router.post('/',             requireAuth, ctrl.create);
router.put('/:id/return',    requireAuth, ctrl.returnItem);
router.delete('/:id',        requireAuth, ctrl.deleteIssue);

module.exports = router;

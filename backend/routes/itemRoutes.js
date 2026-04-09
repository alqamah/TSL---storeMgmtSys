const router = require('express').Router();
const ctrl = require('../controllers/itemController');
const { requireAuth } = require('../middleware/auth');

// Reads — open to guests
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);

// Writes — require authentication
router.post('/bulk',  requireAuth, ctrl.bulkCreate);
router.post('/',      requireAuth, ctrl.create);
router.put('/:id',    requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;

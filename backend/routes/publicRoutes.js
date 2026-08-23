const router = require('express').Router();
const ctrl = require('../controllers/publicController');

router.get('/', ctrl.listItems);
router.get('/items', ctrl.listItems);
router.get('/items/:id', ctrl.getItem);

module.exports = router;

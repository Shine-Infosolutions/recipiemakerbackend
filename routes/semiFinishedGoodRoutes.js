const express = require('express');
const router = express.Router();
const semiFinishedGoodController = require('../controllers/semiFinishedGoodController');
const auth = require('../middleware/auth');

router.get('/', auth, semiFinishedGoodController.getAll);
router.post('/', auth, semiFinishedGoodController.create);
router.post('/:id/add-stock', auth, semiFinishedGoodController.addStock);
router.delete('/:id', auth, semiFinishedGoodController.delete);

module.exports = router;

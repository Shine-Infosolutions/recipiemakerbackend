const express = require('express');
const multer = require('multer');
const router = express.Router();
const bulkDataController = require('../controllers/bulkDataController');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/template/:type', auth, bulkDataController.downloadTemplate);
router.get('/export/:type', auth, bulkDataController.exportData);
router.post('/preview/:type', auth, upload.single('file'), bulkDataController.previewImport);
router.post('/import/:type', auth, upload.single('file'), bulkDataController.importData);

module.exports = router;
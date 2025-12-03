const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController'); // <--- Re-import the brain
const auth = require('../middleware/authMiddleware');

// @route   GET /api/ai/tips
// Connect the route to the REAL function
router.get('/tips', auth, aiController.getAiAdvice); 

module.exports = router;
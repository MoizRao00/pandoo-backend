const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/authMiddleware');


router.post('/', auth, goalController.addGoal);


router.get('/', auth, goalController.getGoals);


router.put('/:id', auth, goalController.updateGoal);

router.delete('/:id', auth, goalController.deleteGoal);

module.exports = router;
const express = require('express');
const router = express.Router();
const leaderBoardController = require('../controllers/leaderBoardController');
const auth = require('../middleware/authMiddleware');


console.log("🚩 Leaderboard Routes File is loading...");

router.post('/request', auth, leaderBoardController.sendRequest);


router.get('/', auth, leaderBoardController.getLeaderboard);

module.exports = router;
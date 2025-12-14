const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


const auth = require('../middleware/authMiddleware'); 

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/guest', authController.guestLogin);

router.post('/verify-mfa', authController.verifyMfa);

router.put('/update', auth, authController.updateUser); 
router.put('/change-password', auth, authController.changePassword);

router.post('/google', authController.googleLogin);
router.post('/apple', authController.appleLogin);

router.put('/toggle-mfa', auth, authController.toggleMfa);

router.get('/me', auth, authController.getMe);

router.put('/convert-guest', auth, authController.convertGuest);

module.exports = router;
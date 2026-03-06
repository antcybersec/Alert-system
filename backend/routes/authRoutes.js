const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, verifyOtp, sendOtp, syncUserProfile } = require('../controllers/authController');

// Register User (Splits data into Registry and Broadcast DBs)
router.post('/register', registerUser);

// Login User
router.post('/login', loginUser);

// Google Login
router.post('/google-login', googleLogin);

// OTP Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Sync Profile (Self-healing)
// Sync Profile (Self-healing)
router.post('/sync-profile', syncUserProfile);

// Manual Community Join
const { joinCommunity } = require('../controllers/authController');
router.post('/join-community', joinCommunity);

module.exports = router;

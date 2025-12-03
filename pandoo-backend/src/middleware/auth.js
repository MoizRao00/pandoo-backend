const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};

const premiumMiddleware = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user || !user.isPremium) {
                return res.status(403).json({ message: 'Premium access required' });
            }
            next();
        })
        .catch(err => {
            return res.status(500).json({ message: 'Internal server error' });
        });
};

module.exports = {
    authMiddleware,
    premiumMiddleware
};
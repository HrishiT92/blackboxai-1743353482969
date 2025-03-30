const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Initialize routes with database connection
function initializeRoutes(db) {
    const authController = new AuthController(db);

    // Register new user
    router.post('/register', (req, res) => {
        authController.register(req, res);
    });

    // Login user
    router.post('/login', (req, res) => {
        authController.login(req, res);
    });

    // Protected route example
    router.get('/protected', authController.verifyToken, (req, res) => {
        res.json({ message: 'Access granted to protected route', user: req.user });
    });

    // Middleware to verify token
    router.use(authController.verifyToken);

    return router;
}

module.exports = initializeRoutes;
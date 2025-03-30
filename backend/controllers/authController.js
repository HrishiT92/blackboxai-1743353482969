const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

class AuthController {
    constructor(db) {
        this.db = db;
    }

    async register(req, res) {
        const { username, email, password, role } = req.body;

        try {
            // Validate input
            if (!username || !email || !password || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Check if user already exists
            this.db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (user) {
                    return res.status(400).json({ error: 'User already exists' });
                }

                try {
                    // Hash password
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    // Insert new user
                    const sql = `
                        INSERT INTO users (username, email, password, role)
                        VALUES (?, ?, ?, ?)
                    `;

                    this.db.run(sql, [username, email, hashedPassword, role], function(err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Error creating user' });
                        }

                        // Generate JWT token
                        const token = jwt.sign(
                            { userId: this.lastID, email, role },
                            config.jwtSecret,
                            { expiresIn: '24h' }
                        );

                        // Return user info and token
                        res.status(201).json({
                            token,
                            user: {
                                id: this.lastID,
                                username,
                                email,
                                role
                            }
                        });
                    });
                } catch (error) {
                    console.error('Error hashing password:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async login(req, res) {
        const { email, password } = req.body;

        try {
            // Validate input
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user by email
            this.db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                try {
                    // Check password
                    const isMatch = await bcrypt.compare(password, user.password);

                    if (!isMatch) {
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    // Generate JWT token
                    const token = jwt.sign(
                        { userId: user.id, email: user.email, role: user.role },
                        config.jwtSecret,
                        { expiresIn: '24h' }
                    );

                    // Return user info and token
                    res.json({
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role
                        }
                    });
                } catch (error) {
                    console.error('Password comparison error:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Verify token middleware
    verifyToken(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
}

module.exports = AuthController;
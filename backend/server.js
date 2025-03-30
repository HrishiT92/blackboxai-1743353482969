const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');
const initializeAuthRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from the frontend directory
app.use('/', express.static(path.join(__dirname, '../frontend')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Handle SPA routing - redirect all non-API requests to index.html
app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    } else {
        next();
    }
});

// Create db directory if it doesn't exist
const fs = require('fs');
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
}

// Database initialization
const db = new sqlite3.Database(path.join(dbDir, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Projects table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )`);

        // Issues table
        db.run(`CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            project_id INTEGER,
            assignee_id INTEGER,
            sprint_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (assignee_id) REFERENCES users (id),
            FOREIGN KEY (sprint_id) REFERENCES sprints (id)
        )`);

        // Sprints table
        db.run(`CREATE TABLE IF NOT EXISTS sprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            start_date DATETIME,
            end_date DATETIME,
            status TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )`);

        // Comments table
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id INTEGER,
            user_id INTEGER,
            comment_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            parent_comment_id INTEGER,
            FOREIGN KEY (issue_id) REFERENCES issues (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (parent_comment_id) REFERENCES comments (id)
        )`);

        // Notifications table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            read_status BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    });
}

// Routes
const authRoutes = initializeAuthRoutes(db);
app.use('/api', authRoutes);

// Basic route for testing
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = config.port || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, db };
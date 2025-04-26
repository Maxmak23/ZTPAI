// Backend: Express + MySQL + Authentication System

// 1. Install necessary packages:
// npm install express mysql2 bcryptjs jsonwebtoken cors express-session dotenv

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5000;


// MySQL Database Connection
const dbConfig = {
    host: process.env.MYSQL_HOSTNAME || "localhost",
    user: process.env.MYSQL_USERNAME || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB_NAME || "makuch_cinema_app"
};

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL Database:', err);
        process.exit(1);
    }
    console.log("Connected to MySQL Database");
    connection.release();
});

// Middleware with error handling
app.use(cors({ 
    origin: "http://localhost:3000", 
    credentials: true 
}));

app.use(express.json());


// Central error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Register Endpoint with enhanced error handling
app.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        const checkUserQuery = "SELECT * FROM users WHERE username = ?";
        const [existingUsers] = await db.promise().query(checkUserQuery, [username]);
        
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password and create user
        const hash = await bcrypt.hash(password, 10);
        const createUserQuery = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        const [result] = await db.promise().query(createUserQuery, [username, hash, role]);

        res.status(201).json({ 
            message: "User registered successfully",
            userId: result.insertId 
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            error: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Login Endpoint with enhanced error handling
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing username or password' });
        }

        const query = "SELECT * FROM users WHERE username = ?";
        const [results] = await db.promise().query(query, [username]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Create a session
        req.session.user = { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        };
        
        res.json({ 
            message: "Login successful", 
            user: req.session.user 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Login failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Check Authentication with error handling
app.get("/auth", (req, res) => {
    try {
        if (req.session.user) {
            res.json({ 
                authenticated: true, 
                user: req.session.user 
            });
        } else {
            res.json({ authenticated: false });
        }
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ 
            error: 'Authentication check failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Logout Endpoint with error handling
app.post("/logout", (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.json({ message: "Logged out successfully" });
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
            error: 'Logout failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});





















// Add a new movie
app.post('/movies', (req, res) => {
    const { title, description, duration, start_date, end_date, screenings } = req.body;
    const query = "INSERT INTO movies (title, description, duration, start_date, end_date) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [title, description, duration, start_date, end_date], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        const movieId = result.insertId;
        const screeningQueries = screenings.map(time => {
            return new Promise((resolve, reject) => {
                db.query("INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)", [movieId, time], (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });
        });
        Promise.all(screeningQueries)
            .then(() => res.json({ message: "Movie added successfully", movieId }))
            .catch(err => res.status(500).json({ error: err }));
    });
});

// Get all movies
app.get('/movies', (req, res) => {
    const query = `
        SELECT movies.*, GROUP_CONCAT(screenings.screening_time) AS screening_times
        FROM movies
        LEFT JOIN screenings ON movies.id = screenings.movie_id
        GROUP BY movies.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const movies = results.map(movie => ({
            ...movie,
            screenings: movie.screening_times ? movie.screening_times.split(',') : []
        }));
        res.json(movies);
    });
});





// Update a movie
app.put('/movies/:id', (req, res) => {
    const { title, description, duration, start_date, end_date, screenings } = req.body;
    const movieId = req.params.id;
    const query = "UPDATE movies SET title = ?, description = ?, duration = ?, start_date = ?, end_date = ? WHERE id = ?";
    db.query(query, [title, description, duration, start_date, end_date, movieId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        db.query("DELETE FROM screenings WHERE movie_id = ?", [movieId], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            const screeningQueries = screenings.map(time => {
                return new Promise((resolve, reject) => {
                    db.query("INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)", [movieId, time], (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            });
            Promise.all(screeningQueries)
                .then(() => res.json({ message: "Movie updated successfully" }))
                .catch(err => res.status(500).json({ error: err }));
        });
    });
});

// Delete a movie
app.delete('/movies/:id', (req, res) => {
    const movieId = req.params.id;
    const query = "DELETE FROM movies WHERE id = ?";
    db.query(query, [movieId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Movie deleted successfully" });
    });
});




















app.get('/movies/playing', (req, res) => {
    const date = req.query.date;
    
    const query = `
        SELECT 
            m.*,
            GROUP_CONCAT(
                TIME_FORMAT(s.screening_time, '%H:%i:%s')
                ORDER BY s.screening_time
            ) AS screenings
        FROM 
            movies m
        LEFT JOIN 
            screenings s ON m.id = s.movie_id
            AND DATE(s.screening_time) = ?
        WHERE 
            m.start_date <= ? AND 
            m.end_date >= ?
        GROUP BY 
            m.id
    `;
    
    db.query(query, [date, date, date], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        
        const movies = results.map(movie => ({
            ...movie,
            screenings: movie.screenings ? movie.screenings.split(',') : []
        }));
        
        res.json(movies);
    });
});
























// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup error:', err);
    process.exit(1);
});

// SQL Query to Create Users Table (Run this manually in MySQL):
// CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), role ENUM('client','employee','manager','admin'));
// INSERT INTO users (username, password, role) VALUES  ('admin', '$2a$10$1234567890abcdef', 'admin'), ('employee1', '$2a$10$1234567890abcdef', 'employee'), ('employee2', '$2a$10$1234567890abcdef', 'employee'), ('manager1', '$2a$10$1234567890abcdef', 'manager'), ('manager2', '$2a$10$1234567890abcdef', 'manager'), ('client1', '$2a$10$1234567890abcdef', 'client'), ('client2', '$2a$10$1234567890abcdef', 'client'), ('client3', '$2a$10$1234567890abcdef', 'client');



// CREATE TABLE movies (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     title VARCHAR(255) NOT NULL,
//     description TEXT,
//     duration INT NOT NULL,
//     start_date DATE NOT NULL,
//     end_date DATE NOT NULL
// );

// CREATE TABLE screenings (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     movie_id INT NOT NULL,
//     screening_time TIME NOT NULL,
//     FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
// );
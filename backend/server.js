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





















// Add a new movie with screenings
app.post('/movies', async (req, res) => {
    try {
        const { title, description, duration, start_date, end_date, screenings } = req.body;

        // Validate required fields
        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields (title, duration, start_date, or end_date)' });
        }

        // Validate duration is a positive number
        if (isNaN(duration)) {
            return res.status(400).json({ error: 'Duration must be a number' });
        }

        // Validate date format (basic check)
        if (isNaN(new Date(start_date).getTime()) || isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Validate screenings array
        if (!Array.isArray(screenings) || screenings.length === 0) {
            return res.status(400).json({ error: 'At least one screening time is required' });
        }

        // Start transaction
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // Insert movie
            const [movieResult] = await connection.query(
                "INSERT INTO movies (title, description, duration, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                [title, description, duration, start_date, end_date]
            );
            
            const movieId = movieResult.insertId;

            // Insert screenings
            const screeningPromises = screenings.map(time => {
                if (!time) {
                    throw new Error('Invalid screening time');
                }
                return connection.query(
                    "INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)",
                    [movieId, time]
                );
            });

            await Promise.all(screeningPromises);
            await connection.commit();

            res.status(201).json({ 
                message: "Movie added successfully", 
                movieId,
                screeningsAdded: screenings.length
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Add movie error:', err);
        res.status(500).json({ 
            error: 'Failed to add movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get all movies with their screenings
app.get('/movies', async (req, res) => {
    try {
        const query = `
            SELECT movies.*, GROUP_CONCAT(screenings.screening_time) AS screening_times
            FROM movies
            LEFT JOIN screenings ON movies.id = screenings.movie_id
            GROUP BY movies.id
        `;

        const [results] = await db.promise().query(query);

        const movies = results.map(movie => ({
            ...movie,
            screenings: movie.screening_times ? 
                movie.screening_times.split(',').filter(time => time) : []
        }));

        res.json(movies);

    } catch (err) {
        console.error('Get movies error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch movies',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Update a movie and its screenings
app.put('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const { title, description, duration, start_date, end_date, screenings } = req.body;

        // Validate movie ID
        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Validate required fields
        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate screenings array
        if (!Array.isArray(screenings)) {
            return res.status(400).json({ error: 'Screenings must be an array' });
        }

        // Start transaction
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // Update movie
            const [updateResult] = await connection.query(
                "UPDATE movies SET title = ?, description = ?, duration = ?, start_date = ?, end_date = ? WHERE id = ?",
                [title, description, duration, start_date, end_date, movieId]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Movie not found');
            }

            // Delete existing screenings
            await connection.query(
                "DELETE FROM screenings WHERE movie_id = ?",
                [movieId]
            );

            // Insert new screenings
            if (screenings.length > 0) {
                const screeningPromises = screenings.map(time => {
                    if (!time) {
                        throw new Error('Invalid screening time');
                    }
                    return connection.query(
                        "INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)",
                        [movieId, time]
                    );
                });

                await Promise.all(screeningPromises);
            }

            await connection.commit();

            res.json({ 
                message: "Movie updated successfully",
                screeningsUpdated: screenings.length
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Update movie error:', err);
        
        if (err.message === 'Movie not found') {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ 
            error: 'Failed to update movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Delete a movie
app.delete('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;

        // Validate movie ID
        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Start transaction (to delete both movie and its screenings)
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // First delete screenings (to maintain referential integrity)
            await connection.query(
                "DELETE FROM screenings WHERE movie_id = ?",
                [movieId]
            );

            // Then delete the movie
            const [result] = await connection.query(
                "DELETE FROM movies WHERE id = ?",
                [movieId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Movie not found');
            }

            await connection.commit();

            res.json({ 
                message: "Movie deleted successfully",
                screeningsDeleted: result.affectedRows
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Delete movie error:', err);
        
        if (err.message === 'Movie not found') {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ 
            error: 'Failed to delete movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
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
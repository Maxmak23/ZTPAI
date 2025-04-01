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
const PORT = 5000;

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOSTNAME || "localhost",
    user: process.env.MYSQL_USERNAME || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB_NAME || "makuch_cinema_app"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL Database");
});

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
}));

// Register Endpoint
app.post("/register", (req, res) => {
    const { username, password, role } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err });
        const query = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        db.query(query, [username, hash, role], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "User registered successfully" });
        });
    });
});

// Login Endpoint
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(401).json({ message: "User not found" });
        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err });
            if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
            
            // Create a session
            req.session.user = { id: results[0].id, username: results[0].username, role: results[0].role };
            res.json({ message: "Login successful", user: req.session.user });
        });
    });
});

// Check Authentication
app.get("/auth", (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout Endpoint
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
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
























app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
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
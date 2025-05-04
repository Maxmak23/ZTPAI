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
//const PORT = process.env.PORT || 5000;
const PORT = 5000;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using HTTPS
}));


// MySQL Database Connection
// const dbConfig = {
//     host: process.env.MYSQL_HOSTNAME || "localhost",
//     user: process.env.MYSQL_USERNAME || "root",
//     password: process.env.MYSQL_PASSWORD || "",
//     database: process.env.MYSQL_DB_NAME || "makuch_cinema_app"
// };
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "makuch_cinema_app"
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
        if (req.session && req.session.user) {
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


















app.get('/movies/playing', async (req, res) => {    
    try {

        // Validate date parameter
        const date = req.query.date;
        if (!date) {
            return res.status(400).json({ 
                error: 'Date parameter is required',
                example: '/movies/playing?date=2023-12-31'
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ 
                error: 'Invalid date format. Please use YYYY-MM-DD format',
                received: date,
                example: '2023-12-31'
            });
        }

        // Validate the date is a valid calendar date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date value',
                received: date
            });
        }

        // Format the date to ensure MySQL compatibility
        const formattedDate = parsedDate.toISOString().split('T')[0];

        const query = `
            SELECT 
                m.*,
                GROUP_CONCAT(
                    TIME_FORMAT(s.screening_time, '%H:%i:%s')
                    ORDER BY s.screening_time
                ) AS screenings,
                GROUP_CONCAT(s.id ORDER BY s.screening_time) AS screeningIds
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
        
        // Using promise-based query with connection pooling
        const [results] = await db.promise().query(query, [formattedDate, formattedDate, formattedDate]);
        
        // Process results
        var movies = results.map(movie => ({
            ...movie,
            screenings: movie.screenings ? 
                movie.screenings.split(',').filter(time => time.trim() !== '') : 
                []
        }));

        for(var i=0;i<movies.length;i+=1){
            movies[i].screeningIds = movies[i].screeningIds.split(',');
        }
        
        // Add cache headers for better performance
        //res.set('Cache-Control', 'public, max-age=0'); // Cache for 1 hour
        res.json({
            success: true,
            date: formattedDate,
            count: movies.length,
            data: movies
        });

        //console.log(movies);

    } catch (err) {
        console.error('Error fetching currently playing movies:', err);
        
        // Differentiate between different types of errors
        let statusCode = 500;
        let errorMessage = 'Failed to fetch currently playing movies';
        
        if (err.code === 'ER_PARSE_ERROR') {
            statusCode = 400;
            errorMessage = 'Invalid date parameter';
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed';
        }
        
        res.status(statusCode).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                stack: err.stack
            } : undefined
        });
    }
});































// Get screening details (for ReserveSeat page)
app.get('/screenings/:id', async (req, res) => {
    try {
        const screeningId = req.params.id;
        
        // Get screening with movie details
        const [screening] = await db.promise().query(`
            SELECT s.*, m.title, m.duration, DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as formatted_time
            FROM screenings s
            JOIN movies m ON s.movie_id = m.id
            WHERE s.id = ?
        `, [screeningId]);
        
        if (!screening.length) {
            return res.status(404).json({ error: 'Screening not found' });
        }
        
        // Get reserved seats for this screening
        const [reservedSeats] = await db.promise().query(
            'SELECT seat_number FROM reservations WHERE screening_id = ?',
            [screeningId]
        );
        
        res.json({
            success: true,
            data: {
                screening: screening[0],
                reservedSeats: reservedSeats.map(seat => seat.seat_number)
            }
        });
        
    } catch (err) {
        console.error('Error fetching screening:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch screening' });
    }
});

// Create reservation
app.post('/reservations', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { screening_id, seat_number } = req.body;
        
        // Validate input
        if (!screening_id || !seat_number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if seat is already taken
        const [existing] = await db.promise().query(
            'SELECT id FROM reservations WHERE screening_id = ? AND seat_number = ?',
            [screening_id, seat_number]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Seat already reserved' });
        }
        
        // Create reservation
        await db.promise().query(
            'INSERT INTO reservations (user_id, screening_id, seat_number) VALUES (?, ?, ?)',
            [req.session.user.id, screening_id, seat_number]
        );
        
        res.json({ success: true });
        
    } catch (err) {
        console.error('Error creating reservation:', err);
        res.status(500).json({ success: false, error: 'Failed to create reservation' });
    }
});





// Get user's reservations
app.get('/reservations/my', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const [reservations] = await db.promise().query(`
            SELECT 
                r.id, 
                r.seat_number,
                DATE_FORMAT(r.reservation_time, '%Y-%m-%d %H:%i:%s') as reservation_time,
                s.id as screening_id,
                DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as screening_time,
                m.title as movie_title,
                m.duration
            FROM 
                reservations r
            JOIN 
                screenings s ON r.screening_id = s.id
            JOIN 
                movies m ON s.movie_id = m.id
            WHERE 
                r.user_id = ?
            ORDER BY 
                s.screening_time DESC
        `, [req.session.user.id]);
        
        res.json({
            success: true,
            count: reservations.length,
            data: reservations
        });
        
    } catch (err) {
        console.error('Error fetching user reservations:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch reservations' });
    }
});
























// Get all screenings with statistics (for employees)
app.get('/screenings_stats', async (req, res) => {
    try {
        // if (!req.session.user || req.session.user.role !== 'employee') {
        //     return res.status(403).json({ error: 'Access denied' });
        // }

        const currentDate = new Date().toISOString().split('T')[0];
        
        const [screenings] = await db.promise().query(`
            SELECT 
                s.id,
                m.title as movie_title,
                m.duration,
                DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as screening_time,
                (
                    SELECT COUNT(*) 
                    FROM reservations r 
                    WHERE r.screening_id = s.id
                ) as reserved_seats,
                80 as total_seats,  -- Assuming 8 rows x 10 seats = 80 seats total
                (
                    SELECT GROUP_CONCAT(r.seat_number)
                    FROM reservations r
                    WHERE r.screening_id = s.id
                ) as reserved_seat_numbers
            FROM 
                screenings s
            JOIN 
                movies m ON s.movie_id = m.id
            WHERE 
                DATE(s.screening_time) >= ?
                AND m.end_date >= ?
            ORDER BY 
                s.screening_time ASC
        `, [currentDate, currentDate]);
        
        // Process results
        const processed = screenings.map(screening => ({
            ...screening,
            reserved_seat_numbers: screening.reserved_seat_numbers 
                ? screening.reserved_seat_numbers.split(',') 
                : [],
            available_seats: screening.total_seats - screening.reserved_seats,
            occupancy_rate: Math.round((screening.reserved_seats / screening.total_seats) * 100)
        }));
        
        res.json({
            success: true,
            count: processed.length,
            data: processed
        });
        
    } catch (err) {
        console.error('Error fetching screening statistics:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch screening statistics' });
    }
});



























// Get all users (admin only)
app.get('/admin/users', async (req, res) => {
    try {
        // if (!req.session.user || req.session.user.role !== 'admin') {
        //     return res.status(403).json({ error: 'Access denied' });
        // }

        const [users] = await db.promise().query(`
            SELECT id, username, role 
            FROM users
            ORDER BY role, username
        `);
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
        
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Update user role (admin only)
app.put('/admin/users/:id/role', async (req, res) => {
    try {
        // if (!req.session.user || req.session.user.role !== 'admin') {
        //     return res.status(403).json({ error: 'Access denied' });
        // }

        const userId = req.params.id;
        const { role } = req.body;
        const validRoles = ['client', 'employee', 'manager', 'admin'];

        // Validate role
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role',
                valid_roles: validRoles
            });
        }

        // Prevent admin from removing their own admin rights
        if (userId == req.session.user.id && role !== 'admin') {
            return res.status(400).json({ 
                error: 'You cannot remove your own admin privileges'
            });
        }

        await db.promise().query(`
            UPDATE users 
            SET role = ?
            WHERE id = ?
        `, [role, userId]);
        
        res.json({ 
            success: true,
            message: 'User role updated successfully'
        });
        
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
});


















module.exports = app;

// Start the server
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	}).on('error', (err) => {
		console.error('Server startup error:', err);
		process.exit(1);
	});
}


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

// CREATE TABLE reservations (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     user_id INT NOT NULL,
//     screening_id INT NOT NULL,
//     seat_number VARCHAR(10) NOT NULL,
//     reservation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//     FOREIGN KEY (screening_id) REFERENCES screenings(id) ON DELETE CASCADE,
//     UNIQUE KEY unique_reservation (screening_id, seat_number)
// );











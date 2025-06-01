const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const requireRole = require('../middleware/auth');
const addMovieWithScreenings = require('../services/addMovieWithScreenings');
const getAllMoviesWithScreenings = require('../services/getAllMoviesWithScreenings');




/**
 * @swagger
 * /movies:
 *   post:
 *     tags:
 *       - Movies
 *     summary: Add a new movie with screenings
 *     description: Creates a new movie entry with multiple screening times (uses transaction)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *               - start_date
 *               - end_date
 *               - screenings
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               description:
 *                 type: string
 *                 example: "A mind-bending thriller"
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 148
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-06-01"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-06-30"
 *               screenings:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date-time
 *                 example: ["2023-06-01T18:00:00", "2023-06-02T20:30:00"]
 *     responses:
 *       201:
 *         description: Movie and screenings added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movie added successfully"
 *                 movieId:
 *                   type: integer
 *                   example: 42
 *                 screeningsAdded:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     missingFields: "Missing required fields (title, duration, start_date, or end_date)"
 *                     invalidDuration: "Duration must be a number"
 *                     invalidDate: "Invalid date format"
 *                     invalidScreenings: "At least one screening time is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to add movie"
 *                 details:
 *                   type: string
 *                   description: Detailed error message (development only)
 *                   example: "Database connection error"
 *     security:
 *       - cookieAuth: []
 */
router.post('/movies', async (req, res) => {
    try {
        const { title, description, duration, start_date, end_date, screenings, room } = req.body;

        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields (title, duration, start_date, or end_date)' });
        }

        if (isNaN(duration)) {
            return res.status(400).json({ error: 'Duration must be a number' });
        }

        if (isNaN(new Date(start_date).getTime()) || isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        if (!Array.isArray(screenings) || screenings.length === 0) {
            return res.status(400).json({ error: 'At least one screening time is required' });
        }

        const result = await addMovieWithScreenings(
            { title, description, duration, start_date, end_date, room },
            screenings
        );

        res.status(201).json({
            message: "Movie added successfully",
            ...result
        });

    } catch (err) {
        console.error('Add movie error:', err);
        res.status(500).json({
            error: 'Failed to add movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});



/**
 * @swagger
 * /movies:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get all movies with screening times
 *     description: Returns a list of all movies with their associated screening times
 *     responses:
 *       200:
 *         description: List of movies with screenings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "Inception"
 *                   description:
 *                     type: string
 *                     example: "A mind-bending thriller"
 *                   duration:
 *                     type: integer
 *                     example: 148
 *                   start_date:
 *                     type: string
 *                     format: date
 *                     example: "2023-06-01"
 *                   end_date:
 *                     type: string
 *                     format: date
 *                     example: "2023-06-30"
 *                   screenings:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: date-time
 *                     example: ["2023-06-01T18:00:00", "2023-06-02T20:30:00"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch movies"
 *                 details:
 *                   type: string
 *                   description: Detailed error message (development only)
 *                   example: "Database connection error"
 */
router.get('/movies', async (req, res) => {
    try {
        const movies = await getAllMoviesWithScreenings();
        res.json(movies);
    } catch (err) {
        console.error('Get movies error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch movies',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});



/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     tags:
 *       - Movies
 *     summary: Update a movie and its screenings
 *     description: Updates movie details and replaces all screening times (uses transaction)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *               - start_date
 *               - end_date
 *               - screenings
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               description:
 *                 type: string
 *                 example: "A mind-bending thriller"
 *               duration:
 *                 type: integer
 *                 example: 148
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-30"
 *               screenings:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date-time
 *                 example: ["2023-06-01T18:00:00", "2023-06-02T20:30:00"]
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movie updated successfully"
 *                 screeningsUpdated:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     invalidId: "Invalid movie ID"
 *                     missingFields: "Missing required fields"
 *                     invalidScreenings: "Screenings must be an array"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Movie not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update movie"
 *                 details:
 *                   type: string
 *                   description: Detailed error message (development only)
 *                   example: "Database connection error"
 *     security:
 *       - cookieAuth: []
 */
router.put('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const { title, description, duration, start_date, end_date, screenings, room } = req.body;

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
                "UPDATE movies SET title = ?, description = ?, duration = ?, start_date = ?, end_date = ?, room = ? WHERE id = ?",
                [title, description, duration, start_date, end_date, room, movieId]
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

/**
 * @swagger
 * /movies/{id}:
 *   delete:
 *     tags:
 *       - Movies
 *     summary: Delete a movie and its screenings
 *     description: Deletes a movie and all associated screening times (uses transaction)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID to delete
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movie deleted successfully"
 *                 screeningsDeleted:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid movie ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid movie ID"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Movie not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete movie"
 *                 details:
 *                   type: string
 *                   description: Detailed error message (development only)
 *                   example: "Database connection error"
 *     security:
 *       - cookieAuth: []
 */
router.delete('/movies/:id', async (req, res) => {
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

















/**
 * @swagger
 * /movies/playing:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get movies playing on a specific date
 *     description: Returns movies with their screening times for a given date
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2023-12-31"
 *         description: Date to check for screenings (YYYY-MM-DD format)
 *     responses:
 *       200:
 *         description: List of movies with screenings for the requested date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2023-12-31"
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Inception"
 *                       description:
 *                         type: string
 *                         example: "A mind-bending thriller"
 *                       duration:
 *                         type: integer
 *                         example: 148
 *                       start_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-12-01"
 *                       end_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-12-31"
 *                       screenings:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: time
 *                           example: "18:00:00"
 *                       screeningIds:
 *                         type: array
 *                         items:
 *                           type: integer
 *                           example: 42
 *       400:
 *         description: Invalid date parameter
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Date parameter is required"
 *                     example:
 *                       type: string
 *                       example: "/movies/playing?date=2023-12-31"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid date format. Please use YYYY-MM-DD format"
 *                     received:
 *                       type: string
 *                     example:
 *                       type: string
 *                       example: "2023-12-31"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid date value"
 *                     received:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch currently playing movies"
 *                 details:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     stack:
 *                       type: string
 *                   description: Only shown in development environment
 */
router.get('/movies/playing', async (req, res) => {    
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























router.get('/rooms', async (req, res) => {
    try {
        const query = `
            SELECT * FROM room
        `;

        const [results] = await db.promise().query(query);

        res.json(results);

    } catch (err) {
        console.error('Get movies error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch movies',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});



module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const requireRole = require('../middleware/auth');
const addMovieWithScreenings = require('../services/addMovieWithScreenings');
const getAllMoviesWithScreenings = require('../services/getAllMoviesWithScreenings');
const updateMovieWithScreenings = require('../services/updateMovieWithScreenings');
const deleteMovieWithScreenings = require('../services/deleteMovieWithScreenings');
const getMoviesPlayingOnDate = require('../services/getMoviesPlayingOnDate');




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

        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!Array.isArray(screenings)) {
            return res.status(400).json({ error: 'Screenings must be an array' });
        }

        const result = await updateMovieWithScreenings(
            movieId,
            { title, description, duration, start_date, end_date, room },
            screenings
        );

        res.json({
            message: "Movie updated successfully",
            ...result
        });

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

        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        const result = await deleteMovieWithScreenings(movieId);

        res.json({
            message: "Movie deleted successfully",
            ...result
        });

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
        const date = req.query.date;

        if (!date) {
            return res.status(400).json({ 
                error: 'Date parameter is required',
                example: '/movies/playing?date=2023-12-31'
            });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ 
                error: 'Invalid date format. Please use YYYY-MM-DD format',
                received: date,
                example: '2023-12-31'
            });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date value',
                received: date
            });
        }

        const formattedDate = parsedDate.toISOString().split('T')[0];
        const movies = await getMoviesPlayingOnDate(formattedDate);

        res.json({
            success: true,
            date: formattedDate,
            count: movies.length,
            data: movies
        });

    } catch (err) {
        console.error('Error fetching currently playing movies:', err);

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
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const requireRole = require('../middleware/auth');
const queue = require('../queue');








/**
 * @swagger
 * /reservations:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Create a new reservation
 *     description: Reserve a seat for a specific screening (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - screening_id
 *               - seat_number
 *             properties:
 *               screening_id:
 *                 type: integer
 *                 example: 1
 *               seat_number:
 *                 type: string
 *                 example: "A12"
 *     responses:
 *       200:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized (not authenticated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not authenticated"
 *       409:
 *         description: Conflict (seat already reserved)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Seat already reserved"
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
 *                   example: "Failed to create reservation"
 */
router.post('/reservations', async (req, res) => {
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

        // Queue task: Reservation confirmation (could trigger email later)
        await queue.enqueue({
            type: 'RESERVATION_CONFIRMATION',
            userId: req.session.user.id,
            movieId: screening_id,
            seatNumber: seat_number,
            timestamp: new Date()
        });
        
    } catch (err) {
        console.error('Error creating reservation:', err);
        res.status(500).json({ success: false, error: 'Failed to create reservation' });
    }
});





/**
 * @swagger
 * /reservations/my:
 *   get:
 *     tags:
 *       - Reservations
 *     summary: Get current user's reservations
 *     description: Returns all reservations for the authenticated client user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       seat_number:
 *                         type: string
 *                         example: "A12"
 *                       reservation_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-12-01 14:30:00"
 *                       screening_id:
 *                         type: integer
 *                         example: 10
 *                       screening_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-12-15 18:00:00"
 *                       movie_title:
 *                         type: string
 *                         example: "Inception"
 *                       duration:
 *                         type: integer
 *                         example: 148
 *       401:
 *         description: Unauthorized (not authenticated or wrong role)
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
 *                   example: "Failed to fetch reservations"
 */
router.get('/reservations/my', requireRole.check(['client']), async (req, res) => {
    try {
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




module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const checkRole = require('../middleware/checkRole');
const getScreeningDetails = require('../services/getScreeningDetails');
const getReservedSeats = require('../services/getReservedSeats');
const getUpcomingScreeningStats = require('../services/getUpcomingScreeningStats');




/**
 * @swagger
 * /screenings/{id}:
 *   get:
 *     tags:
 *       - Screenings
 *     summary: Get screening details with reserved seats
 *     description: Returns screening information including movie details and reserved seats
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Screening ID
 *     responses:
 *       200:
 *         description: Screening details with reserved seats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     screening:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         movie_id:
 *                           type: integer
 *                           example: 5
 *                         screening_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-15 18:00:00"
 *                         title:
 *                           type: string
 *                           example: "Inception"
 *                         duration:
 *                           type: integer
 *                           example: 148
 *                         formatted_time:
 *                           type: string
 *                           example: "2023-12-15 18:00:00"
 *                     reservedSeats:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "A12"
 *       404:
 *         description: Screening not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Screening not found"
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
 *                   example: "Failed to fetch screening"
 */
router.get('/screenings/:id', async (req, res) => {
    try {
        const screeningId = req.params.id;

        const screening = await getScreeningDetails(screeningId);
        if (!screening) {
            return res.status(404).json({ error: 'Screening not found' });
        }

        const reservedSeats = await getReservedSeats(screeningId);

        res.json({
            success: true,
            data: {
                screening,
                reservedSeats
            }
        });

    } catch (err) {
        console.error('Error fetching screening:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch screening' });
    }
});



/**
 * @swagger
 * /screenings_stats:
 *   get:
 *     tags:
 *       - Screenings
 *     summary: Get screening statistics
 *     description: Retrieve statistics for upcoming screenings (employee only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Screening statistics retrieved successfully
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 10
 *                       movie_title:
 *                         type: string
 *                         example: "Inception"
 *                       duration:
 *                         type: integer
 *                         example: 148
 *                       screening_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-12-15 18:00:00"
 *                       reserved_seats:
 *                         type: integer
 *                         example: 42
 *                       total_seats:
 *                         type: integer
 *                         example: 80
 *                       reserved_seat_numbers:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["A1", "A2", "B5"]
 *                       available_seats:
 *                         type: integer
 *                         example: 38
 *                       occupancy_rate:
 *                         type: integer
 *                         example: 53
 *       401:
 *         description: Unauthorized (not authenticated)
 *       403:
 *         description: Forbidden (not employee/manager/admin)
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
 *                   example: "Failed to fetch screening statistics"
 */


router.get('/screenings_stats', checkRole(['employee']), async (req, res) => {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        const screenings = await getUpcomingScreeningStats(currentDate);

        res.json({
            success: true,
            count: screenings.length,
            data: screenings
        });

    } catch (err) {
        console.error('Error fetching screening statistics:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch screening statistics' });
    }
});




module.exports = router;
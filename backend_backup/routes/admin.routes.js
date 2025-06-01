const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const checkRole = require('../middleware/checkRole');
const getAllUsers = require('../services/getAllUsers');
const updateUserRole = require('../services/updateUserRole');



/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users
 *     description: Retrieve a list of all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
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
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "admin_user"
 *                       role:
 *                         type: string
 *                         example: "admin"
 *       401:
 *         description: Unauthorized (not authenticated)
 *       403:
 *         description: Forbidden (not admin)
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
 *                   example: "Failed to fetch users"
 */
router.get('/admin/users', checkRole(['admin']), async (req, res) => {
    try {
        const users = await getAllUsers();
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


/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update user role
 *     description: Change a user's role (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: ["client", "employee", "manager", "admin"]
 *                 example: "manager"
 *             required:
 *               - role
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User role updated successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid role"
 *                     valid_roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["client", "employee", "manager", "admin"]
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "You cannot remove your own admin privileges"
 *       401:
 *         description: Unauthorized (not authenticated)
 *       403:
 *         description: Forbidden (not admin)
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
 *                   example: "Failed to update user role"
 */

router.put('/admin/users/:id/role', checkRole(['admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        const validRoles = ['client', 'employee', 'manager', 'admin'];

        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role',
                valid_roles: validRoles
            });
        }

        if (userId == req.session.user.id && role !== 'admin') {
            return res.status(400).json({ 
                error: 'You cannot remove your own admin privileges'
            });
        }

        await updateUserRole(userId, role);

        res.json({ 
            success: true,
            message: 'User role updated successfully'
        });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
    }
});




module.exports = router;





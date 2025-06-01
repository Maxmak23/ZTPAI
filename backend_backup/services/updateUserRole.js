const db = require('../config/db');

async function updateUserRole(userId, role) {
    await db.promise().query(`
        UPDATE users 
        SET role = ?
        WHERE id = ?
    `, [role, userId]);
}

module.exports = updateUserRole;

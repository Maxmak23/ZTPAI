const db = require('../db'); // adjust the path if needed

async function updateUserRole(userId, role) {
    await db.promise().query(`
        UPDATE users 
        SET role = ?
        WHERE id = ?
    `, [role, userId]);
}

module.exports = updateUserRole;

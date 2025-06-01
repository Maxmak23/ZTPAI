const db = require('../config/db');

async function getAllUsers() {
    const [users] = await db.promise().query(`
        SELECT id, username, role 
        FROM users
        ORDER BY role, username
    `);
    return users;
}

module.exports = getAllUsers;

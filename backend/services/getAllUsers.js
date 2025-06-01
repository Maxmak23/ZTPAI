const db = require('../db'); // adjust the path if needed

async function getAllUsers() {
    const [users] = await db.promise().query(`
        SELECT id, username, role 
        FROM users
        ORDER BY role, username
    `);
    return users;
}

module.exports = getAllUsers;

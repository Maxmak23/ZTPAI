const db = require('../config/db');

async function deleteUserByUsername(username) {
    await db.promise().query(`
        DELETE FROM users WHERE username=?;
    `, [username]);
}

module.exports = deleteUserByUsername;

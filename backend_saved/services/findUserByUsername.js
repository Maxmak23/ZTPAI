const db = require('../config/db');

async function findUserByUsername(username) {
    const [users] = await db.promise().query(
        "SELECT * FROM users WHERE username = ?", 
        [username]
    );
    return users;
}

module.exports = findUserByUsername;

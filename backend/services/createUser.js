const db = require('../config/db');

async function createUser(username, hashedPassword, role) {
    const [result] = await db.promise().query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, hashedPassword, role]
    );
    return result.insertId;
}

module.exports = createUser;

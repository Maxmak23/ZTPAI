const db = require('../config/db');

async function getAllRooms() {
    const [results] = await db.promise().query(`SELECT * FROM room`);
    return results;
}

module.exports = getAllRooms;

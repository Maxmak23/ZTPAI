const db = require('../config/db');

async function isSeatReserved(screeningId, seatNumber) {
    const [existing] = await db.promise().query(
        'SELECT id FROM reservations WHERE screening_id = ? AND seat_number = ?',
        [screeningId, seatNumber]
    );
    return existing.length > 0;
}

module.exports = isSeatReserved;

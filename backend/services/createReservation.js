const db = require('../config/db');

async function createReservation(userId, screeningId, seatNumber) {
    await db.promise().query(
        'INSERT INTO reservations (user_id, screening_id, seat_number) VALUES (?, ?, ?)',
        [userId, screeningId, seatNumber]
    );
}

module.exports = createReservation;

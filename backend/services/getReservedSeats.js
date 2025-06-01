const db = require('../config/db');

async function getReservedSeats(screeningId) {
    const [seats] = await db.promise().query(
        'SELECT seat_number FROM reservations WHERE screening_id = ?',
        [screeningId]
    );
    return seats.map(seat => seat.seat_number);
}

module.exports = getReservedSeats;

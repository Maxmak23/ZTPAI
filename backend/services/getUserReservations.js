const db = require('../config/db');

async function getUserReservations(userId) {
    const [reservations] = await db.promise().query(`
        SELECT 
            r.id, 
            r.seat_number,
            DATE_FORMAT(r.reservation_time, '%Y-%m-%d %H:%i:%s') as reservation_time,
            s.id as screening_id,
            DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as screening_time,
            m.title as movie_title,
            m.duration
        FROM 
            reservations r
        JOIN 
            screenings s ON r.screening_id = s.id
        JOIN 
            movies m ON s.movie_id = m.id
        WHERE 
            r.user_id = ?
        ORDER BY 
            s.screening_time DESC
    `, [userId]);

    return reservations;
}

module.exports = getUserReservations;

const db = require('../config/db');

async function getUpcomingScreeningStats(currentDate) {
    const [screenings] = await db.promise().query(`
        SELECT 
            s.id,
            m.title as movie_title,
            m.duration,
            DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as screening_time,
            (
                SELECT COUNT(*) 
                FROM reservations r 
                WHERE r.screening_id = s.id
            ) as reserved_seats,
            80 as total_seats,  -- Fixed number of seats
            (
                SELECT GROUP_CONCAT(r.seat_number)
                FROM reservations r
                WHERE r.screening_id = s.id
            ) as reserved_seat_numbers
        FROM 
            screenings s
        JOIN 
            movies m ON s.movie_id = m.id
        WHERE 
            DATE(s.screening_time) >= ?
            AND m.end_date >= ?
        ORDER BY 
            s.screening_time ASC
    `, [currentDate, currentDate]);

    return screenings.map(screening => ({
        ...screening,
        reserved_seat_numbers: screening.reserved_seat_numbers
            ? screening.reserved_seat_numbers.split(',')
            : [],
        available_seats: screening.total_seats - screening.reserved_seats,
        occupancy_rate: Math.round((screening.reserved_seats / screening.total_seats) * 100)
    }));
}


module.exports = getUpcomingScreeningStats;

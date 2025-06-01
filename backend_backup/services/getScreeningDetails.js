const db = require('../config/db');

async function getScreeningDetails(screeningId) {
    const [screening] = await db.promise().query(`
        SELECT 
            s.*, 
            m.title, 
            m.duration, 
            DATE_FORMAT(s.screening_time, '%Y-%m-%d %H:%i:%s') as formatted_time
        FROM 
            screenings s
        JOIN 
            movies m ON s.movie_id = m.id
        WHERE 
            s.id = ?
    `, [screeningId]);

    return screening.length ? screening[0] : null;
}

module.exports = getScreeningDetails;

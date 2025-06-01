const db = require('../config/db');

async function getMoviesPlayingOnDate(date) {
    const [results] = await db.promise().query(`
        SELECT 
            m.*,
            GROUP_CONCAT(
                TIME_FORMAT(s.screening_time, '%H:%i:%s')
                ORDER BY s.screening_time
            ) AS screenings,
            GROUP_CONCAT(s.id ORDER BY s.screening_time) AS screeningIds
        FROM 
            movies m
        LEFT JOIN 
            screenings s ON m.id = s.movie_id
            AND DATE(s.screening_time) = ?
        WHERE 
            m.start_date <= ? AND 
            m.end_date >= ?
        GROUP BY 
            m.id
    `, [date, date, date]);

    return results.map(movie => ({
        ...movie,
        screenings: movie.screenings 
            ? movie.screenings.split(',').filter(time => time.trim() !== '') 
            : [],
        screeningIds: movie.screeningIds 
            ? movie.screeningIds.split(',') 
            : []
    }));
}


module.exports = getMoviesPlayingOnDate;

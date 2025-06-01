const db = require('../config/db');

async function getAllMoviesWithScreenings() {
    const [results] = await db.promise().query(`
        SELECT movies.*, GROUP_CONCAT(screenings.screening_time) AS screening_times
        FROM movies
        LEFT JOIN screenings ON movies.id = screenings.movie_id
        GROUP BY movies.id
    `);
    return results.map(movie => ({
        ...movie,
        screenings: movie.screening_times
            ? movie.screening_times.split(',').filter(time => time)
            : []
    }));
}

module.exports = getAllMoviesWithScreenings;

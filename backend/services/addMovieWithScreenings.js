const db = require('../config/db');

async function addMovieWithScreenings(movieData, screenings) {
    const { title, description, duration, start_date, end_date, room } = movieData;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        const [movieResult] = await connection.query(
            `INSERT INTO movies (title, description, duration, start_date, end_date, room)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, duration, start_date, end_date, room]
        );

        const movieId = movieResult.insertId;

        const screeningPromises = screenings.map(time => {
            if (!time) throw new Error('Invalid screening time');
            return connection.query(
                `INSERT INTO screenings (movie_id, screening_time)
                 VALUES (?, ?)`,
                [movieId, time]
            );
        });

        await Promise.all(screeningPromises);
        await connection.commit();
        return { movieId, screeningsAdded: screenings.length };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = addMovieWithScreenings;

const db = require('../config/db');

async function updateMovieWithScreenings(movieId, movieData, screenings) {
    const { title, description, duration, start_date, end_date, room } = movieData;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        const [updateResult] = await connection.query(
            `UPDATE movies 
             SET title = ?, description = ?, duration = ?, start_date = ?, end_date = ?, room = ?
             WHERE id = ?`,
            [title, description, duration, start_date, end_date, room, movieId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Movie not found');
        }

        await connection.query(
            `DELETE FROM screenings WHERE movie_id = ?`,
            [movieId]
        );

        if (screenings.length > 0) {
            const screeningPromises = screenings.map(time => {
                if (!time) throw new Error('Invalid screening time');
                return connection.query(
                    `INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)`,
                    [movieId, time]
                );
            });

            await Promise.all(screeningPromises);
        }

        await connection.commit();
        return { screeningsUpdated: screenings.length };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}


module.exports = updateMovieWithScreenings;

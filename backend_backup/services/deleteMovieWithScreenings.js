const db = require('../config/db');

async function deleteMovieWithScreenings(movieId) {
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM screenings WHERE movie_id = ?`,
            [movieId]
        );

        const [result] = await connection.query(
            `DELETE FROM movies WHERE id = ?`,
            [movieId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Movie not found');
        }

        await connection.commit();
        return { screeningsDeleted: result.affectedRows };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = deleteMovieWithScreenings;

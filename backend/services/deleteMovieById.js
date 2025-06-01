// services/deleteMovieById.js
const db = require('../config/db');

async function deleteMovieById(id) {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM screenings WHERE movie_id = ?', [id]);
        await connection.query('DELETE FROM movies WHERE id = ?', [id]);
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};


module.exports = deleteMovieById;

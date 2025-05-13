const insertMovie = async () => {
     const [movieResult] = await connection.query(
                "INSERT INTO movies (title, description, duration, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                [title, description, duration, start_date, end_date]
            );
            
        return movieResult;
}

const getMovies = async () => { 
     const query = `
            SELECT movies.*, GROUP_CONCAT(screenings.screening_time) AS screening_times
            FROM movies
            LEFT JOIN screenings ON movies.id = screenings.movie_id
            GROUP BY movies.id
        `;

        const [results] = await db.promise().query(query);
        
        return results;
}


module.exports = {
    insertMovie,
    getMovies
}
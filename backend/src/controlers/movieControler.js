const { insertMovie } = require("../repositories/movieRepositories");

app.post('/movies', async (req, res) => {
    try {
        const { title, description, duration, start_date, end_date, screenings } = req.body;

        // Validate required fields
        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields (title, duration, start_date, or end_date)' });
        }

        // Validate duration is a positive number
        if (isNaN(duration)) {
            return res.status(400).json({ error: 'Duration must be a number' });
        }

        // Validate date format (basic check)
        if (isNaN(new Date(start_date).getTime()) || isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Validate screenings array
        if (!Array.isArray(screenings) || screenings.length === 0) {
            return res.status(400).json({ error: 'At least one screening time is required' });
        }

        // Start transaction
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // Insert movie
            // const [movieResult] = await connection.query(
            //     "INSERT INTO movies (title, description, duration, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
            //     [title, description, duration, start_date, end_date]
            // );
            const [movieResult] = await insertMovie(title, description, duration, start_date, end_date);
            
            const movieId = movieResult.insertId;

            // Insert screenings
            const screeningPromises = screenings.map(time => {
                if (!time) {
                    throw new Error('Invalid screening time');
                }
                return connection.query(
                    "INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)",
                    [movieId, time]
                );
            });

            await Promise.all(screeningPromises);
            await connection.commit();

            res.status(201).json({ 
                message: "Movie added successfully", 
                movieId,
                screeningsAdded: screenings.length
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Add movie error:', err);
        res.status(500).json({ 
            error: 'Failed to add movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.get('/movies', async (req, res) => {
    try {
        // const query = `
        //     SELECT movies.*, GROUP_CONCAT(screenings.screening_time) AS screening_times
        //     FROM movies
        //     LEFT JOIN screenings ON movies.id = screenings.movie_id
        //     GROUP BY movies.id
        // `;

        // const [results] = await db.promise().query(query);
        const results = await getMovies();

        const movies = results.map(movie => ({
            ...movie,
            screenings: movie.screening_times ? 
                movie.screening_times.split(',').filter(time => time) : []
        }));

        res.json(movies);

    } catch (err) {
        console.error('Get movies error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch movies',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


app.put('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const { title, description, duration, start_date, end_date, screenings } = req.body;

        // Validate movie ID
        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Validate required fields
        if (!title || !duration || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate screenings array
        if (!Array.isArray(screenings)) {
            return res.status(400).json({ error: 'Screenings must be an array' });
        }

        // Start transaction
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // Update movie
            const [updateResult] = await connection.query(
                "UPDATE movies SET title = ?, description = ?, duration = ?, start_date = ?, end_date = ? WHERE id = ?",
                [title, description, duration, start_date, end_date, movieId]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Movie not found');
            }

            // Delete existing screenings
            await connection.query(
                "DELETE FROM screenings WHERE movie_id = ?",
                [movieId]
            );

            // Insert new screenings
            if (screenings.length > 0) {
                const screeningPromises = screenings.map(time => {
                    if (!time) {
                        throw new Error('Invalid screening time');
                    }
                    // return connection.query(
                    //     "INSERT INTO screenings (movie_id, screening_time) VALUES (?, ?)",
                    //     [movieId, time]
                    // );
                    return addScreenings(movieId, time);
                    
                });

                await Promise.all(screeningPromises);
            }

            await connection.commit();

            res.json({ 
                message: "Movie updated successfully",
                screeningsUpdated: screenings.length
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Update movie error:', err);
        
        if (err.message === 'Movie not found') {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ 
            error: 'Failed to update movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});




app.get('/movies/playing', async (req, res) => {    
    try {

        // Validate date parameter
        const date = req.query.date;
        if (!date) {
            return res.status(400).json({ 
                error: 'Date parameter is required',
                example: '/movies/playing?date=2023-12-31'
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ 
                error: 'Invalid date format. Please use YYYY-MM-DD format',
                received: date,
                example: '2023-12-31'
            });
        }

        // Validate the date is a valid calendar date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date value',
                received: date
            });
        }

        // Format the date to ensure MySQL compatibility
        const formattedDate = parsedDate.toISOString().split('T')[0];

        // const query = `
        //     SELECT 
        //         m.*,
        //         GROUP_CONCAT(
        //             TIME_FORMAT(s.screening_time, '%H:%i:%s')
        //             ORDER BY s.screening_time
        //         ) AS screenings,
        //         GROUP_CONCAT(s.id ORDER BY s.screening_time) AS screeningIds
        //     FROM 
        //         movies m
        //     LEFT JOIN 
        //         screenings s ON m.id = s.movie_id
        //         AND DATE(s.screening_time) = ?
        //     WHERE 
        //         m.start_date <= ? AND 
        //         m.end_date >= ?
        //     GROUP BY 
        //         m.id
        // `;
        
        // // Using promise-based query with connection pooling
        // const [results] = await db.promise().query(query, [formattedDate, formattedDate, formattedDate]);
        const results = await movieList(formattedDate, formattedDate, formattedDate);
        
        // Process results
        var movies = results.map(movie => ({
            ...movie,
            screenings: movie.screenings ? 
                movie.screenings.split(',').filter(time => time.trim() !== '') : 
                []
        }));

        for(var i=0;i<movies.length;i+=1){
            movies[i].screeningIds = movies[i].screeningIds.split(',');
        }
        
        // Add cache headers for better performance
        //res.set('Cache-Control', 'public, max-age=0'); // Cache for 1 hour
        res.json({
            success: true,
            date: formattedDate,
            count: movies.length,
            data: movies
        });

        //console.log(movies);

    } catch (err) {
        console.error('Error fetching currently playing movies:', err);
        
        // Differentiate between different types of errors
        let statusCode = 500;
        let errorMessage = 'Failed to fetch currently playing movies';
        
        if (err.code === 'ER_PARSE_ERROR') {
            statusCode = 400;
            errorMessage = 'Invalid date parameter';
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed';
        }
        
        res.status(statusCode).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                stack: err.stack
            } : undefined
        });
    }
});
























app.delete('/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;

        // Validate movie ID
        if (isNaN(movieId)) {
            return res.status(400).json({ error: 'Invalid movie ID' });
        }

        // Start transaction (to delete both movie and its screenings)
        const connection = await db.promise().getConnection();
        await connection.beginTransaction();

        try {
            // First delete screenings (to maintain referential integrity)
            await connection.query(
                "DELETE FROM screenings WHERE movie_id = ?",
                [movieId]
            );

            // Then delete the movie
            const [result] = await connection.query(
                "DELETE FROM movies WHERE id = ?",
                [movieId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Movie not found');
            }

            await connection.commit();

            res.json({ 
                message: "Movie deleted successfully",
                screeningsDeleted: result.affectedRows
            });

        } catch (transactionErr) {
            await connection.rollback();
            console.error('Transaction error:', transactionErr);
            throw transactionErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Delete movie error:', err);
        
        if (err.message === 'Movie not found') {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ 
            error: 'Failed to delete movie',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});
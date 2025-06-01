const request = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteMovieById = require('../services/deleteMovieById'); // optional cleanup util

describe('PUT /movies/:id', () => {
    let agent;
    let movieId;

    const movieData = {
        title: 'Original Title',
        description: 'Original Description',
        duration: 120,
        start_date: '2025-06-10',
        end_date: '2025-06-20',
        room: 1,
        screenings: ['2025-06-11T10:00:00', '2025-06-12T12:00:00']
    };

    const updatedData = {
        title: 'Updated Title',
        description: 'Updated Description',
        duration: 135,
        start_date: '2025-06-11',
        end_date: '2025-06-21',
        room: 2,
        screenings: ['2025-06-13T14:00:00', '2025-06-14T16:00:00']
    };

    beforeAll(async () => {
        agent = await loginAndReturnAgent('TestEditor', 'securepassword', 'employee');

        // Create a movie to update
        const res = await agent
            .post('/movies')
            .send(movieData)
            .expect(201);

        movieId = res.body.movieId;
    });

    it('should return 400 for invalid movie ID', async () => {
        const res = await agent
            .put('/movies/notanumber')
            .send(updatedData)
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Invalid movie ID');
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await agent
            .put(`/movies/${movieId}`)
            .send({ ...updatedData, title: undefined })
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 if screenings is not an array', async () => {
        const res = await agent
            .put(`/movies/${movieId}`)
            .send({ ...updatedData, screenings: 'wrongformat' })
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Screenings must be an array');
    });

    it('should update the movie and return success message', async () => {
        const res = await agent
            .put(`/movies/${movieId}`)
            .send(updatedData)
            .expect(200);

        expect(res.body).toHaveProperty('message', 'Movie updated successfully');
        expect(res.body).toHaveProperty('screeningsUpdated', updatedData.screenings.length);
    });

    afterAll(async () => {
        if (movieId) await deleteMovieById(movieId);
    });
});

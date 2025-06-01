const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('DELETE /movies/:id', () => {
    let agent;
    let createdMovieId = null;

    beforeAll(async () => {
        agent = await loginAndReturnAgent('TestMovieDeleter', 'strongpassword', 'employee');

        const createRes = await agent.post('/movies').send({
            title: 'DeleteTestMovie',
            description: 'A movie to delete',
            duration: 100,
            start_date: '2025-07-01',
            end_date: '2025-07-31',
            room: 1,
            screenings: ['2025-07-10 18:00:00']
        });

        createdMovieId = createRes.body.movieId;
    });

    it('should return 400 for invalid movie ID', async () => {
        const res = await agent.delete('/movies/abc').expect(400);
        expect(res.body).toHaveProperty('error', 'Invalid movie ID');
    });

    it('should delete the movie and return success message', async () => {
        const res = await agent.delete(`/movies/${createdMovieId}`).expect(200);
        expect(res.body).toHaveProperty('message', 'Movie deleted successfully');
    });

    it('should return 404 if the movie was already deleted', async () => {
        const res = await agent.delete(`/movies/${createdMovieId}`).expect(404);
        expect(res.body).toHaveProperty('error', 'Movie not found');
    });

    afterAll(async () => {
        await deleteUserByUsername('TestMovieDeleter');
    });
});

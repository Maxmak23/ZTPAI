const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('GET /movies', () => {
    let agent;

    beforeAll(async () => {
        // Login as any valid user (no special role required)
        agent = await loginAndReturnAgent('TestMovieViewer', 'securepassword', 'client');
    });

    it('should return an array of movies with screenings', async () => {
        const res = await agent
            .get('/movies')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);

        if (res.body.length > 0) {
            const movie = res.body[0];
            expect(movie).toHaveProperty('id');
            expect(movie).toHaveProperty('title');
            expect(movie).toHaveProperty('screenings');
            expect(Array.isArray(movie.screenings)).toBe(true);
        }
    });

    it('should return 200 even if no movies exist', async () => {
        const res = await agent
            .get('/movies')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });

    afterAll(async () => {
        await deleteUserByUsername(username);
    });
});

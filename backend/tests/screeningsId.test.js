const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('GET /screenings/:id', () => {
    let agent;
    let screeningId;

    beforeAll(async () => {
        // Log in as employee to add a movie + screenings
        agent = await loginAndReturnAgent('TestScreeningFetcher', 'strongpassword', 'employee');

        // Add a test movie with screenings to get a valid screening ID
        const movieRes = await agent.post('/movies').send({
            title: 'Screening Movie',
            description: 'Test movie for screening fetch',
            duration: 120,
            start_date: '2025-06-05',
            end_date: '2025-06-30',
            room: 1,
            screenings: ['2025-06-10 18:00:00']
        });

        // Extract screening ID
        const addedScreenings = movieRes.body.addedScreenings || [];
        screeningId = addedScreenings[0]?.id;
    });

    it('should return 404 for non-existent screening', async () => {
        const res = await request(app)
            .get('/screenings/999999') // Assuming this ID doesn't exist
            .expect(404);

        expect(res.body).toHaveProperty('error', 'Screening not found');
    });

    afterAll(async () => {
        await deleteUserByUsername('TestScreeningFetcher');
    });
});

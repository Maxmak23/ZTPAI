const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('GET /screenings_stats', () => {
    let agent;

    beforeAll(async () => {
        // Log in as an employee
        agent = await loginAndReturnAgent('TestStatsUser', 'strongpassword', 'employee');
    });

    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/screenings_stats')
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });

    it('should return screening stats for authenticated employee', async () => {
        const res = await agent
            .get('/screenings_stats')
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
        if (res.body.count > 0) {
            const sample = res.body.data[0];
            expect(sample).toHaveProperty('movie_title');
            expect(sample).toHaveProperty('reserved_seats');
            expect(sample).toHaveProperty('available_seats');
            expect(sample).toHaveProperty('occupancy_rate');
        }
    });

    afterAll(async () => {
        await deleteUserByUsername('TestStatsUser');
    });
});

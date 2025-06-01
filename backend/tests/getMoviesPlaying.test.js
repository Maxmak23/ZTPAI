const request = require('supertest');
const app = require('../testServer');

describe('GET /movies/playing', () => {
    it('should return 400 if date is missing', async () => {
        const res = await request(app)
            .get('/movies/playing')
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Date parameter is required');
    });

    it('should return 400 if date format is invalid', async () => {
        const res = await request(app)
            .get('/movies/playing?date=31-12-2025')
            .expect(400);

        expect(res.body.error).toMatch(/Invalid date format/);
    });

    it('should return 200 and list of movies (if any) for valid date', async () => {
        const res = await request(app)
            .get('/movies/playing?date=2025-06-15') // Adjust to match your seeded data
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

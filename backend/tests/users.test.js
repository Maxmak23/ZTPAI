const request = require('supertest');
const app = require('../testServer'); // <- your test server

describe('GET /admin/users', () => {
    it('should return 401 if not authenticated as admin', async () => {
        const res = await request(app)
            .get('/admin/users')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });

    // Example only: this will work when you simulate login
    it('should return users if logged in as admin (mocked)', async () => {
        const agent = request.agent(app);

        // Simulate login by setting session manually if needed
        const loginRes = await agent
            .post('/login')
            .send({ username: 'Admin1', password: '12345678910' });

        const res = await agent
            .get('/admin/users')
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
    });
});

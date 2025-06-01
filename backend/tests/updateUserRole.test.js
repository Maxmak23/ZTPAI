const request = require('supertest');
const app = require('../testServer');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('PUT /admin/users/:id/role', () => {
    let agent;
    let targetUserId;

    beforeAll(async () => {
        agent = request.agent(app);

        // Log in as admin
        const loginRes = await agent
            .post('/login')
            .send({ username: 'Admin1', password: '12345678910' });

        // Create a dummy user to be updated (or find one)
        const registerRes = await agent
            .post('/register')
            .send({
                username: 'TestUserToUpdate',
                password: 'strongpassword',
                role: 'client'
            });

        targetUserId = registerRes.body.userId;
    });

    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .put(`/admin/users/${targetUserId}/role`)
            .send({ role: 'manager' })
            .expect(401);

        expect(res.body).toHaveProperty('error');
    });

    it('should successfully update a user role', async () => {
        const res = await agent
            .put(`/admin/users/${targetUserId}/role`)
            .send({ role: 'employee' })
            .expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'User role updated successfully');
    });



    it('should fail with invalid role', async () => {
        const res = await agent
            .put(`/admin/users/${targetUserId}/role`)
            .send({ role: 'superwizard' }) // invalid role
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Invalid role');
        expect(res.body.valid_roles).toContain('admin');
    });
    
    afterAll(async () => {
        // Clean up the test user
        await deleteUserByUsername('TestUserToUpdate');
    });

});

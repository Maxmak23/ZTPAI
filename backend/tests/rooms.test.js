const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');
const deleteUserByUsername = require('../services/deleteUserByUsername');

describe('GET /rooms', () => {
    const username = 'TestRoomUser';
    const password = 'strongpassword';
    const role = 'employee';
    let agent;

    beforeAll(async () => {
        // Login and create user session
        agent = await loginAndReturnAgent(username, password, role);
    });

    it('should return list of rooms', async () => {
        const res = await agent
            .get('/rooms')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });

    afterAll(async () => {
        await deleteUserByUsername('TestRoomUser');
    });
});

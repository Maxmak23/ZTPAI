const request = require('supertest');
const app = require('../testServer');

module.exports = async function loginAndReturnAgent(username, password, role) {
    const agent = request.agent(app);

    await request(app)
        .post('/register')
        .send({ username, password, role });

    await agent
        .post('/login')
        .send({ username, password });

    return agent;
};

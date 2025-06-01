const request = require('supertest');
const app = require('../../testServer');
const deleteUserByUsername = require('../../services/deleteUserByUsername');

describe('POST /register', () => {
    const baseUsername = 'TestRegisterUser';
    const validPassword = 'strongpassword';
    const validRole = 'client';


    it('should return 400 if fields are missing', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: '', password: '', role: '' })
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 if password is too short', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: `${baseUsername}_short`, password: '123', role: validRole })
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Password must be at least 8 characters long');
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/register')
            .send({
                username: `${baseUsername}_success`,
                password: validPassword,
                role: validRole
            })
            .expect(201);

        expect(res.body).toHaveProperty('message', 'User registered successfully');
        expect(res.body).toHaveProperty('userId');
    });

    it('should return 409 if username already exists', async () => {
        const username = `${baseUsername}_duplicate`;

        // First registration (should succeed)
        await request(app)
            .post('/register')
            .send({ username, password: validPassword, role: validRole });

        // Second registration (should fail)
        const res = await request(app)
            .post('/register')
            .send({ username, password: validPassword, role: validRole })
            .expect(409);

        expect(res.body).toHaveProperty('error', 'Username already exists');
    });

    
    afterAll(async () => {
        // Clean up the test user
        deleteUserByUsername(`${baseUsername}`);
        deleteUserByUsername(`${baseUsername}_short`);
        deleteUserByUsername(`${baseUsername}_success`);
        deleteUserByUsername(`${baseUsername}_duplicate`);
    });
    
});

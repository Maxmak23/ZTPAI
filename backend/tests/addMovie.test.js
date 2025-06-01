const request = require('supertest');
const app = require('../testServer');
const loginAndReturnAgent = require('../services/loginAndReturnAgent');

describe('POST /movies', () => {
    let agent;

    beforeAll(async () => {
        // Log in as employee (or role with permission)
        agent = await loginAndReturnAgent('TestMovieAdder', 'strongpassword', 'employee');
    });

    const validMovie = {
        title: 'Test Movie',
        description: 'Test description',
        duration: 120,
        start_date: '2025-06-10',
        end_date: '2025-06-30',
        room: 1,
        screenings: ['2025-06-15 18:00:00', '2025-06-16 20:00:00']
    };

    it('should return 400 if required fields are missing', async () => {
        const { title, ...partial } = validMovie;

        const res = await agent
            .post('/movies')
            .send(partial)
            .expect(400);

        expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if duration is not a number', async () => {
        const res = await agent
            .post('/movies')
            .send({ ...validMovie, duration: 'abc' })
            .expect(400);

        expect(res.body.error).toMatch(/Duration must be a number/);
    });

    it('should return 400 if date format is invalid', async () => {
        const res = await agent
            .post('/movies')
            .send({ ...validMovie, start_date: 'invalid-date' })
            .expect(400);

        expect(res.body.error).toMatch(/Invalid date format/);
    });

    it('should return 400 if no screenings provided', async () => {
        const res = await agent
            .post('/movies')
            .send({ ...validMovie, screenings: [] })
            .expect(400);

        expect(res.body.error).toMatch(/At least one screening time is required/);
    });

    it('should create a movie and return 201', async () => {
        const res = await agent
            .post('/movies')
            .send(validMovie)
            .expect(201);

        expect(res.body).toHaveProperty('message', 'Movie added successfully');
        expect(res.body).toHaveProperty('movieId');
        expect(res.body).toHaveProperty('screeningsAdded');
    });
});

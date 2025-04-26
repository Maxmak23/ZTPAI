const request = require('supertest'); // Import Supertest
const app = require('./server');  // Import your server from server.js



describe('POST /movies', () => {

  it('should create a movie successfully', async () => {
    const res = await request(app)
      .post('/movies')
      .send({
        title: 'Test Movie',
        description: 'A cool test movie',
        duration: 120,
        start_date: '2025-05-01',
        end_date: '2025-06-01',
        screenings: ['2025-05-01T10:00:00Z']
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('movieId');
    expect(res.body.screeningsAdded).toBe(1);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/movies')
      .send({
        description: 'No title',
        duration: 100,
        start_date: '2025-05-01',
        end_date: '2025-06-01',
        screenings: ['2025-05-01T10:00:00Z']
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  it('should return 400 for invalid duration', async () => {
    const res = await request(app)
      .post('/movies')
      .send({
        title: 'Bad Duration',
        description: 'Not a number',
        duration: 'two hours',
        start_date: '2025-05-01',
        end_date: '2025-06-01',
        screenings: ['2025-05-01T10:00:00Z']
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Duration must be a number/i);
  });

  it('should return 400 for invalid date format', async () => {
    const res = await request(app)
      .post('/movies')
      .send({
        title: 'Bad Dates',
        description: 'Wrong format',
        duration: 90,
        start_date: 'not-a-date',
        end_date: 'also-not-a-date',
        screenings: ['2025-05-01T10:00:00Z']
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid date format/i);
  });

  it('should return 400 if screenings are missing or empty', async () => {
    const res = await request(app)
      .post('/movies')
      .send({
        title: 'No Screenings',
        description: 'Missing screenings',
        duration: 100,
        start_date: '2025-05-01',
        end_date: '2025-06-01',
        screenings: []
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/At least one screening time is required/i);
  });

});




describe('GET /movies', () => {

  it('should return an array of movies with screenings', async () => {
    const res = await request(app).get('/movies');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const movie = res.body[0];

      expect(movie).toHaveProperty('id');
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('screenings');
      expect(Array.isArray(movie.screenings)).toBe(true);
    }
  });

});




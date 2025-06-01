require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Import routes
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const reservationsRoutes = require('./routes/reservations.routes');
const screeningsRoutes = require('./routes/screenings.routes');

// Use routes
app.use('/', adminRoutes);
app.use('/', authRoutes);
app.use('/', moviesRoutes);
app.use('/', reservationsRoutes);
app.use('/', screeningsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
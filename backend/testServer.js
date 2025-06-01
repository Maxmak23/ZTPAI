const express = require('express');
const app = require('./app');

// Import routes
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const reservationsRoutes = require('./routes/reservations.routes');
const screeningsRoutes = require('./routes/screenings.routes');

// Mount routes
app.use('/', adminRoutes);
app.use('/', authRoutes);
app.use('/', moviesRoutes);
app.use('/', reservationsRoutes);
app.use('/', screeningsRoutes);

// Export for supertest
module.exports = app;
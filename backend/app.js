require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const session = require("express-session");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const errorHandler = require('./middleware/error');
const specs = require('./config/swagger');

const app = express();

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    },    
}));

// Middleware
app.use(cors({ 
    origin: "http://localhost:3000", 
    credentials: true,
    exposedHeaders: ['set-cookie']
}));

app.use(express.json());

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handling
app.use(errorHandler);

module.exports = app;
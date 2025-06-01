require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const errorHandler = require('./middleware/error');
const specs = require('./config/swagger');

const app = express();

app.use(cors({ 
    origin: "http://localhost:3000", 
    credentials: true,
    exposedHeaders: ['set-cookie']
}));

app.use(express.json());
app.use(cookieParser());

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error
app.use(errorHandler);

module.exports = app;
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Registration API',
    version: '1.0.0',
    description: 'API for user registration and authentication',
  },
  paths: {}
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Scan route files for JSDoc comments
};

const specs = swaggerJsdoc(options);

module.exports = specs;
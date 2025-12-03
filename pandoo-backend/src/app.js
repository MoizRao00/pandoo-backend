const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const routes = require('./routes/index');
const config = require('./config/index');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the database
mongoose.connect(config.database.url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.info('Database connected successfully'))
    .catch(err => logger.error('Database connection error:', err));

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Export the app for testing
module.exports = app;
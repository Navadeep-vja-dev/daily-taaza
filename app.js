const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { createApiApp } = require('./src/api');
const errorHandler = require('./src/api/middleware/errorHandler.middleware');
const { env } = require('./src/shared/config/env');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/src/data', express.static(path.join(__dirname, 'src/data')));
app.use('/src/domain', express.static(path.join(__dirname, 'src/domain')));
app.use('/styles', express.static(path.join(__dirname, 'src/presentation/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'src/presentation/scripts')));
app.use('/assets', express.static(path.join(__dirname, 'src/presentation/assets')));
app.use(express.static(path.join(__dirname, 'src/presentation/views')));

app.use(env.apiPrefix, createApiApp());

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.use(errorHandler);

module.exports = app;

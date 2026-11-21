const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const homeRoutes = require('./routes/home');
const locationsRoutes = require('./routes/locations');
const placeRequestsRoutes = require('./routes/placeRequests');
const groupsRoutes = require('./routes/groups');
const orgsRoutes = require('./routes/orgs');
const eventsRoutes = require('./routes/events');
const communitiesRoutes = require('./routes/communities');
const leaderboardRoutes = require('./routes/leaderboard');
const badgesRoutes = require('./routes/badges');
const collabRoutes = require('./routes/collab');
const adminRoutes = require('./routes/admin');

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Mounted routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/place-requests', placeRequestsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/orgs', orgsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/collab-requests', collabRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', meRoutes);

// Central error handler
app.use(errorHandler);

module.exports = app;

require('dotenv').config({ path: '../.env.' + (process.env.NODE_ENV || 'development') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/monitor-aps/health', (_req, res) => {
  res.json({ status: 'ok', module: 'monitor-aps', version: '0.1.0' });
});

app.use('/api/monitor-aps', routes);

const PORT = process.env.MONITOR_APS_API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Monitor APS API rodando na porta ${PORT}`);
});

module.exports = app;

const { Router } = require('express');
const configRoutes      = require('./config.routes');
const indicadoresRoutes = require('./indicadores.routes');

const router = Router();

router.use('/config',      configRoutes);
router.use('/indicadores', indicadoresRoutes);

module.exports = router;

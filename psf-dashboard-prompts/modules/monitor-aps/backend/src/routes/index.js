const { Router } = require('express');
const configRoutes = require('./config.routes');

const router = Router();

router.use('/config', configRoutes);

// Placeholder para indicadores (Task 2.6)
// router.use('/indicadores', indicadoresRoutes);

module.exports = router;

const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const asyncHandler = require('./middleware/asyncHandler');
const createAuthCoreRoutes = require('./routes/authCoreRoutes');
const createVoucherRoutes = require('./routes/voucherRoutes');
const createPackageRoutes = require('./routes/packageRoutes');
const createClientRoutes = require('./routes/clientRoutes');
const createNetworkGroupRoutes = require('./routes/networkGroupRoutes');
const { createAppDependencies } = require('./modules/compositionRoot');
const { initializeFirebase } = require('./firebase/firebase');

initializeFirebase();

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));

const app = express();
const {
  authController,
  voucherController,
  packageController,
  clientController,
  networkGroupController
} = createAppDependencies();

const authCoreRoutes = createAuthCoreRoutes({ authController });
const voucherRoutes = createVoucherRoutes({ voucherController });
const packageRoutes = createPackageRoutes({ packageController });
const clientRoutes = createClientRoutes({ clientController });
const networkGroupRoutes = createNetworkGroupRoutes({ networkGroupController });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/login', (req, res) => {
  res.status(405).json({
    message: 'Use POST /login with JSON body: { ruijie_id, ruijie_secret }'
  });
});

app.post('/login', asyncHandler(authController.login));

app.use('/auth/core', authCoreRoutes);
app.use('/vouchers', voucherRoutes);
app.use('/packages', packageRoutes);
app.use('/clients', clientRoutes);
app.use('/network_group', networkGroupRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || 'Internal server error'
  };

  if (error.details) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
});

module.exports = app;

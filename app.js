const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const asyncHandler = require('./middleware/asyncHandler');
const { responseEnvelopeMiddleware, isBypassedPath } = require('./middleware/responseEnvelope');
const createAuthCoreRoutes = require('./routes/authCoreRoutes');
const createVoucherRoutes = require('./routes/voucherRoutes');
const createPackageRoutes = require('./routes/packageRoutes');
const createClientRoutes = require('./routes/clientRoutes');
const createNetworkGroupRoutes = require('./routes/networkGroupRoutes');
const createDemoRoutes = require('./routes/demoRoutes');
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
app.use(responseEnvelopeMiddleware);

app.use((req, res, next) => {
  console.log('[Request]', {
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  res.on('finish', () => {
    console.log('[Response]', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode
    });
  });

  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/login', (req, res) => {
  res.status(405).json({
    message: 'Use POST /login with JSON body: { ruijie_id, ruijie_secret }'
  });
});

app.post('/login', asyncHandler(authController.login));

app.use('/demo', createDemoRoutes());

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
  let statusCode = error.statusCode || 500;
  const details = error.details || null;

  const isUsergroupNotSynced = Number(details?.voucherData?.code) === 1014;
  const message = isUsergroupNotSynced
    ? 'Selected usergroup is not synchronized yet.'
    : (error.message || 'Internal server error');

  if (isUsergroupNotSynced) {
    statusCode = 409;
  }

  if (isBypassedPath(req.originalUrl, req.path)) {
    const payload = {
      message
    };

    if (details) {
      payload.details = details;
    }

    res.status(statusCode).json(payload);
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      httpStatus: statusCode,
      code: isUsergroupNotSynced ? 'USERGROUP_NOT_SYNCED' : undefined,
      resetRequired: isUsergroupNotSynced || undefined,
      nextAction: isUsergroupNotSynced ? 'refresh_network_group_and_reselect' : undefined,
      details
    }
  });
});

module.exports = app;

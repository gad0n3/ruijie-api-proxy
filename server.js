const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`ruijie-api-proxy running on port ${config.port}`);
});

const staticConfig = require('./app.json');

module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const isHttpApi = apiUrl?.startsWith('http://');
  const android = {
    ...config.android,
    ...(isHttpApi ? { usesCleartextTraffic: true } : {})
  };

  return {
    ...staticConfig.expo,
    ...config,
    android,
    extra: {
      ...config.extra,
      ...(apiUrl ? { apiUrl } : {})
    }
  };
};

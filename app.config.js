module.exports = {
  expo: {
    ...require('./app.json').expo,
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
        },
      ],
    ],
  },
};

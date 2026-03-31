const { device } = require("detox");

beforeAll(async () => {
  await device.launchApp({ newInstance: true, permissions: { notifications: "YES" } });
});

beforeEach(async () => {
  await device.reloadReactNative();
});


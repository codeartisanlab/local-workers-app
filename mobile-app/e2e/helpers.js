async function loginAsCustomer() {
  await expect(element(by.id("login-screen"))).toBeVisible();
  await element(by.id("login-phone-input")).replaceText("9000000001");
  await element(by.id("role-customer")).tap();
  await element(by.id("send-otp-button")).tap();
  await waitFor(element(by.id("otp-hint"))).toBeVisible().withTimeout(5000);
  await element(by.id("login-otp-input")).replaceText("123456");
  await element(by.id("continue-button")).tap();
  await waitFor(element(by.id("home-screen"))).toBeVisible().withTimeout(10000);
}

async function loginAsWorker() {
  await expect(element(by.id("login-screen"))).toBeVisible();
  await element(by.id("login-phone-input")).replaceText("9000000002");
  await element(by.id("role-worker")).tap();
  await element(by.id("send-otp-button")).tap();
  await waitFor(element(by.id("otp-hint"))).toBeVisible().withTimeout(5000);
  await element(by.id("login-otp-input")).replaceText("654321");
  await element(by.id("continue-button")).tap();
  await waitFor(element(by.id("home-screen"))).toBeVisible().withTimeout(10000);
}

module.exports = {
  loginAsCustomer,
  loginAsWorker,
};


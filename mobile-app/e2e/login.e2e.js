const { loginAsCustomer } = require("./helpers");

describe("Login flow", () => {
  it("logs in a customer through the OTP flow", async () => {
    await expect(element(by.id("login-screen"))).toBeVisible();
    await element(by.id("login-phone-input")).replaceText("9000000001");
    await element(by.id("role-customer")).tap();
    await element(by.id("send-otp-button")).tap();

    await waitFor(element(by.id("otp-hint"))).toBeVisible().withTimeout(5000);
    await expect(element(by.id("otp-hint"))).toBeVisible();

    await element(by.id("login-otp-input")).replaceText("123456");
    await element(by.id("continue-button")).tap();

    await waitFor(element(by.id("home-screen"))).toBeVisible().withTimeout(10000);
    await expect(element(by.id("home-heading"))).toBeVisible();
  });

  it("supports logout after login", async () => {
    await loginAsCustomer();
    await element(by.id("logout-button")).tap();
    await waitFor(element(by.id("login-screen"))).toBeVisible().withTimeout(5000);
  });
});


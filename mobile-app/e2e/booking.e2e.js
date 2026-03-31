const { loginAsCustomer } = require("./helpers");

describe("Booking flow", () => {
  it("allows a customer to book a nearby worker", async () => {
    await loginAsCustomer();

    await waitFor(element(by.id("book-now-button-0"))).toBeVisible().withTimeout(10000);
    await element(by.id("book-now-button-0")).tap();

    await waitFor(element(by.id("booking-screen"))).toBeVisible().withTimeout(5000);
    await expect(element(by.id("booking-worker-name"))).toBeVisible();

    await element(by.id("booking-location-input")).replaceText("221B Baker Street");
    await element(by.id("booking-time-input")).replaceText("2026-03-30T10:00:00Z");
    await element(by.id("confirm-booking-button")).tap();

    await waitFor(element(by.id("home-screen"))).toBeVisible().withTimeout(10000);
    await expect(element(by.id("home-heading"))).toBeVisible();
  });
});


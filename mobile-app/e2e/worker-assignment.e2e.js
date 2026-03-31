const { loginAsWorker } = require("./helpers");

describe("Worker accepting job", () => {
  it("lets a worker open the dashboard and accept a job", async () => {
    await loginAsWorker();

    await element(by.id("worker-dashboard-button")).tap();
    await waitFor(element(by.id("worker-dashboard-screen"))).toBeVisible().withTimeout(5000);
    await expect(element(by.id("worker-dashboard-heading"))).toBeVisible();

    await waitFor(element(by.id("accept-job-button-0"))).toBeVisible().withTimeout(10000);
    await element(by.id("accept-job-button-0")).tap();

    await waitFor(element(by.id("job-status-0"))).toHaveText("Current status: accepted").withTimeout(10000);
    await expect(element(by.id("job-status-0"))).toHaveText("Current status: accepted");
  });
});


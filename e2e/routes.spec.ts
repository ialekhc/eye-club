import { expect, test } from "@playwright/test";

test("public try-on studio renders", async ({ page }) => {
  await page.goto("/try-on");
  await expect(page.getByRole("heading", { name: /your next frame/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /upload your photo/i })).toBeVisible();
});

test("account lifecycle pages render accessible forms", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /request reset/i })).toBeVisible();
  await page.goto("/verify-email");
  await expect(page.getByRole("heading", { name: /verify email/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /request verification/i })).toBeVisible();
});

test("invitation page preserves token route", async ({ page }) => {
  await page.goto("/invite/example-token");
  await expect(page.getByRole("heading", { name: /join your optical team/i })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("merchant dashboard entry points render sign-in forms", async ({ page }) => {
  for (const route of ["/dashboard/products", "/dashboard/analytics", "/dashboard/team", "/dashboard/widget", "/dashboard/billing"]) {
    await page.goto(route);
    await expect(page.locator("form").first()).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeVisible();
  }
});

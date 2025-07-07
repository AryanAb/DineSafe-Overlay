import { test, expect } from './fixtures';

test('Regular restaurants', async ({ page }) => {
  await page.goto('https://www.google.ca/maps');
  await page.waitForTimeout(2500);
  await page.goto('https://www.google.ca/maps/place/Union/@43.6458639,-79.4196803,20.47z/data=!4m6!3m5!1s0x89d4cb53599a7961:0xca2a169681c695c7!8m2!3d43.6458179!4d-79.4195744!16s%2Fg%2F11btmq9n6h?entry=ttu&g_ep=EgoyMDI1MDYzMC4wIKXMDSoASAFQAw%3D%3D');
  await page.waitForTimeout(500);
  await expect(page.getByTestId('DineSafeOverlay-badge')).toBeVisible();
  await expect(page.getByTestId('DineSafeOverlay-badge')).toHaveAttribute('href', 'https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/#establishment/10345392');
  await expect(page.getByTestId('DineSafeOverlay-badge')).toHaveText(/🟢|🟡|🔴/);
});

test('Restaurants with additional text in their name', async ({ page }) => {
  await page.goto('https://www.google.ca/maps');
  await page.waitForTimeout(2500);
  await page.goto('https://www.google.ca/maps/place/MOK+-+Man+of+Kent/@43.6487357,-79.4234029,17z/data=!3m1!4b1!4m6!3m5!1s0x882b34f9466c0001:0x848a87145722b682!8m2!3d43.6487318!4d-79.420828!16s%2Fg%2F11csqd_xz6?entry=ttu&g_ep=EgoyMDI1MDYzMC4wIKXMDSoASAFQAw%3D%3D');
  await page.waitForTimeout(500);
  await expect(page.getByTestId('DineSafeOverlay-badge')).toBeVisible();
  await expect(page.getByTestId('DineSafeOverlay-badge')).toHaveAttribute('href', 'https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/#establishment/10584388');
  await expect(page.getByTestId('DineSafeOverlay-badge')).toHaveText(/🟢|🟡|🔴/);
});

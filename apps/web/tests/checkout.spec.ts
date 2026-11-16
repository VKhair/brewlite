import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

type Product = {
  name: string;
  basePrice: number;
  sizes: { name: string; priceDelta: number }[];
  toppings: { name: string; price: number; isAvailable: boolean }[];
};

async function prepareCheckout(page: Page) {
  await page.goto('/register');
  await page.getByPlaceholder('Nguyễn Văn A').fill('Khách nghiệm thu');
  await page.getByPlaceholder('ban@example.com').fill(`e2e-${randomUUID()}@example.com`);
  const password = 'BrewLiteQa1478';
  await page.locator('input[type=password]').first().fill(password);
  await page.getByPlaceholder('Nhập lại mật khẩu').fill(password);
  await page.locator('form button').click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto('/menu');
  const productLink = page.locator('a[href^="/product/"]').first();
  const productPath = await productLink.getAttribute('href');
  const productId = productPath?.split('/').pop();
  const response = await page.request.get(`/api/backend/products/${productId}`);
  expect(response.ok()).toBeTruthy();
  const product: Product = await response.json();
  const size = product.sizes.find((item) => item.priceDelta > 0)!;
  const topping = product.toppings.find((item) => item.isAvailable)!;
  expect(size).toBeDefined();
  expect(topping).toBeDefined();

  await productLink.click();
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
  await page.getByRole('button', { name: new RegExp('^' + size.name + ' ') }).click();
  await page.locator('.topping-card').filter({ hasText: topping.name }).getByRole('checkbox').check();
  await page.getByRole('button', { name: /Thêm vào giỏ/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText(topping.name, { exact: false }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(product.name, { exact: false }).first()).toBeVisible();
  await page.locator('a[href="/checkout"]').click();
  const total = (product.basePrice + size.priceDelta + topping.price).toLocaleString('vi-VN');
  await expect(page.locator('.summary-total strong')).toContainText(total);
  return total;
}

async function expectConfirmationAndHistory(page: Page, total: string) {
  await expect(page).toHaveURL(/\/success\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();
  const orderId = new URL(page.url()).pathname.split('/').pop();
  await expect(page.locator('.success-info')).toContainText(total);
  await expect(page.locator('.success-info')).toContainText(/#[A-Z0-9]{8}/);
  await page.locator(`main a[href="/orders/${orderId}"]`).first().click();
  await expect(page.getByRole('heading', { name: 'Trạng thái hiện tại' })).toBeVisible();
  await page.goto('/orders');
  await expect(page.locator(`a[href="/orders/${orderId}"]`)).toBeVisible();
  return orderId;
}

test('mobile checkout confirms the order and shows it in history', async ({ page }) => {
  const total = await prepareCheckout(page);
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();
  await expectConfirmationAndHistory(page, total);
});

test('failed payment preserves the cart and retries the same order', async ({ page }) => {
  const total = await prepareCheckout(page);
  const fail = page.getByRole('checkbox', { name: /Mô phỏng giao dịch thất bại/ });
  await fail.check();
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Bạn có thể thử lại');
  const failedOrder = await page.getByRole('link', { name: 'xem đơn hiện tại' }).getAttribute('href');
  await expect(page.locator('.summary-total strong')).toContainText(total);
  await fail.uncheck();
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();
  expect(await expectConfirmationAndHistory(page, total)).toBe(failedOrder?.split('/').pop());
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible();
});

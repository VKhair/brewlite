import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('khách chọn món, đăng nhập và nhận mã đơn sau thanh toán mock', async ({ page, request }) => {
  const email = `checkout-${randomUUID()}@example.test`;
  const password = randomUUID() + 'Aa1';
  const signup = await request.post('/api/backend/auth/register', {
    data: { email, password, fullName: 'Khách kiểm thử' },
  });
  expect(signup.status()).toBe(201);

  await page.goto('/menu');
  await page.getByRole('link', { name: /Trà đào/ }).click();
  await page.getByRole('button', { name: /^L/ }).click();
  await page.getByText('Đào miếng', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Đào miếng/ })).toBeChecked();
  await page.getByRole('button', { name: /Thêm vào giỏ/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText('Size L · Đào miếng')).toBeVisible();
  await page.getByRole('link', { name: /Tiến hành thanh toán/ }).click();

  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Đăng nhập/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole('radio', { name: /Thẻ ngân hàng/ }).check();
  const paymentResponse = page.waitForResponse(response =>
    response.url().endsWith('/api/backend/payments') && response.request().method() === 'POST');
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();
  const payment = await paymentResponse;
  expect(payment.ok()).toBeTruthy();
  const receipt = await payment.json();
  expect(receipt.paymentStatus).toBe('SUCCESS');
  expect(receipt.orderCode).toMatch(/^BL-[A-F0-9]+$/);
  await expect(page).toHaveURL(new RegExp('/success/' + receipt.orderId + '$'));
  await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();
  await expect(page.getByText('#' + receipt.orderCode.slice(-8), { exact: true })).toBeVisible();
});

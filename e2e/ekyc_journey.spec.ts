import { test, expect } from '@playwright/test';

test.describe('Aadhaar e-KYC Integration Flow', () => {
  test('should successfully complete business registration with e-KYC validation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Click "Register Business" on the hero page to enter the registration flow
    await page.getByRole('button', { name: /Register Business/i }).click();

    // Verify we are on the registration page
    await expect(page.getByText('Official Enterprise Registration')).toBeVisible();

    // Click the Demo Data button to autofill the form
    await page.getByRole('button', { name: /Demo Data/i }).click();

    // The Aadhaar field should now be present but might be empty in the demo data, 
    // so we need to fill it explicitly to trigger the e-KYC requirement
    const aadhaarInput = page.getByPlaceholder('e.g., 123456789012');
    await expect(aadhaarInput).toBeVisible();
    await aadhaarInput.fill('123456789012');

    // Agree to terms and conditions
    const termsCheckbox = page.locator('input[id="terms"]');
    await termsCheckbox.check();

    // Click "Proceed to Payment" which intercepts with the e-KYC Gateway
    await page.getByRole('button', { name: /Proceed to Payment/i }).click();

    // Verify that the e-Pramaan Modal appears
    const modalHeading = page.getByText('e-Pramaan Verification');
    await expect(modalHeading).toBeVisible();

    // Fill the OTP input
    const otpInput = page.getByPlaceholder('Enter 6-digit OTP (Try: 123456)');
    await expect(otpInput).toBeVisible();
    await otpInput.fill('123456');

    // Click Verify
    await page.getByRole('button', { name: /Verify Identity/i }).click();

    // The modal should disappear and transition to the final success screen (or block ledger addition)
    // We expect the success message
    await expect(page.getByText('Registration successful - Block added to ledger')).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid e-KYC OTP', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Register Business/i }).click();
    await page.getByRole('button', { name: /Demo Data/i }).click();

    await page.getByPlaceholder('e.g., 123456789012').fill('123456789012');
    await page.locator('input[id="terms"]').check();
    await page.getByRole('button', { name: /Proceed to Payment/i }).click();

    // Fill the OTP input with INVALID data
    await page.getByPlaceholder('Enter 6-digit OTP (Try: 123456)').fill('999999');
    await page.getByRole('button', { name: /Verify Identity/i }).click();

    // Should show error toast
    await expect(page.getByText('Invalid OTP')).toBeVisible({ timeout: 5000 });
    
    // Modal should remain open
    await expect(page.getByText('e-Pramaan Verification')).toBeVisible();
  });
});

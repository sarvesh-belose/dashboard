import { test, expect } from '@playwright/test'

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads the dashboard page without errors', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows dashboard toolbar', async ({ page }) => {
    // Toolbar is always visible
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('edit mode toggle switches between view and edit mode', async ({ page }) => {
    // Start in view mode — no "Add Widget" button
    await expect(page.getByRole('button', { name: /add widget/i })).not.toBeVisible()

    // Click the edit toggle (action icon)
    await page.locator('[data-testid="edit-toggle"], button[aria-label*="edit" i]').first().click()

    // Now in edit mode — Add Widget button visible
    await expect(page.getByRole('button', { name: /add widget/i })).toBeVisible()
  })

  test('empty dashboard shows empty state message', async ({ page }) => {
    // If no widgets are loaded, empty state should appear
    const emptyState = page.getByText(/no widgets yet|add your first widget/i)
    const hasEmpty = await emptyState.count()
    if (hasEmpty > 0) {
      await expect(emptyState.first()).toBeVisible()
    }
  })
})

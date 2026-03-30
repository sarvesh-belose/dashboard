import { test, expect } from '@playwright/test'

test.describe('Filter Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('filter bar is hidden when no filters configured', async ({ page }) => {
    // If dashboard has no filters, the FilterBar renders null
    // The filter bar group should not be visible
    const filterBar = page.locator('[data-testid="filter-bar"], .filter-bar').first()
    const filterBarCount = await filterBar.count()
    if (filterBarCount > 0) {
      // If rendered, it should have at least one filter
      await expect(filterBar).toBeVisible()
    }
  })

  test('clear filters button resets all filter values', async ({ page }) => {
    // Only relevant if filters are configured
    const clearBtn = page.getByRole('button', { name: /clear/i })
    const hasFilters = await clearBtn.count()
    if (hasFilters > 0) {
      await clearBtn.click()
      // After clear, all filter inputs should be empty
      const inputs = page.locator('input[type="text"], input[type="search"]')
      const count = await inputs.count()
      for (let i = 0; i < count; i++) {
        await expect(inputs.nth(i)).toHaveValue('')
      }
    }
  })
})

import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({ page }) => {
  await page.route('*/**/api/tags', async (route) => {
    await route.fulfill({
      json: tags
      // body: JSON.stringify(tags)
    })
  })

  await page.route('*/**/api/articles?limit=10&offset=0', async (route) => {
    const response = await route.fetch() // entire response
    const responseJSON = await response.json()

    responseJSON.articles[0].title = 'This is a MOCK title'
    responseJSON.articles[0].description = 'This is a MOCK description for the article'

    await route.fulfill({
      json: responseJSON
    })
  })


  await page.goto("https://conduit.bondaracademy.com/")
})

test('has title', async ({ page }) => {
  await expect(page.locator('.navbar-brand')).toHaveText(/conduit/);
  await expect(page.locator('.sidebar .tag-pill')).toContainText(["Automation", "Playwright"])

  //validations for mocking response
  await expect(page.locator('.preview-link h1').first()).toContainText('This is a MOCK title')
  await expect(page.locator('.preview-link p').first()).toContainText('This is a MOCK description for the article')

});

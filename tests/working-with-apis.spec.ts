import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'

test('has title', async ({ page }) => {
  //Moving the beforeEach here for adding other tests
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
  //////////////////////////////////////

  await expect(page.locator('.navbar-brand')).toHaveText(/conduit/);
  await expect(page.locator('.sidebar .tag-pill')).toContainText(["Automation", "Playwright"])

  //validations for mocking response
  await expect(page.locator('.preview-link h1').first()).toContainText('This is a MOCK title')
  await expect(page.locator('.preview-link p').first()).toContainText('This is a MOCK description for the article')

});

test('Create Article', async ({ page, request }) => {
  await page.goto('https://conduit.bondaracademy.com/')

  //Sign in

  // Create new article
  await page.getByText('New Article').click()
  await page.getByRole('textbox', { name: 'Article Title' }).fill('Playwright is awesome')
  await page.getByRole('textbox', { name: 'What\'s this article about?' }).fill('We can use APIs in Playwright')
  await page.getByRole('textbox', { name: 'Write your article (in markdown)' }).fill('Automate any web application in Playwright')
  await page.getByRole('button', { name: 'Publish Article' }).click()

  // Get the slug ID
  const createArticleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
  const articleResponseJSON = await createArticleResponse.json()
  const slugID = articleResponseJSON.article.slug

  //Assertions
  await expect(page.locator('.article-page h1')).toContainText('Playwright is awesome')
  await page.getByText('Home').first().click()
  await expect(page.locator('.article-preview h1').first()).toContainText('Playwright is awesome')

  // Get token from login response
  const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {
        "email": "apiuserabc@test.com",
        "password": "Password"
      }
    }
  })

  // validate the status code before moving further
  expect(loginResponse.status()).toEqual(200)

  //extract token value from response
  const responseLoginJSON = await loginResponse.json()
  const token = responseLoginJSON.user.token

  //Delete API
  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugID}`, {
    headers: {
      Authorization: `Token ${token}`
    }
  })

  expect(deleteArticleResponse.status()).toEqual(204)
})

test('Delete article', async ({ page, request }) => {
  const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {
        "email": "apiuserabc@test.com",
        "password": "Password"
      }
    }
  })

  // validate the status code before moving further
  expect(loginResponse.status()).toEqual(200)

  //extract token value from response
  const responseLoginJSON = await loginResponse.json()
  const token = responseLoginJSON.user.token

  // article creation
  const newArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article": {
        "title": "Test Article",
        "description": "Test description",
        "body": "This is the body",
        "tagList": [
          "test tag"
        ]
      }
    },
    headers: {
      Authorization: `Token ${token}`
    }
  })

  //validate the status code before moving further
  expect(newArticleResponse.status()).toEqual(201)
  await page.goto("https://conduit.bondaracademy.com/")

  //Sign in
  // await page.getByText('Sign in').click()
  // await page.getByPlaceholder('Email').fill('apiuserabc@test.com')
  // await page.getByPlaceholder('Password').fill('Password')
  // await page.getByRole('button', { name: ' Sign in ' }).click()


  await expect(page.locator('.preview-link h1').first()).toContainText('Test Article')
  await page.getByText('Test Article').click()

  //delete through UI
  await page.getByRole('button', { name: 'Delete Article' }).first().click()

  //Negative assertion - first article should NOT  be Test123
  await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0')
  await expect(page.locator('.preview-link h1').first()).not.toContainText('Test Article')


  //Deleting through API

  /**
  *
  // extract slug from response
  const responseCreateNewArticleJSON = await newArticleResponse.json()
  const slug = responseCreateNewArticleJSON.article.slug

  // delete article
  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slug}`)
  expect(deleteArticleResponse.status()).toEqual(204)
     * 
   */
})
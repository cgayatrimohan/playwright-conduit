import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs'

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, request }) => {
    // If the user.json already exists then use API to get the new token and update the user.json
    if (fs.existsSync(authFile)) {
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

        //update token inside user.json
        const storageStateFile = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
        storageStateFile.origins[0].localStorage[0].value = token
        fs.writeFileSync(authFile, JSON.stringify(storageStateFile, null, 2))
    } else {
        // Perform authentication steps through UI as user.json doesn't exists
        await page.goto('https://conduit.bondaracademy.com/')
        await page.getByText('Sign in').click()
        await page.getByPlaceholder('Email').fill('apiuserabc@test.com')
        await page.getByPlaceholder('Password').fill('Password')
        await page.getByRole('button', { name: ' Sign in ' }).click()

        await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();

        // End of authentication steps.
        await page.context().storageState({ path: authFile });
    }

});
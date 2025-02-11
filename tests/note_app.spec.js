const { test, describe, expect, beforeEach } = require('@playwright/test')

describe('Note app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3001/api/testing/reset')
    await request.post('http://localhost:3001/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('front page can be opened', async ({ page }) => {
    const locator = await page.getByText('Notes')
    await expect(locator).toBeVisible()
    await expect(page.getByText('Note app, Department of Computer Science, University of Helsinki 2024')).toBeVisible()
  })

  test('login form can be opened', async ({ page }) => {
    await page.getByRole('button', { name: 'login' }).click()
    await page.getByTestId('username').fill('mluukkai')
    await page.getByTestId('password').fill('salainen')
    await page.getByRole('button', { name: 'login' }).click()
  
    await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'login' }).click()
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()
    })

    test('a new note can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Note' }).click()
      await page.getByRole('textbox').fill('a note created by playwright')
      await page.getByRole('button', { name: 'save' }).click()
      await expect(await page.getByText('a note created by playwright')).toBeVisible()
    })

    describe('and a note exists', () => {
      beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'Add Note' }).click()
        await page.getByRole('textbox').fill('another note by playwright')
        await page.getByRole('button', { name: 'save' }).click()
      })
  
      test('importance can be changed', async ({ page }) => {
        const note = page.locator('li.note', { hasText: 'another note by playwright' }).first()
        await expect(note).toBeVisible()

        // 🔍 Debugging: Log all buttons inside the note before clicking
        const buttonsBefore = await note.getByRole('button').allInnerTexts()
        console.log('All buttons before click:', buttonsBefore)

        // Get the button inside the note and wait for it to be visible
        const button = note.getByRole('button')
        await expect(button).toBeVisible()

        // Get the initial button text
        const buttonBefore = await button.innerText()
        console.log('Before click:', buttonBefore)

        // Click the button
        await button.click({ force: true })
        console.log('✅ Button clicked!')
        console.log(await page.content())

        // ✅ Wait for the button text to change
        const newButtonText = buttonBefore === 'make important' ? 'make not important' : 'make important'
        await page.waitForSelector(`button:text("${newButtonText}")`, { timeout: 5000 })
        
        // 🔍 Debugging: Log all buttons after clicking
        const buttonsAfter = await note.getByRole('button').allInnerTexts()
        console.log('All buttons after click:', buttonsAfter)

        // Get the button text after clicking
        const buttonAfter = await button.innerText()
        console.log('After click:', buttonAfter)

        // Check if the text actually changed
        expect(buttonAfter).not.toBe(buttonBefore)
      })
    })
  })  
})
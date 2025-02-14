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

      // Debug: Wait a bit and log all notes
      await page.waitForTimeout(1000);
      const allNotes = await page.locator('li.note').allInnerTexts();
      console.log('All notes in DOM:', allNotes);

      // Use UI-based waiting instead of API response
      await expect(page.locator('li.note').last()).toHaveText('a note created by playwright', { timeout: 5000 })
    })

    describe('and a note exists', () => {
      beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'Add Note' }).click()
        await page.getByRole('textbox').fill('another note by playwright')
        await page.getByRole('button', { name: 'save' }).click()

        // Debug: Wait a bit and log all notes
        await page.waitForTimeout(1000);
        const allNotes = await page.locator('li.note').allInnerTexts();
        console.log('All notes in DOM:', allNotes);
      })
  
      test('importance can be changed', async ({ page }) => {
        const note = page.locator('li.note', { hasText: 'another note by playwright' }).first()
        
        // Debug: Log all notes before assertion
        const allNotes = await page.locator('li.note').allInnerTexts();
        console.log('All notes:', allNotes);
      
        await expect(note).toBeVisible()
      
        const buttonBefore = await note.getByRole('button').innerText()
        console.log('Before click:', buttonBefore)
      
        await note.getByRole('button').click({ force: true })
      
        await page.waitForResponse(response => 
            response.url().includes('/api/notes') && response.status() === 200
        )
      
        const updatedButton = note.getByRole('button')
      
        await expect(updatedButton).toHaveText(buttonBefore === 'make important' ? 'make not important' : 'make important')
      
        const buttonAfter = await updatedButton.innerText()
        console.log('After click:', buttonAfter)
      })
    })
  })  
})
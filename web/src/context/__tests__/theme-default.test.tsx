/*

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

*/
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { mapStatusDataToConfig } from '@/lib/status-query'

import { ThemeProvider, useTheme } from '../theme-provider'

function ThemeControls() {
  const theme = useTheme()
  return (
    <>
      <span>{theme.resolvedTheme}</span>
      <button type='button' onClick={() => theme.setTheme('light')}>
        Light
      </button>
      <button type='button' onClick={theme.resetTheme}>
        Reset
      </button>
    </>
  )
}
afterEach(() => {
  localStorage.removeItem('newapi:theme:v1:mode')
  document.documentElement.classList.remove('light', 'dark')
})
describe('Signal defaults', () => {
  it('starts dark, supports switching to light, and resets to the new default', async () => {
    localStorage.removeItem('newapi:theme:v1:mode')
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>
    )
    expect(screen.getByText('dark')).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Light' }))
    expect(document.documentElement).toHaveClass('light')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reset' }))
    expect(document.documentElement).toHaveClass('dark')
  })
  it('honors a previously saved light preference', () => {
    localStorage.setItem('newapi:theme:v1:mode', 'light')
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>
    )
    expect(screen.getByText('light')).toBeVisible()
  })
  it('uses the SVG default without replacing a configured site logo', () => {
    expect(mapStatusDataToConfig({ logo: '' }).logo).toBe('/logo.svg')
    expect(
      mapStatusDataToConfig({ logo: 'https://example.test/custom.png' }).logo
    ).toBe('https://example.test/custom.png')
  })
})

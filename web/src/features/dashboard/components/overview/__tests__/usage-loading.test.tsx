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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { UsageOverview } from '../usage-overview'

const clients: QueryClient[] = []
beforeEach(() => {
  useAuthStore
    .getState()
    .auth.setUser({ id: 7, username: 'viewer', role: 1, quota: 500000 })
})
afterEach(() => {
  clients.forEach((client) => client.clear())
  clients.length = 0
  useAuthStore.getState().auth.reset()
  vi.restoreAllMocks()
})
function renderOverview() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  const root = createRootRoute({ component: UsageOverview })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('account overview loading', () => {
  it('keeps the refresh control disabled and shows loading indicators until usage arrives', async () => {
    let finish = () => {}
    const pending = new Promise<{ data: { success: boolean; data: [] } }>(
      (resolve) => {
        finish = () => resolve({ data: { success: true, data: [] } })
      }
    )
    vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/api/data/self') return pending
      return Promise.resolve({ data: { success: true, data: { items: [] } } })
    })
    renderOverview()
    expect(
      await screen.findByRole('button', { name: 'Refresh' })
    ).toBeDisabled()
    expect(screen.getAllByLabelText('Loading').length).toBeGreaterThan(0)
    await act(async () => finish())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
    )
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })
  it('fetches only self-scoped data and shows the returned model and log values', async () => {
    const now = Math.floor(Date.now() / 1000)
    const get = vi.spyOn(api, 'get').mockImplementation(async (url) => {
      if (url === '/api/data/self') {
        return {
          data: {
            success: true,
            data: [
              {
                created_at: now,
                model_name: 'qwen-live',
                count: 12,
                token_used: 888,
                quota: 500,
              },
            ],
          },
        }
      }
      return {
        data: {
          success: true,
          data: {
            items: [
              {
                id: 1,
                user_id: 7,
                created_at: now,
                type: 2,
                content: '',
                model_name: 'qwen-live',
                token_name: 'production-key',
                prompt_tokens: 123,
                completion_tokens: 456,
                quota: 500,
              },
            ],
          },
        },
      }
    })
    renderOverview()
    expect(await screen.findByText('production-key')).toBeVisible()
    expect(screen.getByText('579')).toBeVisible()
    expect(screen.getByText('888')).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Recent requests' })
    ).toHaveAttribute('tabindex', '0')
    expect(
      get.mock.calls.every(
        ([url]) =>
          url.startsWith('/api/data/self') || url.startsWith('/api/log/self?')
      )
    ).toBe(true)
    expect(screen.queryByText('24,892')).not.toBeInTheDocument()
  })
  it('shows a failed response as an error and retries without fabricating zero usage', async () => {
    let fail = true
    vi.spyOn(api, 'get').mockImplementation(async (url) => {
      if (url === '/api/data/self') {
        return { data: { success: !fail, data: [] } }
      }
      return { data: { success: true, data: { items: [] } } }
    })
    renderOverview()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to load usage')
    expect(screen.getAllByText('—')).toHaveLength(3)
    fail = false
    await userEvent
      .setup()
      .click(within(alert).getByRole('button', { name: 'Retry' }))
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    )
    expect(screen.getAllByText('No usage yet')).toHaveLength(3)
  })
  it('shows the log error independently when usage succeeds', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (url) => ({
      data:
        url === '/api/data/self'
          ? { success: true, data: [] }
          : { success: false, message: 'unavailable' },
    }))
    renderOverview()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load requests'
    )
    expect(screen.getAllByText('No usage yet')).toHaveLength(2)
  })
})

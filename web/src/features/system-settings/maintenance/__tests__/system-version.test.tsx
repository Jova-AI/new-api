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
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { UpdateCheckerSection } from '../update-checker-section'

const clients: QueryClient[] = []
afterEach(() => {
  cleanup()
  clients.forEach((client) => client.clear())
  clients.length = 0
  vi.restoreAllMocks()
})

it('shows the maintenance version from the protected endpoint', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      success: true,
      data: { version: 'v-maintenance-test', start_time: 0 },
    },
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  clients.push(client)
  render(
    <QueryClientProvider client={client}>
      <UpdateCheckerSection />
    </QueryClientProvider>
  )
  expect(await screen.findByText('v-maintenance-test')).toBeInTheDocument()
  expect(get).toHaveBeenCalledWith('/api/system-info/version')
})

it('rejects unsuccessful responses even when they include a version', async () => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: false, data: { version: 'v-denied', start_time: 0 } },
  })
  const { getSystemVersion } = await import('../../api')
  await expect(getSystemVersion()).rejects.toThrow()
})

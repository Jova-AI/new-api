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
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import { useSystemConfigStore } from '@/stores/system-config-store'

import { Hero } from '../components/sections/hero'
import { Stats } from '../components/sections/stats'

const storage = vi.hoisted(() => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
    clear: () => values.clear(),
  }
  vi.stubGlobal('localStorage', storage)
  return storage
})
afterAll(() => vi.unstubAllGlobals())
const clients: QueryClient[] = []
afterEach(() => {
  clients.forEach((client) => client.clear())
  clients.length = 0
  storage.clear()
})

function renderHome(isAuthenticated: boolean, docsLink?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  clients.push(client)
  client.setQueryData(['status'], { docs_link: docsLink })
  useSystemConfigStore
    .getState()
    .setConfig({ systemName: 'Token Center', logo: '/logo.svg' })
  const root = createRootRoute({ component: Outlet })
  const home = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => (
      <>
        <Hero isAuthenticated={isAuthenticated} />
        <Stats />
      </>
    ),
  })
  const signup = createRoute({
    getParentRoute: () => root,
    path: '/sign-up',
    component: () => <h1>Registration</h1>,
  })
  const dashboard = createRoute({
    getParentRoute: () => root,
    path: '/dashboard',
    component: () => <h1>Account overview</h1>,
  })
  const router = createRouter({
    routeTree: root.addChildren([home, signup, dashboard]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('Signal home navigation', () => {
  it('shows the updated model lineup and routes visitors to registration', async () => {
    renderHome(false)
    const user = userEvent.setup()
    const start = await screen.findByRole('button', { name: 'Get Started' })
    expect(screen.getAllByText('DeepSeek')).toHaveLength(2)
    expect(screen.getAllByText('Qwen')).toHaveLength(2)
    for (const model of ['GLM', 'Claude', 'GPT', 'Gemini']) {
      expect(screen.getAllByText(model)).toHaveLength(2)
    }
    for (const removed of [
      'Doubao',
      'ONE API.',
      'Open Source',
      'Self-hosted',
      'Built for builders',
    ]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument()
    }
    expect(screen.getAllByText('One endpoint')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Docs' })).toHaveAttribute(
      'href',
      'https://docs.newapi.pro'
    )
    await user.click(start)
    expect(
      await screen.findByRole('heading', { name: 'Registration' })
    ).toBeVisible()
  })
  it('routes signed-in users to their dashboard and preserves a configured documentation link', async () => {
    renderHome(true, 'https://docs.example.test/guide')
    const user = userEvent.setup()
    const dashboard = await screen.findByRole('button', {
      name: 'Go to Dashboard',
    })
    expect(
      screen.queryByRole('button', { name: 'Get Started' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Docs' })).toHaveAttribute(
      'href',
      'https://docs.example.test/guide'
    )
    await user.click(dashboard)
    expect(
      await screen.findByRole('heading', { name: 'Account overview' })
    ).toBeVisible()
  })
})

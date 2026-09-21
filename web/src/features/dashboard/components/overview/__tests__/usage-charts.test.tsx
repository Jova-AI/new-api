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
import { describe, expect, it } from 'vitest'

import { summarizeOverviewUsage } from '../../../lib/overview-usage'
import { UsageCharts } from '../usage-charts'

describe('usage charts', () => {
  it('shows empty states without a fabricated trend or model distribution', () => {
    render(<UsageCharts usage={summarizeOverviewUsage([], 3600, 7199)} />)
    expect(screen.getAllByText('No usage yet')).toHaveLength(2)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('shows real model names and lets users open hourly values', async () => {
    const user = userEvent.setup()
    const name = 'custom-model-with-a-long-name-that-must-remain-readable'
    render(
      <UsageCharts
        usage={summarizeOverviewUsage(
          [
            { created_at: 3600, count: 8, model_name: name },
            { created_at: 7200, count: 2, model_name: 'glm-4.5' },
          ],
          3600,
          10799
        )}
      />
    )
    expect(screen.getAllByText(name)).toHaveLength(2)
    expect(screen.getByText('80.0%')).toBeVisible()
    const summary = screen.getByText('View hourly data')
    await user.click(summary)
    expect(summary.closest('details')).toHaveAttribute('open')
    expect(screen.getByText('8', { selector: 'dd' })).toBeVisible()
  })
  it('groups models beyond the first four without losing their request share', () => {
    render(
      <UsageCharts
        usage={summarizeOverviewUsage(
          ['A', 'B', 'C', 'D', 'E', 'F'].map((model_name, index) => ({
            created_at: 3600,
            count: 6 - index,
            model_name,
          })),
          3600,
          7199
        )}
      />
    )
    expect(screen.getByText('Others')).toBeVisible()
    expect(screen.getByText('Others').closest('li')).toHaveTextContent('14.3%')
  })
})

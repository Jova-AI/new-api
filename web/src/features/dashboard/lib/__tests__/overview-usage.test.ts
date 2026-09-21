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
import { describe, expect, it } from 'vitest'

import { summarizeOverviewUsage } from '../overview-usage'

describe('overview usage', () => {
  it('groups requests by hour and model while excluding records outside the selected day', () => {
    const result = summarizeOverviewUsage(
      [
        {
          created_at: 3600,
          model_name: 'deepseek-chat',
          count: 2,
          token_used: 40,
          quota: 10,
        },
        {
          created_at: 3600,
          model_name: 'qwen3',
          count: 1,
          token_used: 20,
          quota: 5,
        },
        {
          created_at: 7200,
          model_name: 'deepseek-chat',
          count: 3,
          token_used: 60,
          quota: 15,
        },
        { created_at: 3599, count: 100 },
        { created_at: 10800, count: 100 },
      ],
      3600,
      10799
    )
    expect(result).toEqual({
      requests: 6,
      tokens: 120,
      quota: 30,
      hours: [
        { timestamp: 3600, requests: 3 },
        { timestamp: 7200, requests: 3 },
      ],
      models: [
        { name: 'deepseek-chat', count: 5 },
        { name: 'qwen3', count: 1 },
      ],
    })
  })
  it('returns zero activity without sample models when there are no records', () => {
    expect(summarizeOverviewUsage([], 3600, 3600)).toEqual({
      requests: 0,
      tokens: 0,
      quota: 0,
      hours: [{ timestamp: 3600, requests: 0 }],
      models: [],
    })
  })
  it('keeps unknown model activity and ignores non-finite or negative usage', () => {
    const result = summarizeOverviewUsage(
      [
        { created_at: 3600, count: 4 },
        {
          created_at: 3600,
          count: Number.NaN,
          quota: Infinity,
          token_used: -1,
        },
      ],
      3600,
      3600
    )
    expect(result.models).toEqual([{ name: '', count: 4 }])
    expect(result.tokens).toBe(0)
    expect(result.quota).toBe(0)
    expect(result.requests).toBe(4)
  })
})

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
import type { QuotaDataItem } from '../types'

/** Aggregate the selected account's hourly usage without inventing missing activity. */
export function summarizeOverviewUsage(
  data: QuotaDataItem[],
  start: number,
  end: number
) {
  const hours = Array.from(
    { length: Math.max(1, Math.ceil((end - start + 1) / 3600)) },
    (_, index) => ({ timestamp: start + index * 3600, requests: 0 })
  )
  const models = new Map<string, number>()
  let requests = 0
  let tokens = 0
  let quota = 0
  for (const item of data) {
    if (item.created_at < start || item.created_at > end) continue
    const count = Number.isFinite(item.count) ? Math.max(0, item.count ?? 0) : 0
    requests += count
    tokens += Number.isFinite(item.token_used)
      ? Math.max(0, item.token_used ?? 0)
      : 0
    quota += Number.isFinite(item.quota) ? Math.max(0, item.quota ?? 0) : 0
    const hour = hours[Math.floor((item.created_at - start) / 3600)]
    if (hour) hour.requests += count
    const model = item.model_name || ''
    if (count > 0) models.set(model, (models.get(model) ?? 0) + count)
  }
  const sortedModels = [...models]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  return { hours, models: sortedModels, requests, tokens, quota }
}

export type OverviewUsage = ReturnType<typeof summarizeOverviewUsage>

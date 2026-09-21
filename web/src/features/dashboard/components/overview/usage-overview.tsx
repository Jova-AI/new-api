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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from '@/lib/dayjs'
import { formatNumber, formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

import { getUserQuotaDates } from '../../api'
import { summarizeOverviewUsage } from '../../lib/overview-usage'
import { RecentRequests } from './recent-requests'
import { UsageCharts } from './usage-charts'

export function UsageOverview() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const [now, setNow] = useState(() => Date.now())
  const start = dayjs(now).startOf('day').unix()
  const end = Math.floor(now / 1000)
  const usage = useQuery({
    queryKey: ['dashboard', 'today-usage', user?.id, start, end],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const result = await getUserQuotaDates({
        start_timestamp: start,
        end_timestamp: end,
        default_time: 'hour',
      })
      if (!result.success) throw new Error('Failed to load usage')
      return result.data ?? []
    },
    staleTime: 60_000,
  })
  const summary = useMemo(
    () => summarizeOverviewUsage(usage.data ?? [], start, end),
    [usage.data, start, end]
  )
  const metrics = [
    {
      label: t('Request Count'),
      value: formatNumber(summary.requests),
      detail: t('Today'),
    },
    {
      label: t('Total Tokens'),
      value: formatNumber(summary.tokens),
      detail: t('Today'),
    },
    {
      label: t('Usage'),
      value: formatQuota(summary.quota),
      detail: t('Today'),
    },
    {
      label: t('Available balance'),
      value: formatQuota(user?.quota ?? 0),
      detail: t('Wallet'),
      to: '/wallet' as const,
    },
  ]
  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <div className='flex flex-wrap items-center justify-between gap-5 py-3'>
        <div>
          <p className='signal-eyebrow'>{t('Your workspace at a glance')}</p>
          <h1 className='mt-3 text-2xl font-semibold tracking-tight sm:text-3xl'>
            {t('Every request. In view.')}
            <span className='text-primary' aria-hidden='true'>
              {' '}
              /
            </span>
          </h1>
          <p className='text-muted-foreground mt-3 text-sm'>
            {t('Welcome back, {{name}}.', {
              name: user?.display_name || user?.username || '',
            })}
          </p>
        </div>
        <Button render={<Link to='/keys' />}>
          {t('Create API Key')}
          <ArrowUpRight aria-hidden='true' />
        </Button>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-3'>
        <nav
          aria-label={t('Dashboard')}
          className='flex flex-wrap items-center gap-5 text-xs'
        >
          <span className='text-primary font-medium' aria-current='page'>
            {t('Overview')}
          </span>
          <Link
            className='text-muted-foreground hover:text-primary'
            to='/dashboard/$section'
            params={{ section: 'models' }}
          >
            {t('Model analysis')}
          </Link>
          <Link
            className='text-muted-foreground hover:text-primary'
            to='/dashboard/$section'
            params={{ section: 'flow' }}
          >
            {t('Flow analysis')}
          </Link>
        </nav>
        <div className='text-muted-foreground flex items-center gap-3 text-xs'>
          <span>
            {dayjs(now).format('YYYY.MM.DD')} / {t('Today')}
          </span>
          <Button
            variant='ghost'
            size='icon'
            aria-label={t('Refresh')}
            disabled={usage.isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ['dashboard', 'recent-requests', user?.id],
              })
              const nextNow = Date.now()
              if (Math.floor(nextNow / 1000) === end) void usage.refetch()
              else setNow(nextNow)
            }}
          >
            <RefreshCw aria-hidden='true' />
          </Button>
        </div>
      </div>
      <dl className='signal-metrics'>
        {metrics.map((metric, index) => {
          let value: ReactNode = metric.value
          if (index < 3 && usage.isPending) {
            value = <Skeleton className='h-9 w-24' aria-label={t('Loading')} />
          } else if (index < 3 && usage.isError) value = '—'
          return (
            <div key={metric.label} className='min-w-0 p-4 sm:p-5'>
              <dt className='text-muted-foreground text-xs'>{metric.label}</dt>
              <dd className='mt-5 mb-3 text-2xl tracking-tight break-all tabular-nums sm:text-3xl'>
                {value}
              </dd>
              <dd className='text-muted-foreground text-xs'>
                {metric.to ? (
                  <Link className='hover:text-primary' to={metric.to}>
                    {metric.detail} ↗
                  </Link>
                ) : (
                  metric.detail
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      {usage.isError && (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-3 rounded-lg border p-5 text-sm'
        >
          <span>{t('Failed to load usage')}</span>
          <Button
            size='sm'
            variant='outline'
            disabled={usage.isFetching}
            onClick={() => void usage.refetch()}
          >
            {t('Retry')}
          </Button>
        </div>
      )}
      {usage.isPending && (
        <Skeleton className='h-80 w-full' aria-label={t('Loading')} />
      )}
      {usage.isSuccess && <UsageCharts usage={summary} />}
      <RecentRequests />
    </div>
  )
}

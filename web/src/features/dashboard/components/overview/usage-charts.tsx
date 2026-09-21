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
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dayjs from '@/lib/dayjs'
import { formatNumber } from '@/lib/format'

import type { OverviewUsage } from '../../lib/overview-usage'

const colors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function UsageCharts(props: { usage: OverviewUsage }) {
  const { t } = useTranslation()
  const gradientId = useId()
  const peak = Math.max(1, ...props.usage.hours.map((hour) => hour.requests))
  const points = props.usage.hours.map(
    (hour, index) =>
      `${40 + (index / Math.max(1, props.usage.hours.length - 1)) * 630},${180 - (hour.requests / peak) * 140}`
  )
  const leadingModels = props.usage.models.slice(0, 4).map((model) => ({
    ...model,
    id: `model:${model.name}`,
    name: model.name || t('Unknown model'),
  }))
  const remaining = props.usage.models
    .slice(4)
    .reduce((sum, model) => sum + model.count, 0)
  if (remaining > 0) {
    leadingModels.push({ id: 'others', name: t('Others'), count: remaining })
  }
  let offset = 0
  const gradient = leadingModels
    .map((model, index) => {
      const start = offset
      offset += (model.count / props.usage.requests) * 100
      return `${colors[index]} ${start}% ${offset}%`
    })
    .join(', ')
  return (
    <div className='grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]'>
      <Card>
        <CardHeader>
          <CardTitle>{t('Request trends')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-3xl tracking-tight tabular-nums'>
            {formatNumber(props.usage.requests)}{' '}
            <span className='text-muted-foreground text-xs'>
              {t('Requests')}
            </span>
          </p>
          {props.usage.requests === 0 ? (
            <p className='text-muted-foreground flex min-h-48 items-center justify-center text-sm'>
              {t('No usage yet')}
            </p>
          ) : (
            <>
              <svg
                className='text-primary w-full'
                viewBox='0 0 720 220'
                role='img'
                aria-label={t('Request trends')}
              >
                <defs>
                  <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                    <stop stopColor='currentColor' stopOpacity='.25' />
                    <stop offset='1' stopColor='currentColor' stopOpacity='0' />
                  </linearGradient>
                </defs>
                {[0, 0.5, 1].map((ratio) => (
                  <g key={ratio}>
                    <path
                      d={`M40 ${180 - ratio * 140}H680`}
                      stroke='var(--border)'
                      strokeDasharray='3 5'
                    />
                    <text
                      x='0'
                      y={184 - ratio * 140}
                      fill='var(--muted-foreground)'
                      fontSize='11'
                    >
                      {formatNumber(peak * ratio)}
                    </text>
                  </g>
                ))}
                <polygon
                  points={`40,180 ${points.join(' ')} ${points.at(-1)?.split(',')[0]},180`}
                  fill={`url(#${gradientId})`}
                />
                <polyline
                  points={points.join(' ')}
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinejoin='round'
                />
                {props.usage.hours.length === 1 && (
                  <circle
                    cx='40'
                    cy={180 - (props.usage.requests / peak) * 140}
                    r='4'
                    fill='currentColor'
                  />
                )}
                <text
                  x='40'
                  y='212'
                  fill='var(--muted-foreground)'
                  fontSize='11'
                >
                  {dayjs((props.usage.hours[0]?.timestamp ?? 0) * 1000).format(
                    'HH:mm'
                  )}
                </text>
                <text
                  x='670'
                  y='212'
                  textAnchor='end'
                  fill='var(--muted-foreground)'
                  fontSize='11'
                >
                  {dayjs(
                    (props.usage.hours.at(-1)?.timestamp ?? 0) * 1000
                  ).format('HH:mm')}
                </text>
              </svg>
              <details className='text-muted-foreground mt-3 text-xs'>
                <summary className='focus-visible:outline-ring cursor-pointer'>
                  {t('View hourly data')}
                </summary>
                <dl className='mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3'>
                  {props.usage.hours.map((hour) => (
                    <div
                      key={hour.timestamp}
                      className='flex justify-between gap-2'
                    >
                      <dt>{dayjs(hour.timestamp * 1000).format('HH:mm')}</dt>
                      <dd>{formatNumber(hour.requests)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('Model distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {props.usage.requests === 0 ? (
            <p className='text-muted-foreground flex min-h-48 items-center justify-center text-sm'>
              {t('No usage yet')}
            </p>
          ) : (
            <>
              <div className='mb-6 flex flex-wrap items-center justify-center gap-6'>
                <div
                  className='flex size-28 shrink-0 items-center justify-center rounded-full'
                  style={{ background: `conic-gradient(${gradient})` }}
                  aria-hidden='true'
                >
                  <div className='bg-card flex size-22 flex-col items-center justify-center rounded-full'>
                    <strong className='text-2xl font-medium'>
                      {props.usage.models.length}
                    </strong>
                    <span className='text-muted-foreground text-[10px]'>
                      {t('Models')}
                    </span>
                  </div>
                </div>
                <div className='max-w-40 min-w-0'>
                  <p className='text-muted-foreground text-xs'>
                    {t('Most used')}
                  </p>
                  <p className='mt-2 text-lg font-medium break-all'>
                    {leadingModels[0]?.name}
                  </p>
                </div>
              </div>
              <ul className='flex flex-col gap-4'>
                {leadingModels.map((model, index) => (
                  <li
                    key={model.id}
                    className='flex items-center justify-between gap-3 text-xs'
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <i
                        className='size-1.5 shrink-0 rounded-sm'
                        style={{ background: colors[index] }}
                        aria-hidden='true'
                      />
                      <span className='break-all'>{model.name}</span>
                    </span>
                    <span className='shrink-0 font-mono'>
                      {((model.count / props.usage.requests) * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

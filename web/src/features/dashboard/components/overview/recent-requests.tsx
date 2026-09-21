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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUserLogs } from '@/features/usage-logs/api'
import { LOG_TYPE_ENUM } from '@/features/usage-logs/constants'
import { usageLogSchema } from '@/features/usage-logs/data/schema'
import dayjs from '@/lib/dayjs'
import { formatNumber, formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

export function RecentRequests() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.auth.user?.id)
  const logs = useQuery({
    queryKey: ['dashboard', 'recent-requests', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const result = await getUserLogs({
        p: 1,
        page_size: 5,
        type: LOG_TYPE_ENUM.CONSUME,
      })
      if (!result.success) {
        throw new Error(result.message || 'Failed to load requests')
      }
      return usageLogSchema.array().parse(result.data?.items ?? [])
    },
    staleTime: 60_000,
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Recent requests')}</CardTitle>
        <CardAction>
          <Button variant='ghost' size='sm' render={<Link to='/usage-logs' />}>
            {t('Usage Logs')}
            <ArrowUpRight aria-hidden='true' />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {logs.isPending && (
          <Skeleton className='h-40 w-full' aria-label={t('Loading')} />
        )}
        {logs.isError && (
          <div
            role='alert'
            className='flex flex-wrap items-center gap-3 text-sm'
          >
            <span>{t('Failed to load requests')}</span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void logs.refetch()}
              disabled={logs.isFetching}
            >
              {t('Retry')}
            </Button>
          </div>
        )}
        {logs.isSuccess && logs.data.length === 0 && (
          <p className='text-muted-foreground py-10 text-center text-sm'>
            {t('No usage yet')}
          </p>
        )}
        {logs.isSuccess && logs.data.length > 0 && (
          <div
            tabIndex={0}
            role='region'
            aria-label={t('Recent requests')}
            className='focus-visible:outline-ring overflow-x-auto'
          >
            <Table className='min-w-[620px]'>
              <TableHeader>
                <TableRow>
                  {[
                    t('Time'),
                    t('Model'),
                    t('API Key'),
                    t('Tokens'),
                    t('Cost'),
                  ].map((label) => (
                    <TableHead key={label}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className='text-muted-foreground whitespace-nowrap'>
                      {dayjs(log.created_at * 1000).format('MM-DD HH:mm:ss')}
                    </TableCell>
                    <TableCell
                      className='max-w-64 truncate'
                      title={log.model_name}
                    >
                      {log.model_name || t('Unknown model')}
                    </TableCell>
                    <TableCell
                      className='max-w-48 truncate'
                      title={log.token_name}
                    >
                      {log.token_name || '—'}
                    </TableCell>
                    <TableCell>
                      {formatNumber(log.prompt_tokens + log.completion_tokens)}
                    </TableCell>
                    <TableCell>{formatQuota(log.quota)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

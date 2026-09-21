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
import { useTranslation } from 'react-i18next'

import { SystemUpdateAction } from '@/features/system-update/system-update-action'
import { useStatus } from '@/hooks/use-status'
import { formatTimestamp } from '@/lib/format'

import { getSystemVersion } from '../api'
import { SettingsSection } from '../components/settings-section'

export function UpdateCheckerSection(
  props: { currentVersion?: string | null; startTime?: number | null } = {}
) {
  const { data: systemVersion } = useQuery({
    queryKey: ['system-maintenance-version'],
    queryFn: getSystemVersion,
    gcTime: 0,
    enabled: props.currentVersion == null,
  })
  const { t } = useTranslation()
  const { status } = useStatus()
  const startTime = systemVersion?.start_time ?? props.startTime
  const uptime = startTime ? formatTimestamp(startTime) : t('Unknown')
  const version =
    systemVersion?.version ||
    props.currentVersion ||
    status?.version ||
    t('Unknown')

  return (
    <SettingsSection title={t('System maintenance')}>
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='rounded-lg border p-4'>
            <div className='text-muted-foreground text-sm'>
              {t('Current version')}
            </div>
            <div className='text-lg font-semibold break-all'>{version}</div>
          </div>
          <div className='rounded-lg border p-4'>
            <div className='text-muted-foreground text-sm'>
              {t('Uptime since')}
            </div>
            <div className='text-lg font-semibold'>{uptime}</div>
          </div>
        </div>
        <SystemUpdateAction compact={false} />
      </div>
    </SettingsSection>
  )
}

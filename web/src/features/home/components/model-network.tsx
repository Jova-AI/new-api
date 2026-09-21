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
import { useTranslation } from 'react-i18next'

import { useSystemConfig } from '@/hooks/use-system-config'

const networkLines = (
  <svg
    viewBox='0 0 600 540'
    fill='none'
    aria-hidden='true'
    className='signal-network-lines'
  >
    <g stroke='currentColor' strokeWidth='0.8' opacity='0.22'>
      {[208, 180, 120, 50].map((radius) => (
        <ellipse key={radius} cx='300' cy='266' rx={radius} ry='208' />
      ))}
      {[60, 130, 185].map((radius) => (
        <ellipse key={radius} cx='300' cy='266' rx='208' ry={radius} />
      ))}
    </g>
    <g stroke='currentColor' strokeWidth='1.6'>
      <path d='M115 171Q295 140 476 356M116 362Q245 116 464 150M299 58Q385 212 299 474' />
    </g>
    {[
      [115, 171],
      [476, 356],
      [116, 362],
      [464, 150],
      [299, 58],
      [299, 474],
    ].map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <circle cx={x} cy={y} r='5' fill='currentColor' />
        <circle cx={x} cy={y} r='12' stroke='currentColor' opacity='0.4' />
      </g>
    ))}
  </svg>
)

export function ModelNetwork() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  return (
    <div className='signal-network'>
      <div className='signal-network-caption'>
        <span>{t('Unified model network')}</span>
        <span aria-hidden='true'>↗</span>
      </div>
      {networkLines}
      <span className='signal-node signal-node-a'>
        DeepSeek <i />
      </span>
      <span className='signal-node signal-node-b'>
        Qwen <i />
      </span>
      <span className='signal-node signal-node-c'>
        GLM <i />
      </span>
      <span className='signal-node signal-node-d'>
        Claude <i />
      </span>
      <span className='signal-node signal-node-e'>
        GPT <i />
      </span>
      <span className='signal-node signal-node-f'>
        Gemini <i />
      </span>
      <div className='signal-network-core'>
        <strong>{t('One endpoint')}</strong>
        <b>{t('Infinite possibilities.')}</b>
        <span>{systemName}</span>
      </div>
      <div className='signal-network-caption'>
        <span>{t('One endpoint')}</span>
        <span>{t('Many possibilities')}</span>
      </div>
    </div>
  )
}

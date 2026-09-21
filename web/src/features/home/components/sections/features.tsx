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
import {
  ArrowUpRight,
  KeyRound,
  Network,
  ChartNoAxesCombined,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Features() {
  const { t } = useTranslation()
  const features = [
    {
      title: t('One integration, more possibilities'),
      description: t(
        'Connect different models through a unified API and expand what your app can do.'
      ),
      icon: Network,
      labels: ['DeepSeek', 'Qwen', 'GLM', 'Claude', 'GPT', 'Gemini'],
    },
    {
      title: t('Every request, under control'),
      description: t(
        'Manage key permissions, model groups, and channel routing in one workspace.'
      ),
      icon: KeyRound,
      labels: [t('API Keys'), t('Channels'), t('Model Groups')],
    },
    {
      title: t('Every token, clearly accounted for'),
      description: t(
        'Understand how your AI apps run, from request trends to detailed costs.'
      ),
      icon: ChartNoAxesCombined,
      labels: [t('Usage Logs'), t('Tokens'), t('Cost')],
    },
  ]
  return (
    <section id='capabilities' className='signal-capabilities'>
      <div className='mb-8 flex items-end justify-between gap-4'>
        <div>
          <p className='signal-eyebrow'>{t('Less friction. More creation.')}</p>
          <h2 className='mt-4 text-2xl font-semibold tracking-tight sm:text-3xl'>
            {t('Complex connections. Simple control.')}
          </h2>
        </div>
        <span
          aria-hidden='true'
          className='text-muted-foreground hidden font-mono text-xs sm:block'
        >
          [ 01 — 03 ]
        </span>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className='bg-card flex min-w-0 flex-col gap-6 rounded-lg border p-6'
          >
            <div className='text-primary flex items-center justify-between'>
              <span className='font-mono text-xs'>0{index + 1}</span>
              <ArrowUpRight className='size-4' aria-hidden='true' />
            </div>
            <div>
              <h3 className='text-lg font-semibold'>{feature.title}</h3>
              <p className='text-muted-foreground mt-3 text-sm leading-7'>
                {feature.description}
              </p>
            </div>
            <div className='text-primary mt-auto flex items-center gap-4 border-t pt-5'>
              <feature.icon
                className='size-8 shrink-0'
                strokeWidth={1.25}
                aria-hidden='true'
              />
              <div className='text-muted-foreground flex flex-wrap gap-x-3 gap-y-2 text-xs'>
                {feature.labels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

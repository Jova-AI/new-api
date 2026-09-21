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
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { cn } from '@/lib/utils'

import { ModelNetwork } from '../model-network'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    typeof status?.docs_link === 'string' && status.docs_link
      ? status.docs_link
      : 'https://docs.newapi.pro'
  return (
    <section className={cn('signal-hero', props.className)}>
      <div className='min-w-0'>
        <p className='signal-eyebrow'>
          <span className='bg-primary size-1.5 rounded-full' />
          {t('Connect AI to your next idea.')}
        </p>
        <h1>
          {t('Connect models.')}
          <br />
          <span className='text-primary'>{t('Unleash creativity.')}</span>
        </h1>
        <p className='text-muted-foreground max-w-lg text-sm leading-8'>
          {t(
            'One gateway for AI. Connect, route, and track usage in one workspace.'
          )}
        </p>
        <div className='mt-8 flex flex-wrap items-center gap-4'>
          <Button
            size='lg'
            render={
              <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
            }
          >
            {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
            <ArrowUpRight aria-hidden='true' />
          </Button>
          <Button
            variant='ghost'
            render={
              docsUrl.startsWith('http') ? (
                <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
              ) : (
                <Link to={docsUrl} />
              )
            }
          >
            {t('Docs')}
            <ArrowUpRight aria-hidden='true' />
          </Button>
          {!props.isAuthenticated && (
            <Link
              to='/pricing'
              className='text-muted-foreground hover:text-primary text-xs'
            >
              {t('View Pricing')}
            </Link>
          )}
        </div>
      </div>
      <ModelNetwork />
    </section>
  )
}

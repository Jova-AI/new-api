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

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}
export function CTA(props: CTAProps) {
  const { t } = useTranslation()
  return (
    <section className='signal-closing'>
      <h2 className='text-xl font-medium'>
        {t('Your next great idea starts here.')}
      </h2>
      <Button
        variant='ghost'
        render={<Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />}
      >
        {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
        <ArrowUpRight aria-hidden='true' />
      </Button>
    </section>
  )
}

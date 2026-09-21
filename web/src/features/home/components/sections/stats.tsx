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

export function Stats() {
  const { t } = useTranslation()
  return (
    <section className='signal-ecosystem' aria-label={t('Supported Models')}>
      <span className='signal-eyebrow'>{t('One gateway, many models')}</span>
      {['DeepSeek', 'Qwen', 'GLM', 'Claude', 'GPT', 'Gemini'].map((name) => (
        <strong key={name}>{name}</strong>
      ))}
      <span className='text-muted-foreground text-xs'>{t('And more')} ↗</span>
    </section>
  )
}

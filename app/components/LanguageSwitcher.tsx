'use client'

import { useRouter, usePathname } from 'next/navigation'
import { languages } from '@/app/i18n/settings'
import { useTranslation } from '@/app/i18n/client'

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { i18n } = useTranslation()

  const handleLanguageChange = (lng: string) => {
    // Change the language
    i18n.changeLanguage(lng)
    
    // Refresh the page to apply the new language
    router.refresh()
  }

  const languageNames: Record<string, string> = {
    en: 'English',
    pt: 'Português',
    es: 'Español'
  }

  return (
    <div className="relative">
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
      >
        {languages.map((lng) => (
          <option key={lng} value={lng} className="bg-gray-900">
            {languageNames[lng]}
          </option>
        ))}
      </select>
    </div>
  )
}
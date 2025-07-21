'use client'

import { useEffect, useState } from 'react'
import i18next, { i18n } from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import { useCookies } from 'react-cookie'
import resourcesToBackend from 'i18next-resources-to-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getOptions, languages, cookieName } from './settings'

const runsOnServerSide = typeof window === 'undefined'

// Initialize i18next
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ['cookie', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      lookupCookie: cookieName,
      cookieOptions: {
        sameSite: 'lax',
        path: '/',
      },
    },
    preload: runsOnServerSide ? languages : [],
    react: {
      useSuspense: false, // Disable suspense to prevent hydration issues
    },
  })

export function useTranslation(ns?: string, options?: any) {
  const [cookies, setCookie] = useCookies([cookieName])
  const ret = useTranslationOrg(ns, options)
  const { i18n } = ret
  const [isReady, setIsReady] = useState(false)

  // Sync language to cookie
  useEffect(() => {
    if (!runsOnServerSide && i18n.resolvedLanguage) {
      setCookie(cookieName, i18n.resolvedLanguage, { 
        path: '/',
        sameSite: 'lax',
      })
    }
  }, [i18n.resolvedLanguage, setCookie])

  // Mark as ready after initial render to avoid hydration mismatch
  useEffect(() => {
    setIsReady(true)
  }, [])

  return {
    ...ret,
    ready: isReady && ret.ready,
  }
}

export function useClientTranslation(ns?: string) {
  const { t, i18n } = useTranslation(ns)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return { t: isClient ? t : () => '', i18n }
}
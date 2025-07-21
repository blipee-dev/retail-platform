'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'
import { useTranslation } from '@/app/i18n/client'
import LanguageSwitcher from './LanguageSwitcher'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { profile, organization, signOut } = useAuth()
  const { t } = useTranslation('dashboard')

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: '🏠' },
    { name: t('navigation.stores'), href: '/dashboard/stores', icon: '🏪' },
    { name: t('navigation.analytics'), href: '/dashboard/analytics', icon: '📊' },
    { name: t('navigation.users'), href: '/dashboard/users', icon: '👥' },
    { name: t('navigation.settings'), href: '/dashboard/settings', icon: '⚙️' },
  ]

  // Filter navigation based on role
  const filteredNavigation = navigation.filter(item => {
    if (profile?.role === 'viewer') {
      return ['dashboard', 'analytics'].includes(item.href.split('/').pop() || '')
    }
    if (profile?.role === 'store_staff') {
      return ['dashboard', 'analytics'].includes(item.href.split('/').pop() || '')
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Link href="/dashboard" className="text-xl font-light text-white">
            blipee OS
          </Link>
        </div>

        {/* Organization Info */}
        <div className="px-6 py-4 border-b border-gray-800">
          <p className="text-sm text-gray-400">Organization</p>
          <p className="text-white font-medium">{organization?.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-gray-400">{t(`roles.${profile?.role}`)}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            {t('common.signOut')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between px-6 h-16">
            <h1 className="text-xl font-semibold text-white">
              {t(`roles.${profile?.role}`)} Dashboard
            </h1>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
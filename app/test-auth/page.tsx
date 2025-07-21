'use client'

import { useAuth } from '@/app/providers/auth-provider'
import { useState } from 'react'

export default function TestAuth() {
  const { user, profile, organization, signIn, signOut, loading } = useAuth()
  const [email, setEmail] = useState('admin@retailplatform.com')
  const [password, setPassword] = useState('admin123')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        console.error('Sign in error:', error)
        alert('Sign in failed: ' + error.message)
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800">✅ Authenticated</h2>
            <p className="text-green-700">User: {user.email}</p>
            <p className="text-green-700">ID: {user.id}</p>
          </div>

          {profile && (
            <div className="p-4 bg-blue-100 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">👤 Profile</h3>
              <p className="text-blue-700">Name: {profile.full_name}</p>
              <p className="text-blue-700">Role: {profile.role}</p>
              <p className="text-blue-700">Email: {profile.email}</p>
              <p className="text-blue-700">Active: {profile.is_active ? 'Yes' : 'No'}</p>
            </div>
          )}

          {organization && (
            <div className="p-4 bg-purple-100 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800">🏢 Organization</h3>
              <p className="text-purple-700">Name: {organization.name}</p>
              <p className="text-purple-700">Slug: {organization.slug}</p>
              <p className="text-purple-700">Tier: {organization.subscription_tier}</p>
              <p className="text-purple-700">Status: {organization.subscription_status}</p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-100 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800">🔐 Not Authenticated</h2>
            <p className="text-yellow-700">Please sign in to test authentication</p>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSigningIn ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useAuth } from '@/hooks/use-supabase-auth'
import { useEffect, useState } from 'react'

export default function AuthDebugMetas() {
  const { user, loading } = useAuth()
  const [goals, setGoals] = useState<any[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

  useEffect(() => {
    console.log('AuthDebugMetas - useAuth state:', { user, loading })
    
    if (user && !loading) {
      console.log('AuthDebugMetas - User found, fetching goals for user_id:', user.id)
      fetchGoals()
    }
  }, [user, loading])

  const fetchGoals = async () => {
    if (!user) return
    
    setApiLoading(true)
    setApiError(null)
    
    try {
      console.log('AuthDebugMetas - Making API call to /api/goals')
      const response = await fetch(`/api/goals?user_id=${user.id}`)
      console.log('AuthDebugMetas - API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      console.log('AuthDebugMetas - API response data:', data)
      
      setGoals(data.goals || [])
    } catch (error) {
      console.error('AuthDebugMetas - API error:', error)
      setApiError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="font-bold text-lg mb-2">🐛 Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'null'}
        </div>
        
        <div>
          <strong>API Loading:</strong> {apiLoading ? 'true' : 'false'}
        </div>
        
        {apiError && (
          <div className="text-red-600">
            <strong>API Error:</strong> {apiError}
          </div>
        )}
        
        <div>
          <strong>Goals Count:</strong> {goals.length}
        </div>
        
        {goals.length > 0 && (
          <div>
            <strong>Goals:</strong>
            <ul className="ml-4 list-disc">
              {goals.map((goal, index) => (
                <li key={index}>{goal.name || goal.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
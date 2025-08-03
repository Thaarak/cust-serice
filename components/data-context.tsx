"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Session {
  sessionId: string
  customerId: string
  createdAt: Date
  status: "open" | "resolved" | "escalated"
  escalationRecommended: boolean
  tags: string[]
  sentiment: "positive" | "neutral" | "frustrated"
  turns: Array<{ speaker: "user" | "agent"; text: string; timestamp: Date }>
  tools: Array<{ name: string; payload: object; timestamp: Date; success?: boolean }>
}

interface DataContextType {
  sessions: Session[]
  airtableConnected: boolean
  loading: boolean
  refreshData: () => Promise<void>
  isRefreshing: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [airtableConnected, setAirtableConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAirtableData = async (config: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/airtable/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          viewableLink: config.viewableLink
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Ensure all dates are proper Date objects on the client side
        const validatedSessions = (data.sessions || []).map((session: any) => {
          // Helper function to safely parse dates
          const parseDate = (dateValue: any): Date => {
            if (!dateValue) return new Date()
            if (dateValue instanceof Date) return dateValue
            
            // Try to parse string dates
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? new Date() : parsed
          }

          return {
            ...session,
            createdAt: parseDate(session.createdAt),
            turns: (session.turns || []).map((turn: any) => ({
              ...turn,
              timestamp: parseDate(turn.timestamp),
            })),
            tools: (session.tools || []).map((tool: any) => ({
              ...tool,
              timestamp: parseDate(tool.timestamp),
            })),
          }
        })
        
        setSessions(validatedSessions)
        return true
      } else {
        console.error('Failed to fetch Airtable data')
        setSessions([])
        return false
      }
    } catch (error) {
      console.error('Error fetching Airtable data:', error)
      setSessions([])
      return false
    } finally {
      setLoading(false)
    }
  }

  const checkAirtableConnection = async () => {
    const savedConfig = localStorage.getItem('airtable-config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        if (config.connected) {
          setAirtableConnected(true)
          await fetchAirtableData(config)
        } else {
          setAirtableConnected(false)
          setSessions([])
        }
      } catch (error) {
        console.error('Failed to load Airtable config:', error)
        setAirtableConnected(false)
        setSessions([])
      }
    } else {
      setAirtableConnected(false)
      setSessions([])
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await checkAirtableConnection()
    setIsRefreshing(false)
  }

  // Check for Airtable connection on mount
  useEffect(() => {
    checkAirtableConnection()

    // Listen for Airtable connection changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'airtable-config') {
        checkAirtableConnection()
      }
    }

    // Listen for custom refresh events
    const handleRefresh = () => {
      refreshData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('airtable-refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('airtable-refresh', handleRefresh)
    }
  }, [])

  const value: DataContextType = {
    sessions,
    airtableConnected,
    loading,
    refreshData,
    isRefreshing,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
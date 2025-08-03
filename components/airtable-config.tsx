"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Database, RefreshCw, CheckCircle, XCircle, ExternalLink, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AirtableConfig {
  viewableLink: string
  connected: boolean
}

interface TableInfo {
  name: string
  recordCount: number
  fields: string[]
}

export function AirtableConfig() {
  const [config, setConfig] = useState<AirtableConfig>({
    viewableLink: "",
    connected: false,
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const { toast } = useToast()

  // Load saved config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('airtable-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        if (parsed.connected) {
          fetchTableInfo(parsed)
        }
      } catch (error) {
        console.error('Failed to load saved config:', error)
      }
    }
  }, [])

  const saveConfig = (newConfig: AirtableConfig) => {
    localStorage.setItem('airtable-config', JSON.stringify(newConfig))
    setConfig(newConfig)
  }

  const testConnection = async () => {
    if (!config.viewableLink) {
      toast({
        title: "Missing information",
        description: "Please enter a valid Airtable shared view link.",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/airtable/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (response.ok) {
        const newConfig = { ...config, connected: true }
        saveConfig(newConfig)
        setTableInfo(result.tableInfo)
        setLastSync(new Date())
        
        toast({
          title: "Connection successful!",
          description: `Connected to view with ${result.tableInfo.recordCount} records.`,
        })
        
        // Trigger data refresh across the app
        window.dispatchEvent(new CustomEvent('airtable-refresh'))
      } else {
        throw new Error(result.error || 'Connection failed')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      
      let errorMessage = 'Please check your link and try again.'
      if (error instanceof Error) {
        if (error.message.includes('debug')) {
          // If we have debug info, show more details
          try {
            const errorData = JSON.parse(error.message)
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = error.message
          }
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const fetchTableInfo = async (configToUse = config) => {
    try {
      const response = await fetch('/api/airtable/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToUse),
      })

      if (response.ok) {
        const result = await response.json()
        setTableInfo(result.tableInfo)
        setLastSync(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch table info:', error)
    }
  }

  const disconnect = () => {
    const newConfig = { ...config, connected: false }
    saveConfig(newConfig)
    setTableInfo(null)
    setLastSync(null)
    
    toast({
      title: "Disconnected",
      description: "Airtable connection has been removed.",
    })
    
    // Trigger data refresh across the app
    window.dispatchEvent(new CustomEvent('airtable-refresh'))
  }

  const syncData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/airtable/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        await fetchTableInfo()
        toast({
          title: "Data synced",
          description: "Your dashboard has been updated with the latest data.",
        })
        
        // Trigger data refresh across the app
        window.dispatchEvent(new CustomEvent('airtable-refresh'))
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Could not sync data from Airtable.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Airtable Integration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Connect your call data from Airtable</p>
          </div>
          <div className="ml-auto">
            <Badge variant={config.connected ? "default" : "secondary"}>
              {config.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="viewable-link">Airtable Shared View Link</Label>
            <Input
              id="viewable-link"
              value={config.viewableLink}
              onChange={(e) => setConfig({ ...config, viewableLink: e.target.value })}
              placeholder="https://airtable.com/appXXXXXX/shrXXXXXX"
              disabled={config.connected}
            />
            <p className="text-xs text-slate-500 mt-1">
              Share your Airtable view and paste the link here. Make sure "Allow viewers to copy data" is enabled.
            </p>
          </div>

          <div className="flex gap-2">
            {!config.connected ? (
              <Button 
                onClick={testConnection} 
                disabled={testing || !config.viewableLink}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test & Connect
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={syncData} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Data
                    </>
                  )}
                </Button>
                <Button onClick={disconnect} variant="outline">
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Table Information */}
      {tableInfo && config.connected && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Table Information</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lastSync && `Last synced: ${lastSync.toLocaleTimeString()}`}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{tableInfo.recordCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Records</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{tableInfo.fields.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Fields Detected</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Available Fields</h5>
              <div className="flex flex-wrap gap-2">
                {tableInfo.fields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to share your Airtable view</h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>1. Open your Airtable base with customer session data</p>
              <p>2. Create or select a view with the data you want to display</p>
              <p>3. Click the "Share" button and choose "Create a shared view link"</p>
              <p>4. ⚠️ CRITICAL: In the sharing dialog, find "Allow viewers to copy data" and enable it</p>
              <p>5. This option allows CSV export - look for a checkbox or toggle</p>
              <p>6. Without this enabled, only demo data will be shown</p>
              <p>7. Copy the shared link and paste it above</p>
              <p>8. Click "Test & Connect"</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Warning */}
      {!config.connected && (
        <Card className="p-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Using demo data</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Share an Airtable view link to see real call data instead of demo sessions.
          </p>
        </Card>
      )}
    </div>
  )
}
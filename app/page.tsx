"use client"

import { useState } from "react"
import { SessionList } from "@/components/session-list"
import { SessionDetail } from "@/components/session-detail"
import { RightPanel } from "@/components/right-panel"
import { ChatPanel } from "@/components/chat-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { N8nIntegration } from "@/components/n8n-integration"
import { AirtableConfig } from "@/components/airtable-config"
import { DataProvider, useData } from "@/components/data-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Zap, Network, Database, RefreshCw } from "lucide-react"

// Session interface for TypeScript
interface Session {
  sessionId: string
  customerId: string
  createdAt: Date
  status: "open" | "resolved" | "escalated"
  escalationRecommended: boolean
  tags: string[]
  sentiment: "positive" | "neutral" | "frustrated"
  turns: Array<{ speaker: "user" | "agent"; text: string; timestamp: Date }>
  tools: Array<{ name: string; payload: object; timestamp: Date }>
}

function DashboardContent() {
  const { sessions, airtableConnected, loading, refreshData, isRefreshing } = useData()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const stats = {
    totalSessions: sessions.length,
    activeAgents: sessions.length > 0 ? new Set(sessions.map(s => s.customerId)).size : 0,
    avgResolutionTime: sessions.length > 0 ? "4.2m" : "0m",
    satisfactionRate: sessions.length > 0 ? Math.round((sessions.filter(s => s.sentiment === 'positive').length / sessions.length) * 100) : 0,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Clean Professional Header */}
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Claude Agent Hub</h1>
              <p className="text-slate-600 dark:text-slate-400">
                AI-Powered Customer Service Dashboard
                {airtableConnected && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                    Airtable Connected
                  </span>
                )}
                {(loading || isRefreshing) && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                    {isRefreshing ? 'Refreshing...' : 'Syncing...'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSessions}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Sessions</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.activeAgents}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.avgResolutionTime}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Avg Time</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.satisfactionRate}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {airtableConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={isRefreshing}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Database className="w-4 h-4" />
                  Connect Airtable
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Airtable Data Source</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                  <AirtableConfig />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Network className="w-4 h-4" />
                  n8n Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>n8n Integration Settings</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                  <N8nIntegration />
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-89px)]">
        {!airtableConnected ? (
          // Empty State - No Airtable Connected
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Connect Your Airtable
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                To view your customer service sessions and analyze call data, please connect your Airtable database using the button above.
              </p>
              <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <p>✓ Real-time session data</p>
                <p>✓ AI-powered analysis with Claude</p>
                <p>✓ Secure, private connection</p>
              </div>
            </div>
          </div>
        ) : sessions.length === 0 && loading ? (
          // Loading State
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your session data...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          // No Data State
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                No Sessions Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your Airtable is connected, but no session data was found. Make sure your table contains customer service session records.
              </p>
            </div>
          </div>
        ) : !selectedSession ? (
          // Main Dashboard View - Session List + Chat
          <>
            {/* Session List - Takes up 2/3 */}
            <div className="flex-1 border-r bg-white dark:bg-slate-900">
              <SessionList
                sessions={sessions}
                selectedSession={null}
                onSelectSession={setSelectedSession}
                isFullScreen={true}
              />
            </div>

            {/* Claude Chat - Takes up 1/3 */}
            <div className="w-96 bg-white dark:bg-slate-900">
              <ChatPanel sessions={sessions} isMainView={true} />
            </div>
          </>
        ) : (
          // Detailed View - Three Panel Layout 
          <>
            {/* Session Detail - Takes up main area */}
            <div className="flex-1 bg-white dark:bg-slate-900">
              <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
            </div>

            {/* Right Panel - Takes up smaller area */}
            <div className="w-80 border-l bg-white dark:bg-slate-900">
              <RightPanel session={selectedSession} />
            </div>

            {/* Claude Chat - Always visible */}
            <div className="w-96 border-l bg-white dark:bg-slate-900">
              <ChatPanel sessions={sessions} isMainView={false} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}

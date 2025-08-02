"use client"

import { useState } from "react"
import { SessionList } from "@/components/session-list"
import { SessionDetail } from "@/components/session-detail"
import { RightPanel } from "@/components/right-panel"
import { ChatPanel } from "@/components/chat-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Settings, Zap } from "lucide-react"

// Mock data for demonstration
const mockSessions = [
  {
    sessionId: "sess_001",
    customerId: "Maria Rodriguez",
    createdAt: new Date("2024-01-15T10:30:00Z"),
    status: "open" as const,
    escalationRecommended: false,
    tags: ["billing", "urgent"],
    sentiment: "frustrated" as const,
    turns: [
      {
        speaker: "user" as const,
        text: "I was charged twice for my subscription this month!",
        timestamp: new Date("2024-01-15T10:30:00Z"),
      },
      {
        speaker: "agent" as const,
        text: "I understand your frustration. Let me look into your billing history right away.",
        timestamp: new Date("2024-01-15T10:31:00Z"),
      },
      {
        speaker: "user" as const,
        text: "This is really inconvenient. I need this resolved quickly.",
        timestamp: new Date("2024-01-15T10:32:00Z"),
      },
      {
        speaker: "agent" as const,
        text: "I can see the duplicate charge. I'll process a refund immediately and add a credit to your account.",
        timestamp: new Date("2024-01-15T10:33:00Z"),
      },
    ],
    tools: [
      { name: "billing_lookup", payload: { customerId: "cust_12345" }, timestamp: new Date("2024-01-15T10:31:00Z") },
      {
        name: "process_refund",
        payload: { amount: 29.99, reason: "duplicate_charge" },
        timestamp: new Date("2024-01-15T10:33:00Z"),
      },
    ],
  },
  {
    sessionId: "sess_002",
    customerId: "John Smith",
    createdAt: new Date("2024-01-15T09:15:00Z"),
    status: "resolved" as const,
    escalationRecommended: false,
    tags: ["product_info", "sales"],
    sentiment: "positive" as const,
    turns: [
      {
        speaker: "user" as const,
        text: "Hi! I'm interested in upgrading to the premium plan. What features does it include?",
        timestamp: new Date("2024-01-15T09:15:00Z"),
      },
      {
        speaker: "agent" as const,
        text: "Great question! The premium plan includes advanced analytics, priority support, and unlimited integrations.",
        timestamp: new Date("2024-01-15T09:16:00Z"),
      },
      {
        speaker: "user" as const,
        text: "That sounds perfect! How do I upgrade?",
        timestamp: new Date("2024-01-15T09:17:00Z"),
      },
      {
        speaker: "agent" as const,
        text: "I can help you upgrade right now. I'll send you a secure link to complete the process.",
        timestamp: new Date("2024-01-15T09:18:00Z"),
      },
    ],
    tools: [
      { name: "get_plan_details", payload: { plan: "premium" }, timestamp: new Date("2024-01-15T09:16:00Z") },
      {
        name: "generate_upgrade_link",
        payload: { customerId: "cust_67890", targetPlan: "premium" },
        timestamp: new Date("2024-01-15T09:18:00Z"),
      },
    ],
  },
]

export default function Dashboard() {
  const [selectedSession, setSelectedSession] = useState<(typeof mockSessions)[0] | null>(null)
  const [sessions, setSessions] = useState(mockSessions)

  const stats = {
    totalSessions: 247,
    activeAgents: 12,
    avgResolutionTime: "4.2m",
    satisfactionRate: 94,
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
              <p className="text-slate-600 dark:text-slate-400">AI-Powered Customer Service Dashboard</p>
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
        {!selectedSession ? (
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
          // Detailed View - Two Panel Layout (No Left Panel)
          <>
            {/* Session Detail - Takes up 2/3 */}
            <div className="flex-1 bg-white dark:bg-slate-900">
              <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />
            </div>

            {/* Right Panel - Takes up 1/3 */}
            <div className="w-96 border-l bg-white dark:bg-slate-900">
              <RightPanel session={selectedSession} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

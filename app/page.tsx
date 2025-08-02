"use client"

import { useState } from "react"
import { SessionList } from "@/components/session-list"
import { SessionDetail } from "@/components/session-detail"
import { ToolTimeline } from "@/components/tool-timeline"
import { ActionBar } from "@/components/action-bar"
import { ClaudeSuggestions } from "@/components/claude-suggestions"
import { N8nIntegration } from "@/components/n8n-integration"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Settings, Zap } from "lucide-react"

// Mock data for demonstration
const mockSessions = [
  {
    sessionId: "sess_001",
    customerId: "cust_12345",
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
    customerId: "cust_67890",
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
  const [selectedSession, setSelectedSession] = useState(mockSessions[0])
  const [sessions, setSessions] = useState(mockSessions)
  const [showN8nSetup, setShowN8nSetup] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Claude Agent Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monitor your n8n customer service automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowN8nSetup(true)} className="gap-2">
              <Settings className="w-4 h-4" />
              n8n Setup
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Session List */}
        <div className="w-80 border-r bg-white dark:bg-slate-900 flex flex-col">
          <SessionList sessions={sessions} selectedSession={selectedSession} onSelectSession={setSelectedSession} />
        </div>

        {/* Middle Panel - Session Detail */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          <SessionDetail session={selectedSession} />
          <ClaudeSuggestions session={selectedSession} />
          <ActionBar session={selectedSession} />
        </div>

        {/* Right Panel - Tool Timeline */}
        <div className="w-80 border-l bg-slate-50 dark:bg-slate-800/50">
          <ToolTimeline session={selectedSession} />
        </div>
      </div>

      {/* n8n Integration Modal */}
      {showN8nSetup && <N8nIntegration onClose={() => setShowN8nSetup(false)} />}
    </div>
  )
}

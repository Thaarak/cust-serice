"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, Clock, CheckCircle, AlertTriangle, User } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

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

interface SessionListProps {
  sessions: Session[]
  selectedSession: Session | null
  onSelectSession: (session: Session) => void
  isFullScreen: boolean
}

export function SessionList({ sessions, selectedSession, onSelectSession, isFullScreen }: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊"
      case "neutral":
        return "😐"
      case "frustrated":
        return "😤"
      default:
        return "😐"
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20"
      case "frustrated":
        return "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20"
      default:
        return "text-slate-700 bg-slate-50 dark:text-slate-300 dark:bg-slate-800/50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/20"
      case "resolved":
        return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20"
      case "escalated":
        return "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20"
      default:
        return "text-slate-700 bg-slate-50 dark:text-slate-300 dark:bg-slate-800/50"
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Customer Sessions</h2>
            <p className="text-slate-600 dark:text-slate-400">Click on any session to view details</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredSessions.length} sessions
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All", icon: null },
            { key: "open", label: "Open", icon: <Clock className="w-4 h-4" /> },
            { key: "resolved", label: "Resolved", icon: <CheckCircle className="w-4 h-4" /> },
            { key: "escalated", label: "Escalated", icon: <AlertTriangle className="w-4 h-4" /> },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={statusFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.key)}
              className="gap-2"
            >
              {filter.icon}
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredSessions.map((session) => (
            <Card
              key={session.sessionId}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedSession?.sessionId === session.sessionId
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              )}
              onClick={() => onSelectSession(session)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{session.customerId}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {session.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSentimentEmoji(session.sentiment)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn("text-xs", getStatusColor(session.status))}>{session.status}</Badge>
                <Badge className={cn("text-xs", getSentimentColor(session.sentiment))}>{session.sentiment}</Badge>
                {session.escalationRecommended && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                    Escalation Recommended
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {session.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {session.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{session.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {session.turns[session.turns.length - 1]?.text}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Clock, AlertTriangle } from "lucide-react"
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
  selectedSession: Session
  onSelectSession: (session: Session) => void
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "escalated":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

export function SessionList({ sessions, selectedSession, onSelectSession }: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "resolved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("resolved")}
          >
            Resolved
          </Button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSessions.map((session) => (
          <Card
            key={session.sessionId}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md border-2",
              selectedSession.sessionId === session.sessionId
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-transparent hover:border-slate-200 dark:hover:border-slate-700",
            )}
            onClick={() => onSelectSession(session)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{session.customerId}</span>
                <span className="text-lg">{getSentimentEmoji(session.sentiment)}</span>
              </div>
              {session.escalationRecommended && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {session.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {session.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {session.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{session.tags.length - 2}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

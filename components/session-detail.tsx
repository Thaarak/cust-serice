"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, Clock, MessageSquare, ArrowLeft } from "lucide-react"
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

interface SessionDetailProps {
  session: Session
  onBack: () => void
}

export function SessionDetail({ session, onBack }: SessionDetailProps) {
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

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="p-6 border-b bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session with {session.customerId}</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Started {session.createdAt instanceof Date 
                  ? session.createdAt.toLocaleString() 
                  : new Date(session.createdAt || Date.now()).toLocaleString()
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("font-medium", getSentimentColor(session.sentiment))}>{session.sentiment}</Badge>
            <Badge
              variant={
                session.status === "resolved" ? "default" : session.status === "escalated" ? "destructive" : "secondary"
              }
            >
              {session.status}
            </Badge>
          </div>
        </div>

        {/* Session Meta */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{session.turns.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Messages</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{session.tools.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tools Used</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.floor((Date.now() - session.createdAt.getTime()) / 60000)}m
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Duration</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {session.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {session.turns.map((turn, index) => (
            <div key={index} className={cn("flex gap-4", turn.speaker === "agent" ? "flex-row" : "flex-row-reverse")}>
              <Avatar
                className={cn(
                  "w-10 h-10",
                  turn.speaker === "agent" ? "bg-slate-900 dark:bg-slate-100" : "bg-blue-600 dark:bg-blue-500",
                )}
              >
                <AvatarFallback className="text-white dark:text-slate-900">
                  {turn.speaker === "agent" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>

              <div className={cn("flex-1 max-w-[80%]", turn.speaker === "agent" ? "text-left" : "text-right")}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                    {turn.speaker === "agent" ? "Claude Agent" : session.customerId}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    {turn.timestamp instanceof Date 
                      ? turn.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : new Date(turn.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  </div>
                </div>

                <Card
                  className={cn(
                    "p-4 border-0",
                    turn.speaker === "agent"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100",
                  )}
                >
                  <p className="text-sm leading-relaxed">{turn.text}</p>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

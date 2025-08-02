"use client"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Bot, Clock } from "lucide-react"
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
}

export function SessionDetail({ session }: SessionDetailProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Session Header */}
      <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Session with {session.customerId}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {session.createdAt.toLocaleString()}
          </div>
        </div>

        {/* Summary Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Follow up required</Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Send coupon</Badge>
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Priority customer
          </Badge>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border">
          <strong>Claude Summary:</strong> Customer experienced a billing issue with duplicate charges. Issue was
          resolved with immediate refund and account credit. Customer satisfaction restored. Recommend following up in
          24 hours to ensure no further issues.
        </p>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {session.turns.map((turn, index) => (
            <div key={index} className={cn("flex gap-3", turn.speaker === "agent" ? "justify-start" : "justify-end")}>
              {turn.speaker === "agent" && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-lg",
                  turn.speaker === "agent"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    : "bg-blue-500 text-white ml-auto",
                )}
              >
                <p className="text-sm">{turn.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {turn.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {turn.speaker === "user" && (
                <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

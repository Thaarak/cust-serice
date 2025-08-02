"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react"
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

interface ToolTimelineProps {
  session: Session
}

export function ToolTimeline({ session }: ToolTimelineProps) {
  const [expandedTool, setExpandedTool] = useState<number | null>(null)

  const getToolIcon = (success: boolean) => {
    return success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const formatToolName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Tool Timeline</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{session.tools.length} tools executed</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {session.tools.map((tool, index) => {
            const isExpanded = expandedTool === index
            const isSuccess = Math.random() > 0.1 // Mock success rate

            return (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {getToolIcon(isSuccess)}
                    {index < session.tools.length - 1 && (
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mt-2" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {formatToolName(tool.name)}
                      </h4>
                      <button
                        onClick={() => setExpandedTool(isExpanded ? null : index)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={isSuccess ? "default" : "destructive"} className="text-xs">
                        {isSuccess ? "Success" : "Failed"}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {tool.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Payload:</h5>
                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                          {JSON.stringify(tool.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

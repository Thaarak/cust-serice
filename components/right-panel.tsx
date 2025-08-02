"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Gift,
  UserPlus,
  ExternalLink,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

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

interface RightPanelProps {
  session: Session
}

export function RightPanel({ session }: RightPanelProps) {
  const [expandedTool, setExpandedTool] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAction = async (action: string, endpoint: string) => {
    setLoading(action)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Action completed",
        description: `${action} has been triggered successfully.`,
      })
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getToolIcon = (success: boolean) => {
    return success ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const formatToolName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getSuggestions = () => {
    if (session.sentiment === "frustrated") {
      return {
        priority: "high",
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        title: "Customer Recovery Needed",
        insights: [
          "Customer expressed frustration about billing issues",
          "Quick resolution prevented escalation",
          "Follow-up recommended to ensure satisfaction",
        ],
        recommendations: [
          "Send a goodwill gesture (coupon/credit)",
          "Schedule follow-up call within 24 hours",
          "Monitor account for any additional issues",
        ],
      }
    } else if (session.sentiment === "positive") {
      return {
        priority: "medium",
        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        title: "Upsell Opportunity",
        insights: [
          "Customer showed interest in premium features",
          "Positive interaction throughout conversation",
          "High engagement with product information",
        ],
        recommendations: [
          "Send premium plan comparison guide",
          "Offer limited-time upgrade discount",
          "Schedule demo of advanced features",
        ],
      }
    } else {
      return {
        priority: "low",
        icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
        title: "Standard Follow-up",
        insights: [
          "Routine inquiry handled successfully",
          "Customer seemed satisfied with resolution",
          "No immediate concerns identified",
        ],
        recommendations: [
          "Send satisfaction survey",
          "Add to newsletter for product updates",
          "Monitor for future interactions",
        ],
      }
    }
  }

  const suggestions = getSuggestions()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Session Actions</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Tools, insights & quick actions</p>
      </div>

      <ScrollArea className="flex-1">
        {/* Tool Timeline */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Tool Timeline</h4>
            <Badge variant="secondary">{session.tools.length} executed</Badge>
          </div>

          <div className="space-y-3">
            {session.tools.map((tool, index) => {
              const isExpanded = expandedTool === index
              const isSuccess = Math.random() > 0.1

              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {getToolIcon(isSuccess)}
                      {index < session.tools.length - 1 && (
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm text-slate-900 dark:text-white">
                          {formatToolName(tool.name)}
                        </h5>
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
                          <h6 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Payload:</h6>
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
        </div>

        {/* Claude Insights */}
        <div className="p-6 border-b">
          <Card className="p-5 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              {suggestions.icon}
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white">Claude Insights</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{suggestions.title}</p>
              </div>
              <Badge
                variant={
                  suggestions.priority === "high"
                    ? "destructive"
                    : suggestions.priority === "medium"
                      ? "default"
                      : "secondary"
                }
              >
                {suggestions.priority}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Key Insights</h5>
                <ul className="space-y-2">
                  {suggestions.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Recommendations</h5>
                <ul className="space-y-2">
                  {suggestions.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Quick Actions</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{session.sessionId}</div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleAction("Send Coupon", "/webhook/coupon")}
              disabled={loading === "Send Coupon"}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Gift className="w-4 h-4" />
              {loading === "Send Coupon" ? "Sending..." : "Send Coupon"}
            </Button>

            <Button
              onClick={() => handleAction("Escalate to Human", "/action/escalate")}
              disabled={loading === "Escalate to Human"}
              variant="destructive"
              className="w-full gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading === "Escalate to Human" ? "Escalating..." : "Escalate to Human"}
            </Button>

            <Button
              onClick={() => handleAction("Follow Up Later", "/action/followup")}
              disabled={loading === "Follow Up Later"}
              variant="outline"
              className="w-full gap-2"
            >
              <Clock className="w-4 h-4" />
              {loading === "Follow Up Later" ? "Saving..." : "Follow Up Later"}
            </Button>

            <Button
              onClick={() => window.open(`/session/${session.sessionId}`, "_blank")}
              variant="outline"
              className="w-full gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Full View
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

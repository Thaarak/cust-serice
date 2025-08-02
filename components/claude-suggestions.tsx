"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react"

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

interface ClaudeSuggestionsProps {
  session: Session
}

export function ClaudeSuggestions({ session }: ClaudeSuggestionsProps) {
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
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
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
    <Card className="m-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 mb-3">
        {suggestions.icon}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Claude Insights</h3>
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
          className="ml-auto"
        >
          {suggestions.priority} priority
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {suggestions.insights.map((insight, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Recommended Actions</h4>
          <ul className="space-y-1">
            {suggestions.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

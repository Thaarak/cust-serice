"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Gift, UserPlus, Clock, ExternalLink } from "lucide-react"
import { useState } from "react"
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

interface ActionBarProps {
  session: Session
}

export function ActionBar({ session }: ActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAction = async (action: string, endpoint: string) => {
    setLoading(action)

    try {
      // Simulate API call
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

  return (
    <Card className="m-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
        <div className="text-xs text-slate-500 dark:text-slate-400">Session: {session.sessionId}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleAction("Send Coupon", "/webhook/coupon")}
          disabled={loading === "Send Coupon"}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Gift className="w-4 h-4" />
          {loading === "Send Coupon" ? "Sending..." : "Send Coupon"}
        </Button>

        <Button
          onClick={() => handleAction("Escalate to Human", "/action/escalate")}
          disabled={loading === "Escalate to Human"}
          variant="destructive"
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {loading === "Escalate to Human" ? "Escalating..." : "Escalate to Human"}
        </Button>

        <Button
          onClick={() => handleAction("Follow Up Later", "/action/followup")}
          disabled={loading === "Follow Up Later"}
          variant="outline"
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          {loading === "Follow Up Later" ? "Saving..." : "Follow Up Later"}
        </Button>

        <Button
          onClick={() => window.open(`/session/${session.sessionId}`, "_blank")}
          variant="outline"
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open Full View
        </Button>
      </div>
    </Card>
  )
}

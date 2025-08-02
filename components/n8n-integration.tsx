"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, ExternalLink, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface N8nIntegrationProps {
  onClose: () => void
}

export function N8nIntegration({ onClose }: N8nIntegrationProps) {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
    toast({
      title: "Copied to clipboard",
      description: `${type} has been copied to your clipboard.`,
    })
  }

  const webhookEndpoint = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/session`
  const samplePayload = `{
  "sessionId": "sess_{{$randomUUID}}",
  "customerId": "{{$customer_id}}",
  "createdAt": "{{$now}}",
  "status": "open",
  "escalationRecommended": false,
  "tags": ["{{$tags}}"],
  "sentiment": "{{$sentiment}}",
  "turns": [
    {
      "speaker": "user",
      "text": "{{$user_message}}",
      "timestamp": "{{$now}}"
    },
    {
      "speaker": "agent",
      "text": "{{$claude_response}}",
      "timestamp": "{{$now}}"
    }
  ],
  "tools": [
    {
      "name": "{{$tool_name}}",
      "payload": {{$tool_payload}},
      "timestamp": "{{$now}}"
    }
  ]
}`

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            n8n Integration Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Settings */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Connection Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Your n8n Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  This is where we'll send action triggers (coupons, escalations, etc.)
                </p>
              </div>
              <div>
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Your n8n API key for authentication"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Webhook Endpoint */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Dashboard Webhook Endpoint</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Configure your n8n workflow to POST session data to this endpoint:
            </p>
            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <code className="flex-1 text-sm font-mono">{webhookEndpoint}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookEndpoint, "Webhook URL")}>
                {copied === "Webhook URL" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </Card>

          {/* Sample Payload */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Sample JSON Payload</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Use this structure when sending session data from your n8n workflow:
            </p>
            <div className="relative">
              <Textarea value={samplePayload} readOnly className="font-mono text-xs h-64 resize-none" />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-transparent"
                onClick={() => copyToClipboard(samplePayload, "Sample payload")}
              >
                {copied === "Sample payload" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </Card>

          {/* Quick Setup Guide */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Quick Setup Guide</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Create HTTP Request Node</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Add an HTTP Request node in your n8n workflow and set the URL to our webhook endpoint above.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Configure Claude Integration</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Set up your Claude API calls and format the response according to our JSON structure.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Test the Connection</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Send a test payload to verify the integration is working correctly.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <a href="https://docs.n8n.io" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                n8n Documentation
              </a>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onClose}>Save Configuration</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Settings, Webhook, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface N8nWorkflow {
  id: string
  name: string
  active: boolean
  lastRun?: Date
  status: "success" | "error" | "running" | "idle"
  executions: number
}

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  active: boolean
  lastTriggered?: Date
}

export function N8nIntegration() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([])

  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])

  const [n8nUrl, setN8nUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  const handleConnect = async () => {
    setLoading(true)
    try {
      // Simulate API connection
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setConnected(true)
      toast({
        title: "Connected to n8n",
        description: "Successfully connected to your n8n instance.",
      })
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not connect to n8n. Please check your settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === workflowId ? { ...wf, active: !wf.active, status: !wf.active ? "idle" : "success" } : wf,
      ),
    )

    toast({
      title: "Workflow updated",
      description: "Workflow status has been changed.",
    })
  }

  const toggleWebhook = async (webhookId: string) => {
    setWebhooks((prev) => prev.map((wh) => (wh.id === webhookId ? { ...wh, active: !wh.active } : wh)))

    toast({
      title: "Webhook updated",
      description: "Webhook status has been changed.",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">n8n Integration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Connect your n8n workflows</p>
          </div>
          <div className="ml-auto">
            <Badge variant={connected ? "default" : "secondary"}>{connected ? "Connected" : "Disconnected"}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="n8n-url">n8n Instance URL</Label>
              <Input
                id="n8n-url"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com"
              />
            </div>
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your n8n API key"
              />
            </div>
          </div>

          <Button onClick={handleConnect} disabled={loading || !n8nUrl || !apiKey} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                {connected ? "Reconnect" : "Connect to n8n"}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Workflows */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-slate-900 dark:text-white">Active Workflows</h4>
          <Badge variant="secondary">{workflows.filter((wf) => wf.active).length} active</Badge>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(workflow.status)}
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{workflow.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {workflow.executions} executions
                      {workflow.lastRun && ` • Last run ${workflow.lastRun.toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={workflow.active}
                  onCheckedChange={() => toggleWorkflow(workflow.id)}
                  disabled={!connected}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Webhooks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-slate-900 dark:text-white">Webhook Endpoints</h4>
          <Badge variant="secondary">{webhooks.filter((wh) => wh.active).length} active</Badge>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Webhook className="w-4 h-4 text-slate-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{webhook.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {webhook.method}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {webhook.url}
                      {webhook.lastTriggered && ` • Last triggered ${webhook.lastTriggered.toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={webhook.active}
                  onCheckedChange={() => toggleWebhook(webhook.id)}
                  disabled={!connected}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Status Warning */}
      {!connected && (
        <Card className="p-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">n8n integration is not connected</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Connect to your n8n instance to enable workflow automation and webhook endpoints.
          </p>
        </Card>
      )}
    </div>
  )
}

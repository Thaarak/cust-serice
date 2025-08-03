"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Sparkles, MessageSquare } from "lucide-react"
import { useState, useRef, useEffect } from "react"
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

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface ChatPanelProps {
  sessions: Session[]
  isMainView?: boolean
}

export function ChatPanel({ sessions, isMainView = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi! I'm Claude, your AI assistant for analyzing customer service sessions. I can help you understand patterns, suggest improvements, and answer questions about your agents' performance. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "Analyze sentiment trends across all sessions",
        "What are the most common customer issues?",
        "How can we improve resolution times?",
        "Show me escalation patterns",
      ],
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessions: sessions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Claude')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.content,
        timestamp: new Date(),
        suggestions: data.suggestions,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling Claude API:', error)
      // Fallback to simulated response if API fails
      const response = generateClaudeResponse(input, sessions)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `⚠️ Unable to connect to Claude API. Using fallback analysis:\n\n${response.content}`,
        timestamp: new Date(),
        suggestions: response.suggestions,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const generateClaudeResponse = (query: string, sessions: Session[]) => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("sentiment") || lowerQuery.includes("emotion")) {
      const sentimentCounts = sessions.reduce(
        (acc, session) => {
          acc[session.sentiment] = (acc[session.sentiment] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        content: `📊 **Sentiment Analysis Across ${sessions.length} Sessions:**

• **Positive**: ${sentimentCounts.positive || 0} sessions (${Math.round(((sentimentCounts.positive || 0) / sessions.length) * 100)}%)
• **Neutral**: ${sentimentCounts.neutral || 0} sessions (${Math.round(((sentimentCounts.neutral || 0) / sessions.length) * 100)}%)
• **Frustrated**: ${sentimentCounts.frustrated || 0} sessions (${Math.round(((sentimentCounts.frustrated || 0) / sessions.length) * 100)}%)

**Key Insights:**
- ${sentimentCounts.frustrated > 0 ? `${sentimentCounts.frustrated} customers expressed frustration - consider proactive follow-up` : "No frustrated customers detected - great job!"}
- Most common sentiment: ${Object.entries(sentimentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral"}

**Recommendations:**
- Monitor frustrated customers for escalation patterns
- Analyze positive interactions to replicate success factors`,
        suggestions: [
          "What causes customer frustration?",
          "Show me resolution time patterns",
          "Analyze tool usage effectiveness",
        ],
      }
    }

    if (lowerQuery.includes("issue") || lowerQuery.includes("problem") || lowerQuery.includes("common")) {
      const allTags = sessions.flatMap((s) => s.tags)
      const tagCounts = allTags.reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

      return {
        content: `🔍 **Most Common Customer Issues:**

${topTags
  .map(
    ([tag, count], index) =>
      `${index + 1}. **${tag}** - ${count} sessions (${Math.round((count / sessions.length) * 100)}%)`,
  )
  .join("\n")}

**Analysis:**
- Top issue: "${topTags[0]?.[0]}" appears in ${Math.round(((topTags[0]?.[1] || 0) / sessions.length) * 100)}% of sessions
- Issue diversity: ${Object.keys(tagCounts).length} unique issue types identified

**Recommendations:**
- Create specialized workflows for "${topTags[0]?.[0]}" issues
- Develop FAQ resources for top 3 issues
- Consider proactive communication for recurring problems`,
        suggestions: [
          "How to reduce billing-related issues?",
          "What tools are most effective?",
          "Show escalation prevention strategies",
        ],
      }
    }

    if (lowerQuery.includes("resolution") || lowerQuery.includes("time") || lowerQuery.includes("speed")) {
      const avgTurns = sessions.reduce((sum, s) => sum + s.turns.length, 0) / sessions.length
      const avgTools = sessions.reduce((sum, s) => sum + s.tools.length, 0) / sessions.length

      return {
        content: `⏱️ **Resolution Time Analysis:**

**Current Metrics:**
• Average conversation length: ${avgTurns.toFixed(1)} messages
• Average tools used: ${avgTools.toFixed(1)} per session
• Estimated avg resolution time: ${(avgTurns * 1.5).toFixed(1)} minutes

**Performance Insights:**
- ${avgTurns < 6 ? "✅ Efficient conversations - good agent training" : "⚠️ Longer conversations may indicate complexity or training needs"}
- ${avgTools < 3 ? "✅ Streamlined tool usage" : "⚠️ High tool usage - consider workflow optimization"}

**Optimization Opportunities:**
- Implement quick-resolution templates for common issues
- Provide agents with better diagnostic tools
- Create escalation triggers for complex cases`,
        suggestions: [
          "Which tools slow down resolution?",
          "How to improve first-contact resolution?",
          "Analyze agent performance patterns",
        ],
      }
    }

    if (lowerQuery.includes("escalation") || lowerQuery.includes("escalate")) {
      const escalatedSessions = sessions.filter((s) => s.status === "escalated" || s.escalationRecommended)
      const escalationRate = (escalatedSessions.length / sessions.length) * 100

      return {
        content: `🚨 **Escalation Pattern Analysis:**

**Current Status:**
• Escalation rate: ${escalationRate.toFixed(1)}% (${escalatedSessions.length}/${sessions.length} sessions)
• Sessions flagged for escalation: ${sessions.filter((s) => s.escalationRecommended).length}
• Actually escalated: ${sessions.filter((s) => s.status === "escalated").length}

**Risk Factors:**
${
  escalatedSessions.length > 0
    ? escalatedSessions
        .map((s) => `• Customer ${s.customerId}: ${s.sentiment} sentiment, tags: ${s.tags.join(", ")}`)
        .join("\n")
    : "• No current escalations - excellent performance!"
}

**Prevention Strategies:**
- Early sentiment detection and intervention
- Proactive communication for billing/technical issues
- Agent coaching on de-escalation techniques`,
        suggestions: [
          "What triggers most escalations?",
          "How to prevent billing escalations?",
          "Show agent coaching opportunities",
        ],
      }
    }

    // Default response
    return {
      content: `🤖 I can help you analyze your customer service data in many ways! Here are some things I can do:

**📊 Analytics & Insights:**
- Sentiment analysis across sessions
- Common issue identification
- Resolution time optimization
- Escalation pattern analysis

**🎯 Performance Optimization:**
- Agent performance insights
- Tool usage effectiveness
- Workflow improvement suggestions
- Customer satisfaction trends

**💡 Strategic Recommendations:**
- Proactive customer outreach
- Training opportunities
- Process improvements
- Resource allocation

What specific aspect would you like me to analyze?`,
      suggestions: [
        "Analyze all session data",
        "Show me performance trends",
        "What are our biggest opportunities?",
        "Help me improve customer satisfaction",
      ],
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Claude Assistant</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered session analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {sessions.length} sessions analyzed
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 max-h-[calc(100vh-300px)] overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-4", message.type === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <Avatar
                className={cn(
                  "w-10 h-10",
                  message.type === "user" ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-900 dark:bg-slate-100",
                )}
              >
                <AvatarFallback className="text-white dark:text-slate-900">
                  {message.type === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>

              <div className={cn("flex-1 max-w-[85%]", message.type === "user" ? "text-right" : "text-left")}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {message.type === "user" ? "You" : "Claude"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  </span>
                </div>

                <Card
                  className={cn(
                    "p-4 border-0",
                    message.type === "user"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white",
                  )}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>
                </Card>

                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="w-10 h-10 bg-slate-900 dark:bg-slate-100">
                <AvatarFallback className="text-white dark:text-slate-900">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4 bg-slate-100 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm">Claude is analyzing...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t bg-slate-50 dark:bg-slate-800/50">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Claude about your sessions..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Ask about sentiment trends, common issues, resolution times, or escalation patterns
        </p>
      </div>
    </div>
  )
}

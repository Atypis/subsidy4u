'use client'

import { useChat } from 'ai/react'
import { Send, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ChatInterface() {
  const setVisiblePrograms = useAppStore((state) => state.setVisiblePrograms)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      console.log('✅ Message finished:', message)
      console.log('📦 Tool invocations:', message.toolInvocations)
      
      // Process tool results from the finished message
      if (message.toolInvocations) {
        message.toolInvocations.forEach((toolInvocation: any) => {
          console.log('🔍 Processing tool:', toolInvocation.toolName, 'state:', toolInvocation.state)
          
          if (toolInvocation.toolName === 'apply_filters' && toolInvocation.state === 'result') {
            const result = toolInvocation.result
            console.log('✨ Filter result:', result)
            if (result?.matchingPrograms) {
              console.log(`📊 Updating programs: ${result.matchingPrograms.length} programs`)
              setVisiblePrograms(result.matchingPrograms.map((p: any) => ({
                ...p,
                status: 'eligible' as const,
                isFiltered: true
              })))
            }
          }
        })
      } else {
        console.log('⚠️ No tool invocations in message')
      }
    },
    onToolCall: ({ toolCall }) => {
      console.log('🔧 Tool called:', toolCall)
    }
  })

  const setMessages = useAppStore((state) => state.setMessages)
  const setIsLoading = useAppStore((state) => state.setIsLoading)

  useEffect(() => {
    setMessages(messages)
  }, [messages, setMessages])

  useEffect(() => {
    setIsLoading(isLoading)
  }, [isLoading, setIsLoading])

  // Also check messages for tool results in real-time
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.toolInvocations) {
      console.log('📨 Message update - checking tools:', lastMessage.toolInvocations)
      
      lastMessage.toolInvocations.forEach((toolInvocation: any) => {
        console.log(`🔎 Tool ${toolInvocation.toolName} - State: ${toolInvocation.state}`)
        
        if (toolInvocation.state === 'call') {
          console.log('⏳ Tool is being called, waiting for result...')
        } else if (toolInvocation.state === 'result') {
          console.log('✅ Tool result received!')
          
          if (toolInvocation.toolName === 'apply_filters') {
            const result = toolInvocation.result
            console.log('🎯 Filter result:', result)
            if (result?.matchingPrograms) {
              console.log(`📊 Updating UI: ${result.matchingPrograms.length} programs`)
              setVisiblePrograms(result.matchingPrograms.map((p: any) => ({
                ...p,
                status: 'eligible' as const,
                isFiltered: true
              })))
            } else {
              console.warn('⚠️ No matchingPrograms in result:', result)
            }
          }
        } else if (toolInvocation.state === 'partial-call') {
          console.log('🔄 Partial tool call...')
        } else {
          console.log('❓ Unknown tool state:', toolInvocation.state)
        }
      })
    }
  }, [messages, setVisiblePrograms])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="pt-16">
            <h2 className="text-3xl font-light text-neutral-900 mb-3">
              Find your subsidy
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-md mb-6">
              All available programs are shown on the right. Describe your company to filter them down using binary eligibility criteria.
            </p>
            <div className="text-xs text-neutral-400 space-y-1 max-w-md">
              <p>Try: "I'm a small tech startup in Berlin"</p>
              <p>Or: "Medium-sized manufacturer in Bavaria"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'text-right'
                  : ''
              }`}
            >
              <div className={`inline-block text-left ${
                message.role === 'user' 
                  ? 'bg-neutral-900 text-white px-4 py-2.5 rounded-2xl' 
                  : 'text-neutral-900'
              }`}>
                <div className={`prose prose-sm max-w-none ${
                  message.role === 'user' ? 'prose-invert' : 'prose-neutral'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              {/* Tool calls */}
              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="mt-3 space-y-2 text-xs text-neutral-500">
                  {message.toolInvocations.map((toolCall: any) => (
                    <div key={toolCall.toolCallId} className="flex items-center gap-2">
                      {toolCall.state === 'call' && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>
                        {toolCall.toolName === 'apply_filters' && 'Filtering programs'}
                        {toolCall.toolName === 'extract_company_info' && 'Analyzing company'}
                        {toolCall.toolName === 'get_program_details' && 'Loading details'}
                        {toolCall.toolName === 'check_eligibility' && 'Checking eligibility'}
                      </span>
                      {toolCall.state === 'result' && toolCall.result?.count !== undefined && (
                        <span className="text-neutral-900">• {toolCall.result.count} found</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 px-8 py-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Describe your company..."
            className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-sm transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

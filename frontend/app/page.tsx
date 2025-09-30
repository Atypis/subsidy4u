'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { ProgramGrid } from '@/components/programs/program-grid'
import { useAppStore } from '@/store/app-store'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const resetState = useAppStore((state) => state.resetState)
  const messages = useAppStore((state) => state.messages)
  const [sessionKey, setSessionKey] = useState(0)

  const handleNewSession = () => {
    if (messages.length > 0) {
      if (!confirm('Start a new session? Current conversation will be lost.')) {
        return
      }
    }
    resetState()
    setSessionKey((prev) => prev + 1)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-neutral-900">
              Subsidy4U
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              German Subsidy Programs
            </p>
          </div>
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:border-neutral-900 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </button>
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-[40%] border-r border-neutral-200 flex flex-col">
          <ChatInterface key={`chat-${sessionKey}`} />
        </div>

        {/* Right Panel - Programs */}
        <div className="flex-1 flex flex-col">
          <ProgramGrid key={`grid-${sessionKey}`} />
        </div>
      </div>
    </div>
  )
}

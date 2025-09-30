'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { ProgramGrid } from '@/components/programs/program-grid'

export default function Home() {
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
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-[40%] border-r border-neutral-200 flex flex-col">
          <ChatInterface />
        </div>

        {/* Right Panel - Programs */}
        <div className="flex-1 flex flex-col">
          <ProgramGrid />
        </div>
      </div>
    </div>
  )
}

"use client"

import { createContext, type PropsWithChildren, use } from "react"

type AIContextType = {
  isAIEnabled: boolean
}

const AIContext = createContext<AIContextType | null>(null)

type AIProviderProps = {
  isAIEnabled: boolean
}

export const AIProvider = ({ children, isAIEnabled }: PropsWithChildren<AIProviderProps>) => {
  return <AIContext.Provider value={{ isAIEnabled }}>{children}</AIContext.Provider>
}

export const useAI = () => {
  const context = use(AIContext)

  if (!context) {
    throw new Error("useAI must be used within an AIProvider")
  }

  return context
}

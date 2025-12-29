import { Suspense } from "react"
import { MessageCircle } from "lucide-react"
import { ChatContent } from "./chat-content"

// Force dynamic rendering to prevent prerendering issues with useSearchParams
export const dynamic = 'force-dynamic'

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}

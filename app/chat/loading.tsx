import { MessageCircle } from "lucide-react"

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="mt-4 text-muted-foreground">Loading messages...</p>
      </div>
    </div>
  )
}


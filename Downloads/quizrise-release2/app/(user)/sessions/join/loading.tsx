import { Loader2 } from "lucide-react"

export default function JoinSessionLoading() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Loading join session page...</p>
      </div>
    </div>
  )
}

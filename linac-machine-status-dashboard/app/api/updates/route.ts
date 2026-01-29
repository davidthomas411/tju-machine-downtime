import { getRealtimeEmitter } from '@/lib/realtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  const emitter = getRealtimeEmitter()
  let interval: NodeJS.Timeout | null = null
  let onUpdate: ((timestamp: number) => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (timestamp = Date.now()) => {
        controller.enqueue(encoder.encode(`event: update\ndata: ${timestamp}\n\n`))
      }

      onUpdate = (timestamp: number) => {
        send(timestamp)
      }

      emitter.on('update', onUpdate)
      interval = setInterval(() => send(Date.now()), 15000)
      send(Date.now())
    },
    cancel() {
      if (onUpdate) {
        emitter.off('update', onUpdate)
      }
      if (interval) {
        clearInterval(interval)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

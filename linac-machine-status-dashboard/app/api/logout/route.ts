export const runtime = 'nodejs'

export async function GET() {
  return new Response('Logged out', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="TJU LINAC Dashboard"',
      'Cache-Control': 'no-store',
    },
  })
}

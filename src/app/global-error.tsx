'use client'
export default function GlobalError({ error }: { error: Error }) {
  return (
    <html>
      <body style={{ padding: 40, fontFamily: 'monospace', background: '#111', color: 'white' }}>
        <h1>Erro Global</h1>
        <pre style={{ color: 'red' }}>{error?.message}</pre>
        <pre style={{ fontSize: 12, color: '#aaa' }}>{error?.stack}</pre>
      </body>
    </html>
  )
}

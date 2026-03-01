'use client'
export default function Error({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>500 - Erro interno</h1>
      <pre style={{ color: 'red' }}>{error?.message}</pre>
      <pre style={{ fontSize: 12, color: '#666' }}>{error?.stack}</pre>
    </div>
  )
}

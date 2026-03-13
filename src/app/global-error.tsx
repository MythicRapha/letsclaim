'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#000', color: '#fff', fontFamily: 'monospace', padding: '2rem' }}>
        <h2>Something went wrong</h2>
        <pre style={{ color: '#f55', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', maxWidth: '80ch' }}>
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#9945FF', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}

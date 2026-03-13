const HELIUS_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'

export async function POST(req: Request) {
  try {
    const body = await req.text()

    const resp = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    const data = await resp.text()

    return new Response(data, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'RPC proxy error' }, id: null },
      { status: 502 },
    )
  }
}

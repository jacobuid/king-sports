import { createKingAuthVerifier } from '@jacobuid/king-auth/server'

// Workers supports manual redirects, but not the SDK's redirect: 'error'.
// Keep verification at the configured endpoint and reject redirects explicitly.
export function createWorkerAuth(origin: string, send: typeof fetch = fetch) {
  return createKingAuthVerifier({
    origin,
    allowLocalhost: true,
    fetch: async (input, options) => {
      const response = await send(input, { ...options, redirect: 'manual' })
      if (response.status >= 300 && response.status < 400) throw new Error('KingAuth verification redirected')
      return response
    },
  })
}

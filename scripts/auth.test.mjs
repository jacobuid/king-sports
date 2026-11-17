import test from 'node:test'
import assert from 'node:assert/strict'
import { createKingAuthVerifier } from '@jacobuid/king-auth/server'

const origin = 'https://sports.example'
const request = token => new Request('https://api.example/api/teams', { headers: token ? { Authorization: `Bearer ${token}` } : {} })

test('KingAuth rejects missing credentials without contacting the service', async () => {
  const auth = createKingAuthVerifier({ origin, fetch: async () => { throw Error('Unexpected verification') } })
  assert.equal(await auth.getSession(request()), null)
})

test('KingAuth verifies bearer credentials for the configured frontend origin', async () => {
  const auth = createKingAuthVerifier({ origin, fetch: async (url, options) => {
    assert.equal(url, 'https://kingauth.app/api/browser/get-session')
    assert.equal(options.headers.Origin, origin)
    assert.equal(options.headers.Authorization, 'Bearer test-credential')
    assert.equal(options.redirect, 'error')
    return Response.json({ user: { id: 'king-auth-user' } })
  } })
  assert.equal((await auth.getSession(request('test-credential'))).user.id, 'king-auth-user')
})

test('revoked KingAuth sessions are rejected and service outages fail closed', async () => {
  const revoked = createKingAuthVerifier({ origin, fetch: async () => new Response(null, { status: 401 }) })
  assert.equal(await revoked.getSession(request('revoked')), null)
  const unavailable = createKingAuthVerifier({ origin, fetch: async () => new Response(null, { status: 503 }) })
  await assert.rejects(unavailable.getSession(request('test')), /unavailable/)
})

import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { computeMobileWebBundleId } from '../../../src/shared/mobile-web-bundle/manifest-contract'
import { decodeBundledActivityPage } from './bundled-activity-page'

function page() {
  const bytes = Buffer.from('<html>Activity View</html>')
  const asset = {
    path: 'index.html',
    contentType: 'text/html',
    byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  }
  return {
    manifest: {
      schemaVersion: 1,
      runtimeProtocolVersion: 1,
      minCompatibleRuntimeProtocolVersion: 1,
      entrypoint: 'index.html',
      assets: [asset],
      totalBytes: bytes.length,
      buildId: computeMobileWebBundleId([asset])
    },
    assets: { 'index.html': bytes.toString('base64') }
  }
}

describe('APK bundled Activity page', () => {
  it('leaves normal builds on host-delivered pages', () => {
    expect(decodeBundledActivityPage(null)).toBeNull()
  })
  it('returns verified assets with their manifest for the existing generation store', () => {
    const decoded = decodeBundledActivityPage(page())!
    expect(Buffer.from(decoded.assets.get('index.html')!).toString()).toBe(
      '<html>Activity View</html>'
    )
    expect(decoded.totalBytes).toBe(26)
    expect(decoded.reused).toEqual([])
  })
  it('rejects corrupt or missing packaged bytes', () => {
    const corrupt = page()
    corrupt.assets['index.html'] = Buffer.from('<html>Activity FAKE</html>').toString('base64')
    expect(() => decodeBundledActivityPage(corrupt)).toThrow()
    expect(() => decodeBundledActivityPage({ ...page(), assets: {} })).toThrow()
  })
})

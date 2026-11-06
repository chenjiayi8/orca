import { Buffer } from 'buffer'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { z } from 'zod'
import { MobileWebBundleManifestReadSchema } from '../transport/web-bundle/mobile-web-bundle-reply-schemas'
import type { MobileWebBundleFetchResult } from '../transport/web-bundle/mobile-web-bundle-fetch'
import packaged from './bundled-activity-page-data.json'

const schema = z.object({
  manifest: MobileWebBundleManifestReadSchema,
  assets: z.record(z.string(), z.string())
})

export function decodeBundledActivityPage(raw: unknown): MobileWebBundleFetchResult | null {
  if (raw === null) {
    return null
  }
  const { manifest, assets: encoded } = schema.parse(raw)
  const assets = new Map<string, Uint8Array>()
  for (const asset of manifest.assets) {
    const value = encoded[asset.path]
    if (typeof value !== 'string') {
      throw new Error('Missing APK page asset')
    }
    const bytes = new Uint8Array(Buffer.from(value, 'base64'))
    if (bytes.length !== asset.byteLength || bytesToHex(sha256(bytes)) !== asset.sha256) {
      throw new Error('Invalid APK page asset')
    }
    assets.set(asset.path, bytes)
  }
  return { manifest, assets, reused: [], totalBytes: manifest.totalBytes, elapsedMs: 0 }
}

let bundled: MobileWebBundleFetchResult | null | undefined

export function bundledActivityPage(): MobileWebBundleFetchResult | null {
  bundled ??= decodeBundledActivityPage(packaged)
  return bundled
}

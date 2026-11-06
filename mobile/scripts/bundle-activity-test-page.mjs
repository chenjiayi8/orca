import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const root = fileURLToPath(new URL('../../', import.meta.url))
const directory = join(root, 'out/mobile-web')
const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
const assets = {}
for (const asset of manifest.assets) {
  const bytes = await readFile(join(directory, asset.path))
  if (
    bytes.length !== asset.byteLength ||
    createHash('sha256').update(bytes).digest('hex') !== asset.sha256
  ) {
    throw new Error(`Invalid built asset: ${asset.path}`)
  }
  assets[asset.path] = bytes.toString('base64')
}
await writeFile(
  join(root, 'mobile/src/mobile-web-shell/bundled-activity-page-data.json'),
  JSON.stringify({ manifest, assets })
)
console.log(`Bundled Activity test page: ${manifest.buildId}, ${manifest.totalBytes} bytes`)

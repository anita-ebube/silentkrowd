import QRCode from 'qrcode'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const url = process.argv[2] || 'https://www.silentkrowd.com/menu'
const outDir = join(process.cwd(), 'qr-codes')
const outFile = join(outDir, 'silentkrowd-menu.png')

mkdirSync(outDir, { recursive: true })

await QRCode.toFile(outFile, url, {
  width: 1024,
  margin: 2,
  errorCorrectionLevel: 'H',
  color: { dark: '#0A0A0A', light: '#FFFFFF' },
})

console.log(`QR code written to ${outFile} (points to ${url})`)
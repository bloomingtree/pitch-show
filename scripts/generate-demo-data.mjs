import { readFileSync, writeFileSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const data = JSON.parse(readFileSync(resolve(rootDir, 'public/demo-song.mp3_1775659801401_notes.json'), 'utf8'))
const maxEnd = Math.max(...data.notes.map(n => n.startTimeSeconds + n.durationSeconds))
const duration = Math.ceil(maxEnd)

const cleanNotes = data.notes.map(n => ({
  pitchMidi: n.pitchMidi,
  startTimeSeconds: Math.round(n.startTimeSeconds * 1000) / 1000,
  durationSeconds: Math.round(n.durationSeconds * 1000) / 1000,
  amplitude: Math.round(n.amplitude * 1000) / 1000,
  pitchBends: n.pitchBends || [],
  isDynamic: n.isDynamic || false
}))

const output = `/**
 * Demo song note data - 永远的微笑 by 周璇
 * Generated from real BasicPitch analysis of demo-song.mp3 (52s clip)
 * Notes: ${cleanNotes.length}
 */

export const DEMO_SONG_DURATION = ${duration}

export const DEMO_NOTES = ${JSON.stringify(cleanNotes, null, 2)}
`

const outPath = resolve(rootDir, 'src/data/demoSongNotes.js')
writeFileSync(outPath, output, 'utf-8')
console.log(`Written: ${cleanNotes.length} notes, duration: ${duration}s`)
console.log(`File size: ${(statSync(outPath).size / 1024).toFixed(1)} KB`)

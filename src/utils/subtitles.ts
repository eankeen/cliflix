import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import temp from 'temp'

import { Config } from '../config'

export function parseTitle(title: any) {
  return title.replace(/\.srt$/i, '') // Extension
}

export async function download({ url, filename }) {
  // const content = await request(url)
  const content = await (await fetch(url)).text()
  const stream = Config.downloads.save
    ? fs.createWriteStream(path.join(Config.downloads.path, filename))
    : temp.createWriteStream()

  stream.write(content)
  stream.end()

  return stream
}

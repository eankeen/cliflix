import fs from 'fs'
import path from 'path'
import os from 'os'

import c from 'ansi-colors'
import OpenSubtitles from 'opensubtitles-api'
import JSON5 from 'json5'
import prompts from 'prompts'
import torrentSearch from 'torrent-search-api'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'

import { defaultConfig } from '../config'
import { getLangCode } from './lang'
import { resolveHome, isDebug } from '.'

/**
 * @summary Gets JSON Config
 */
export async function getJsonConfig(
  configFile: string
): Promise<typeof defaultConfig> {
  try {
    const raw = await fs.promises.readFile(configFile, { encoding: 'utf-8' })
    return JSON5.parse(raw)
  } catch (err) {
    console.info(c.red('Error: Could not read and parse config file. Exiting'))
    if (isDebug()) console.error(err)

    process.exit(1)
  }
}

export async function getTorrents(
  cfg: typeof defaultConfig,
  query: string | null = null,
  torrentProvider: string | null = null,
  torrentProviders: string[] | null = null
): Promise<torrentSearch.Torrent[]> {
  if (!query && cfg.title) query = cfg.title
  if (!torrentProvider) torrentProvider = cfg.torrentProvider
  if (!torrentProviders) torrentProviders = cfg.torrentProviders

  if (!query) {
    const input = await prompts({
      type: 'text',
      name: 'value',
      validate: (input: string) =>
        input.trim() === '' ? 'Input cannot be empty' : true,
      message: 'What do you want to watch?',
    })
    query = input.value
  }

  if (!query) {
    console.error(c.red('Error: Input blank. Exiting'))
    process.exit(1)
  }

  if (torrentProviders.length === 0) {
    console.info(c.blue('Info: Ran out of providers. Exiting'))
    process.exit(0)
  }

  try {
    torrentSearch.disableAllProviders()
    torrentSearch.enableProvider(torrentProvider)

    const torrents = await torrentSearch.search(
      query,
      'All',
      cfg.torrentListLength
    )

    if (Array.isArray(torrents) && torrents.length === 0)
      throw new Error('No torrents found')

    return torrents
  } catch (err) {
    console.error(
      c.yellow(`Warning: No torrents found via "${c.bold(torrentProvider)}"`)
    )
    if (isDebug()) console.error(err)

    const nextTorrentProvider =
      torrentProviders[torrentProviders.indexOf(torrentProvider) + 1]
    const nextTorrentProviders = torrentProviders.filter(
      (provider) => provider !== torrentProvider
    )

    return getTorrents(cfg, query, nextTorrentProvider, nextTorrentProviders)
  }
}

export async function getTorrentChoice(
  torrents: torrentSearch.Torrent[]
): Promise<torrentSearch.Torrent> {
  const input = await prompts({
    type: 'select',
    name: 'value',
    validate: (input: string) =>
      input.trim() === '' ? 'Input cannot be empty' : true,
    message: 'Which torrent do you want to use?',
    choices: torrents.map((torrent) => ({
      // @ts-ignore
      title: `${torrent.seeds} | ${torrent.peers} | ${torrent.title} | ${torrent.size} | ${torrent.time}`,
      value: torrent,
    })),
  })

  if (Object.keys(input).length === 0) {
    console.info(c.red('Error: Torrent object empty. Exiting'))
    process.exit(1)
  }

  return input.value
}

export async function getMagnets(torrent: torrentSearch.Torrent) {
  try {
    return torrentSearch.getMagnet(torrent)
  } catch (err) {
    console.error(c.red('Error: Could not get magnet. Exiting'))
    if (isDebug()) console.error(err)

    process.exit(1)
  }
}

type subtitle = {
  url: string
  langcode: string
  downloads: number
  lang: string
  encoding: string
  id: string
  filename: string
  date: string
  score: number
  fps: number
  format: string
  utf8: string
  vtt: string
}

export async function getSubtitles(
  cfg: typeof defaultConfig,
  torrent: torrentSearch.Torrent
): Promise<subtitle[]> {
  const languageCode = getLangCode(cfg.subtitleLanguage)
  try {
    const OS = new OpenSubtitles({
      useragent: 'PlayMe v1',
      username: null,
      password: null,
      ssl: true,
    })

    const results = await OS.search({
      sublanguageid: languageCode,
      limit: 10,
      query: torrent.title,
    })
    return results[Object.keys(results)[0]] || []
  } catch (err) {
    console.error(
      c.yellow(
        'Warning: Could not search for subtitles with OpenSubtitles. Ignoring'
      )
    )
    return []
  }
}

export async function getSubtitleFile(
  cfg: typeof defaultConfig,
  subtitle: subtitle
) {
  return new Promise<string>(async (resolve, _reject) => {
    let stream: fs.WriteStream

    const content = await (await fetch(subtitle.url)).text()
    if (cfg.saveMedia) {
      stream = fs.createWriteStream(
        path.join(resolveHome(cfg.downloadDir), subtitle.filename)
      )
    } else {
      let id = uuid()
      id = id.slice(0, id.indexOf('-'))
      const tempFile = path.join(
        os.tmpdir(),
        `cliflix-${cfg.title}-${id}`,
        subtitle.filename
      )
      await fs.promises.mkdir(path.dirname(tempFile), {
        mode: 0o755,
        recursive: true,
      })

      stream = fs.createWriteStream(tempFile)
    }

    stream.write(content)
    stream.end()
    stream.on('finish', () => {
      /** @global */
      globalThis.ourTempDir = path.dirname(stream.path.toString())
      resolve(stream.path.toString())
    })
    stream.on('error', (err) => {
      console.info(
        c.yellow('Warning: Could not download subtitles file. Ignoring')
      )
      if (isDebug()) console.error(err)
    })
  })
}

import fs from 'fs'
import path from 'path'
import c from 'ansi-colors'
import temp from 'temp'
import OpenSubtitles from 'opensubtitles-api'
import prompts from 'prompts'
import torrentSearch from 'torrent-search-api'
import fetch from 'node-fetch'

import { defaultConfig } from '../config'
import { getLangCode } from './lang'

export async function getTorrents(
  cfg: typeof defaultConfig,
  query: string | null = null,
  torrentProvider: string | null = null,
  torrentProviders: string[] | null = null
): Promise<torrentSearch.Torrent[]> {
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
    console.info(c.yellow('Input blank. Exiting'))
    process.exit(1)
  }

  if (torrentProviders.length === 0) {
    console.info(c.yellow('Ran out of providers. Exiting'))
    process.exit(1)
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
      c.yellow(`No torrents found via "${c.bold(torrentProvider)}"`)
    )

    const nextTorrentProvider =
      torrentProviders[torrentProviders.indexOf(torrentProvider) + 1]
    const nextTorrentProviders = torrentProviders.filter(
      (provider) => provider !== torrentProvider
    )

    return getTorrents(cfg, query, nextTorrentProvider, nextTorrentProviders)
  }
}

export async function getMagnets(torrent: torrentSearch.Torrent) {
  try {
    return torrentSearch.getMagnet(torrent)
  } catch (err) {
    console.error(c.yellow('getMagent error. Exiting'))
    console.error(err)
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
  const input = await prompts({
    type: 'autocomplete',
    name: 'value',
    message: 'Which language?',
    choices: defaultConfig.subtitleLanguages.map((language: string) => ({
      title: language,
      value: language,
    })),
  })
  const languageCode = getLangCode(input.value)
  try {
    const OS = new OpenSubtitles({
      useragent: 'PlayMe v1',
      username: null,
      password: null,
      ssl: true,
    })

    const results = await OS.search({
      sublanguageid: languageCode,
      limit: 30,
      query: torrent.title,
    })
    return results[Object.keys(results)[0]] || []
  } catch (err) {
    console.error(c.red('OpenSubtitles error. Ignoring'))
    console.error(err)
    return []
  }
}

export async function getSubtitleFile(
  cfg: typeof defaultConfig,
  subtitle: subtitle
) {
  return new Promise<string>(async (resolve, reject) => {
    let stream: fs.WriteStream

    const content = await (await fetch(subtitle.url)).text()
    stream = false
      ? fs.createWriteStream(path.join(cfg.downloadDir, subtitle.filename))
      : temp.createWriteStream()

    stream.write(content)
    stream.end()
    stream.on('finish', () => {
      resolve(stream.path.toString())
    })
    stream.on('error', (err) => {
      console.info(c.yellow('Error when downloading subtitles file. Ignoring'))
      console.info(err)
    })
  })
}

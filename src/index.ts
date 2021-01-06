import path from 'path'
import _ from 'lodash'
import c from 'ansi-colors'
import yargs from 'yargs'
import execa from 'execa'
import ora from 'ora'
import OpenSubtitles from 'opensubtitles-api'
import parseTorrent from 'parse-torrent'
import prompts from 'prompts'
import torrentSearch from 'torrent-search-api'
import prompt from 'inquirer-helpers'

import * as lang from './lang'
import { Config } from './config'
import * as subtitleUtils from './utils/subtitles'
import * as webtorrentUtils from './utils/webtorrent'
import * as promptUtils from './utils/prompt'

async function getMagnet(torrent: any) {
  try {
    return await torrentSearch.getMagnet(torrent)
  } catch (err) {
    console.error(c.yellow('getMagent error. Ignoring'))
    return
  }
}

async function getSubtitles(query: string, language: string) {
  try {
    const OS = new OpenSubtitles(Config.subtitles.opensubtitles)
    const results = await OS.search({
      sublanguageid: language,
      limit: Config.subtitles.limit,
      query,
    })

    return results[Object.keys(results)[0]] || []
  } catch (err) {
    console.error(c.red('OpenSubtitles error. Ignoring'))
    return []
  }
}

async function getTorrents(
  query: any,
  rows = Config.torrents.limit,
  provider = Config.torrents.providers.active,
  providers = Config.torrents.providers.available
) {
  const hasProvider = !!provider

  if (!provider) {
    provider = await prompt.list('Which torrents provider?', providers)
  }

  const categories = {
    ThePirateBay: 'Video',
    TorrentProject: 'Video',
  }

  const category = categories[provider] || 'All'
  const spinner = ora(`Waiting for "${c.bold(provider)}"...`).start()

  try {
    torrentSearch.disableAllProviders()
    torrentSearch.enableProvider(provider)

    const torrents = await torrentSearch.search(query, category, rows)

    spinner.stop()

    if (!torrents.length) throw new Error('No torrents found.')

    return torrents
  } catch (err) {
    spinner.stop()

    console.error(c.yellow(`No torrents found via "${c.bold(provider)}"`))

    const nextProviders = _.without(providers, provider),
      nextProvider = hasProvider
        ? providers[providers.indexOf(provider) + 1]
        : ''

    if (!nextProvider && !nextProviders.length) return []

    return await getTorrents(query, rows, nextProvider, nextProviders)
  }
}

async function getTorrent(argv: yargs.Arguments) {
  while (true) {
    const query = await prompt.input('What do you want to watch?')
    const torrents = await getTorrents(
      query,
      Config.torrents.limit,
      argv.activeTorrentProvider as string
    )

    if (!torrents.length) {
      console.error(
        c.yellow(`No torrents found for "${c.bold(query)}", try another query.`)
      )

      continue
    }

    return await promptUtils.title('Which torrent?', torrents)
  }
}

export const CLIFlix = {
  async wizard(argv: yargs.Arguments, webtorrentOptions: string[] = []) {
    const torrent = await getTorrent(argv)
    const magnet = await getMagnet(torrent)
    if (!magnet) return console.error(c.red('Magnet not found.'))

    if (!webtorrentUtils.isOptionSet(webtorrentOptions, /^--subtitles$/i)) {
      if (!argv.noSubtitles) {
        const languageName = await prompt.list(
          'Which language?',
          promptUtils.parseList(
            Config.subtitles.languages.available,
            Config.subtitles.languages.favorites
          )
        )
        const languageCode = lang.getCode(languageName)
        const spinner = ora(
          `Waiting for "${c.bold('OpenSubtitles')}"...`
        ).start()
        const subtitlesAll = await getSubtitles(torrent.title, languageCode)

        spinner.stop()

        if (!subtitlesAll.length) {
          const res = await prompts({
            type: 'confirm',
            name: 'ok',
            initial: true,
            message: `No subtitles found for "${languageName}", play it anyway?`,
          })

          if (res.ok === false) {
            console.log(c.green('Exiting.'))
            return
          }
        } else {
          const subtitles = await promptUtils.subtitles(
            'Which subtitles?',
            subtitlesAll
          )
          const stream = await subtitleUtils.download(subtitles)

          if (Buffer.isBuffer(stream.path)) stream.path = stream.path.toString()
          webtorrentOptions.push('--subtitles', stream.path)
        }
      }
    }

    if (
      (Config.outputs.available.length || Config.outputs.favorites.length) &&
      !webtorrentUtils.isAppSet(webtorrentOptions)
    ) {
      const app = await prompt.list(
        'Which app?',
        promptUtils.parseList(
          Config.outputs.available,
          Config.outputs.favorites
        )
      )

      webtorrentOptions = webtorrentUtils.setApp(webtorrentOptions, app)
    }

    CLIFlix.stream(magnet, webtorrentOptions)
  },

  async lucky(queryOrTorrent, webtorrentOptions: string[] = []) {
    //TODO: Maybe add subtitles support
    let torrent: string | undefined
    try {
      parseTorrent(queryOrTorrent)
      torrent = queryOrTorrent
    } catch (err) {
      const torrents = await getTorrents(queryOrTorrent, 1)

      if (!torrents.length)
        return console.error(
          c.red(`No torrents found for "${c.bold(queryOrTorrent)}"`)
        )

      torrent = await getMagnet(torrents[0])
      if (!torrent) return console.error(c.red('Magnet not found.'))
    }

    return CLIFlix.stream(torrent, webtorrentOptions)
  },

  async stream(torrent, webtorrentOptions: string[] = []) {
    webtorrentOptions = webtorrentUtils.parse(
      webtorrentOptions,
      Config.webtorrent.options
    )

    const execArgs = ['download', torrent, ...webtorrentOptions],
      execOpts = {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit' as 'inherit',
      }

    execa.sync('webtorrent', execArgs, execOpts)
  },
}

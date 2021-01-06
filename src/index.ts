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
import fs from 'fs'
import temp from 'temp'
import fetch from 'node-fetch'

import * as lang from './lang'
import { Config } from './config'
import * as promptUtils from './utils/prompt'
import { getDownloadsDir } from './utils'

async function getMagnet(torrent: any): Promise<string> {
  try {
    return await torrentSearch.getMagnet(torrent)
  } catch (err) {
    console.error(c.yellow('getMagent error. Exiting'))
    console.error(err)
    process.exit(1)
  }
}

async function getTorrent(argv: yargs.Arguments) {
  while (true) {
    const query = argv.title
      ? argv.title
      : await prompt.input('What do you want to watch?')
    const provider = argv.activeTorrentProvider
      ? (argv.activeTorrentProvider as string)
      : Config.torrents.providers.active
    const torrents = await getTorrents(query, Config.torrents.limit, provider)

    if (!torrents.length) {
      console.error(
        c.yellow(`No torrents found for "${c.bold(query)}", try another query.`)
      )
      continue
    }

    return await promptUtils.title('Which torrent?', torrents)
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

export const CLIFlix = {
  async wizard(argv: yargs.Arguments, webtorrentOptions: string[] = []) {
    // GET TORRENT
    const torrent = await getTorrent(argv)

    // GET MAGENET
    const magnet = await getMagnet(torrent)
    if (!torrent) return console.error(c.red('Magnet not found.'))

    // SET SUBTITLES
    if (argv.subtitles) {
      const languageName =
        Config.activeLanguage && Config.activeLanguage.length > 1
          ? Config.activeLanguage
          : await prompt.list(
              'Which language?',
              promptUtils.parseList(
                Config.subtitles.languages.available,
                Config.subtitles.languages.favorites
              )
            )
      const languageCode = lang.getCode(languageName)
      const spinner = ora(`Waiting for "${c.bold('OpenSubtitles')}"...`).start()
      const subtitlesAll = await getSubtitles(torrent.title, languageCode)

      spinner.stop()

      if (!subtitlesAll.length && !argv.autosubtitles) {
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
        let subtitles: Record<string, any>
        if (argv.autosubtitles) {
          subtitles = subtitlesAll[0]
        } else {
          subtitles = await promptUtils.subtitles(
            'Which subtitles?',
            subtitlesAll
          )
        }

        // DOWNLOAD SUBTITLES
        let stream: fs.WriteStream
        {
          const { url, filename } = subtitles
          const content = await (await fetch(url)).text()
          stream = Config.downloadSave
            ? fs.createWriteStream(path.join(getDownloadsDir(Config), filename))
            : temp.createWriteStream()

          stream.write(content)
          stream.end()
        }

        webtorrentOptions.push('--subtitles', stream.path.toString())
      }
    }

    // SET APP
    if (argv.activeOutputProgram) {
      webtorrentOptions.push(
        `--${(argv.activeOutputProgram as string).toLowerCase()}`
      )
    } else {
      const app = await prompt.list(
        'Which app?',
        promptUtils.parseList(
          Config.outputs.available,
          Config.outputs.favorites
        )
      )

      webtorrentOptions.push(`--${app.toLowerCase()}`)
    }

    // SET OUTPUT-DIR
    if (argv.outputDir) {
      webtorrentOptions.push('--out', argv.outputDir as string)
    } else {
      webtorrentOptions.push('--out', getDownloadsDir(Config))
    }

    CLIFlix.stream(magnet, webtorrentOptions)
  },

  async do(argv: yargs.Arguments, webtorrentOptions: string[] = []) {
    let torrent: string | undefined
    try {
      parseTorrent(argv.doArg as string)
      torrent = argv.doArg as string
    } catch (err) {
      console.error(c.red('Error: Could not parseTorrent. Exiting'))
      console.error(err)
      process.exit(1)
    }

    // SET OUTPUT-DIR
    if (argv.outputDir) {
      webtorrentOptions.push('--out', argv.outputDir as string)
    } else {
      webtorrentOptions.push('--out', getDownloadsDir(Config))
    }

    return CLIFlix.stream(torrent, webtorrentOptions)
  },

  async stream(torrent: string | undefined, webtorrentOptions: string[] = []) {
    if (!torrent) {
      console.error(c.red('Error: torrent param undefined. Exiting'))
      process.exit(1)
    }

    const execArgs = ['download', torrent, ...webtorrentOptions, '--no-quit']
    const execOpts = {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit' as 'inherit',
    }

    execa.sync('webtorrent', execArgs, execOpts)
  },
}

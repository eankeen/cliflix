import path from 'path'
import _ from 'lodash'
import c from 'ansi-colors'
import execa from 'execa'
import * as OpenSubtitles from 'opensubtitles-api'
import * as parseTorrent from 'parse-torrent'
import prompt from 'inquirer-helpers'
import torrentSearch from 'torrent-search-api'
import ora from 'ora'
import { Config } from './config'
import { utils } from './utils'

async function getMagnet(torrent) {
  try {
    return await torrentSearch.getMagnet(torrent)
  } catch (e) {
    return
  }
}

async function getSubtitles(query, language) {
  try {
    const OS = new OpenSubtitles(Config.subtitles.opensubtitles)
    const results = await OS.search({
      sublanguageid: language,
      limit: Config.subtitles.limit,
      query,
    })

    return results[Object.keys(results)[0]] || []
  } catch (e) {
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

  const category = categories[provider] || 'All',
    spinner = ora(`Waiting for "${c.bold(provider)}"...`).start()

  try {
    torrentSearch.disableAllProviders()
    torrentSearch.enableProvider(provider)

    const torrents = await torrentSearch.search(query, category, rows)

    spinner.stop()

    if (!torrents.length) throw new Error('No torrents found.')

    return torrents
  } catch (e) {
    console.debug(e)
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

async function getTorrent() {
  while (true) {
    const query = await prompt.input('What do you want to watch?'),
      torrents = await getTorrents(query)

    if (!torrents.length) {
      console.error(
        c.yellow(`No torrents found for "${c.bold(query)}", try another query.`)
      )

      continue
    }

    return await utils.prompt.title('Which torrent?', torrents)
  }
}

export const CLIFlix = {
  async wizard(webtorrentOptions: string[] = []) {
    const torrent = await getTorrent()
    const magnet = await getMagnet(torrent)

    if (!magnet) return console.error(c.red('Magnet not found.'))

    if (
      (Config.subtitles.languages.available.length ||
        Config.subtitles.languages.favorites.length) &&
      !utils.webtorrent.options.isSubtitlesSet(webtorrentOptions)
    ) {
      // const subbed = await prompt.noYes('Do you want subtitles?')
      // if (subbed) {
      if (true) {
        const languageName = await prompt.list(
            'Which language?',
            utils.prompt.parseList(
              Config.subtitles.languages.available,
              Config.subtitles.languages.favorites
            )
          ),
          languageCode = utils.language.getCode(languageName),
          spinner = ora(`Waiting for "${c.bold('OpenSubtitles')}"...`).start(),
          subtitlesAll = await getSubtitles(torrent.title, languageCode)

        spinner.stop()

        if (!subtitlesAll.length) {
          const okay = await prompt.noYes(
            `No subtitles found for "${languageName}", play it anyway?`
          )

          if (!okay) return
        } else {
          const subtitles = await utils.prompt.subtitles(
              'Which subtitles?',
              subtitlesAll
            ),
            stream = await utils.subtitles.download(subtitles)

          if (Buffer.isBuffer(stream.path)) stream.path = stream.path.toString()
          utils.webtorrent.options.setSubtitles(webtorrentOptions, stream.path)
        }
      }
    }

    if (
      (Config.outputs.available.length || Config.outputs.favorites.length) &&
      !utils.webtorrent.options.isAppSet(webtorrentOptions)
    ) {
      const app = await prompt.list(
        'Which app?',
        utils.prompt.parseList(
          Config.outputs.available,
          Config.outputs.favorites
        )
      )

      webtorrentOptions = utils.webtorrent.options.setApp(
        webtorrentOptions,
        app
      )
    }

    CLIFlix.stream(magnet, webtorrentOptions)
  },

  async lucky(queryOrTorrent, webtorrentOptions: string[] = []) {
    //TODO: Maybe add subtitles support
    let torrent: string

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
    webtorrentOptions = utils.webtorrent.options.parse(
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

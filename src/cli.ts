import yargs from 'yargs'

import { initLocale, initLocalConfig, initMisc } from './init'
import { CLIFlix } from './index'
import * as util from './utils'

export async function cli() {
  initLocale()
  initLocalConfig()
  initMisc()

  yargs
    .scriptName('cliflix')
    .usage('$0 <cmd> [args]')
    .command({
      command: '*',
      handler: (argv) => {
        util.checkConnection()

        const webtorrentOptions = []
        CLIFlix.wizard(argv, webtorrentOptions)
      },
    })
    .command({
      command: 'do <doArg>',
      handler: (argv) => {
        util.checkConnection()

        const webtorrentOptions = []
        CLIFlix.do(argv, webtorrentOptions)
      },
    })
    .option('activeTorrentProvider', {
      type: 'string',
      describe:
        'Torrent providers: 1337x|ThePirateBay|ExtraTorrent|Rarbg|Torrent9|KickassTorrents|TorrentProject|Torrentz2',
    })
    .option('activeOutputProgram', {
      type: 'string',
      describe:
        'App to play the movie with: VLC|Airplay|Chromecase|DLNA|MPlayer|mpv|IINA|XBMC',
    })
    .option('title', {
      type: 'string',
      describe: 'Name of movie / media you want to watch',
    })
    .option('outputDir', {
      type: 'string',
      describe: 'Directory to output files. Same as "downloads.path"',
    })
    .option('subtitles', {
      type: 'boolean',
      describe: 'Download and use subtitles',
      default: true,
    })
    .option('autosubtitles', {
      type: 'boolean',
      describe:
        'Automatically pick the most downloaded subtitles. Also skips the "No subtitles, continue?" menu branch',
      default: false,
    })
    .example('$0', 'Launches cliflix wizard')
    .alias('help', 'h')
    .alias('version', 'v')
    .strict()
    .strictCommands()
    .strictOptions().argv
}

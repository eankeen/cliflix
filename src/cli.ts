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
      command: 'do <param>',
      handler: (argv) => {
        util.checkConnection()

        const webtorrentOptions = []
        CLIFlix.lucky(argv.param, webtorrentOptions)
      },
    })
    .option('activeTorrentProvider', {
      type: 'string',
      describe:
        'Torrent providers: 1337x|ThePirateBay|ExtraTorrent|Rarbg|Torrent9|KickassTorrents|TorrentProject|Torrentz2',
    })
    .option('outputDir', {
      type: 'string',
      describe: 'Directory to output files. Same as "downloads.path"',
    })
    .option('movieFile', {
      type: 'string',
      describe: 'Name of output movie file',
    })
    .option('subtitleFile', {
      type: 'string',
    })
    .option('noSubtitles', {
      type: 'boolean',
      default: false,
    })
    .example('$0', 'Launches cliflix wizard')
    .alias('help', 'h')
    .alias('version', 'v')
    .strict()
    .strictCommands()
    .strictOptions().argv
}

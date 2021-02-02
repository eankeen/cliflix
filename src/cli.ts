import yargs from 'yargs'

import { init } from './utils'
import * as actions from './actions'
import * as util from './utils'

export async function cli() {
  init()

  yargs
    .scriptName('cliflix')
    .usage('$0 <cmd> [args]')
    .command({
      command: '*',
      handler: async (argv) => {
        util.ensureConnection()

        await actions.doWizard(argv)
      },
    })
    .command({
      command: 'do <doArg>',
      handler: async (argv) => {
        util.ensureConnection()

        await actions.doInfer(argv)
      },
    })
    .option('torrentProvider', {
      type: 'string',
      describe:
        'Torrent providers: 1337x|ThePirateBay|ExtraTorrent|Rarbg|Torrent9|KickassTorrents|TorrentProject|Torrentz2',
    })
    .option('moviePlayer', {
      type: 'string',
      describe:
        'App to play the movie with: VLC|Airplay|Chromecase|DLNA|MPlayer|mpv|IINA|XBMC',
    })
    .option('subtitleLanguage', {
      type: 'string',
      describe: 'Language for subtitles',
    })
    .option('title', {
      type: 'string',
      describe: 'Name of the movie, TV show, or series',
    })
    .option('saveMedia', {
      type: 'boolean',
      describe:
        'Whether to save the movie to disk or save it in memory temporarily',
    })
    .option('skipNoSubtitles', {
      type: 'boolean',
      describe: 'Download and use subtitlese',
    })
    .option('torrentListLength', {
      type: 'number',
      describe: 'The number of torrents suggested after a search',
    })
    .option('downloadDir', {
      type: 'string',
      describe: 'Location to download the movie to',
    })
    .option('configFile', {
      type: 'string',
      describe: 'Location to download the movie to',
    })
    .example('$0', 'Launches cliflix wizard')
    .alias('help', 'h')
    .alias('version', 'v')
    .strict()
    .strictCommands()
    .strictOptions().argv
}

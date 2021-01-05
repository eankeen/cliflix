import readPkg from 'read-pkg-up'
import { utils } from './utils'
import { CLIFlix } from './index'
import yargs from 'yargs'

export async function cli() {
  process.on('SIGINT', () => process.exit(1))

  // @ts-ignore
  const { packageJson } = await readPkg({ cwd: __dirname })

  yargs
    .scriptName('cliflix')
    .usage('$0 <cmd> [args]')
    .command({
      command: '*',
      handler: (argv) => {
        if (argv._[0]) {
          console.log('Unknown commmand', argv._[0])
          return
        }
        console.info(argv)
        const webtorrentOptions = []
        CLIFlix.wizard(webtorrentOptions)
      },
    })
    .command({
      command: 'torrent <torrent>',
      describe: 'Use torrent',
      handler: (argv) => {
        console.info(argv)
        const webtorrentOptions = []
        // CLIFlix.lucky(queryOrTorrent, webtorrentOptions)
      },
    })
    .command({
      command: 'title <title>',
      describe: 'Use title',
      handler: (argv) => {
        console.info(argv)
        const webtorrentOptions = []
        // CLIFlix.lucky(queryOrTorrent, webtorrentOptions)
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
    .example('$0', 'Launches cliflix wizard')
    .alias('help', 'h')
    .alias('version', 'v')
    .strict()
    .strictCommands()
    .strictOptions().argv
}

import path from 'path'
import execa from 'execa'
import c from 'ansi-colors'

export async function streamMovie(
  torrent: string | undefined,
  webtorrentOptions: string[] = []
) {
  if (!torrent) {
    console.error(c.red('Error: Torrent not defined. Exiting'))
    process.exit(1)
  }

  const execArgs = ['download', torrent, ...webtorrentOptions]
  const execOpts = {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit' as 'inherit',
  }

  execa.sync('webtorrent', execArgs, execOpts)
}

import type yargs from 'yargs'
import c from 'ansi-colors'
import parseTorrent from 'parse-torrent'

import * as util from '../utils'
import { defaultConfig } from '../config'
import { streamMovie } from './stream'

export async function doInfer(argv: yargs.Arguments): Promise<void> {
  const cfg = util.mergeConfig(argv, defaultConfig)

  await util.ensureProperty(cfg, 'torrentProvider')
  await util.ensureProperty(cfg, 'moviePlayer')
  await util.ensureProperty(cfg, 'subtitleLanguage', 'autocomplete')

  const torrents = await util.getTorrents(cfg)
  const torrent = torrents[0]
  const magnet = await util.getMagnets(torrent)
  const subtitles = await util.getSubtitles(cfg, torrent)
  const subtitleFile = await util.getSubtitleFile(cfg, subtitles[0])

  streamMovie(magnet, [
    '--out',
    cfg.downloadDir,
    '--subtitles',
    subtitleFile,
    '--vlc',
    '--no-quit',
  ])
}

import type yargs from 'yargs'

import * as util from '../utils'
import { streamMovie } from './stream'
import { defaultConfig } from '../config'

export async function doWizard(argv: yargs.Arguments): Promise<void> {
  const cfg = util.mergeConfig(argv, defaultConfig)

  await util.ensureProperty(cfg, 'torrentProvider')
  await util.ensureProperty(cfg, 'moviePlayer')
  await util.ensureProperty(cfg, 'subtitleLanguage', 'autocomplete')

  const torrents = await util.getTorrents(cfg)
  // const torrent = await utils.chooseTorrent(torrents)
  const torrent = torrents[0]
  const magnet = await util.getMagnets(torrent)
  const subtitles = await util.getSubtitles(cfg, torrent)
  const subtitleFile = await util.getSubtitleFile(cfg, subtitles[0])
  console.info(subtitleFile)
  console.info(magnet)

  streamMovie(magnet, [
    '--out',
    cfg.downloadDir,
    '--subtitles',
    subtitleFile,
    '--vlc',
    '--no-quit',
  ])
}

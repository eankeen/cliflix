import path from 'path'
import type yargs from 'yargs'

import * as util from '../utils'
import { defaultConfig } from '../config'
import { streamMovie } from './stream'

export async function doInfer(argv: yargs.Arguments): Promise<void> {
  const jsonConfig = await util.getJsonConfig(
    ((argv as unknown) as typeof defaultConfig).configFile ||
      defaultConfig.configFile
  )
  const cfg = util.mergeConfig(argv, jsonConfig, defaultConfig)

  await util.ensureProperty(cfg, 'torrentProvider')
  await util.ensureProperty(cfg, 'moviePlayer')
  await util.ensureProperty(cfg, 'subtitleLanguage', 'autocomplete')

  const torrents = await util.getTorrents(cfg)
  const torrent = torrents[0]
  const magnet = await util.getMagnets(torrent)
  const subtitles = await util.getSubtitles(cfg, torrent)
  const subtitleFile = await util.getSubtitleFile(cfg, subtitles[0])

  await streamMovie(magnet, [
    '--out',
    path.dirname(subtitleFile),
    '--subtitles',
    subtitleFile,
    `--${cfg.moviePlayer.toLowerCase()}`,
    ...cfg.webtorrentOptions,
  ])
  await util.cleanupTemp(subtitleFile)
}

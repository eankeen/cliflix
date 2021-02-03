import path from 'path'
import type yargs from 'yargs'

import * as util from '../utils'
import { streamMovie } from './stream'
import { defaultConfig } from '../config'

export async function doWizard(argv: yargs.Arguments): Promise<void> {
  const jsonConfig = await util.getJsonConfig(
    ((argv as unknown) as typeof defaultConfig).configFile ||
      defaultConfig.configFile
  )
  const cfg = util.mergeConfig(argv, jsonConfig, defaultConfig)

  await util.ensureProperty(cfg, 'torrentProvider')
  await util.ensureProperty(cfg, 'moviePlayer')
  await util.ensureProperty(cfg, 'subtitleLanguage', 'autocomplete')

  const torrents = await util.getTorrents(cfg)
  const torrent = await util.getTorrentChoice(torrents)
  const magnet = await util.getMagnets(torrent)
  const subtitles = await util.getSubtitles(cfg, torrent)
  const subtitleFile = await util.getSubtitleFile(cfg, subtitles[0])

  streamMovie(magnet, [
    '--out',
    path.dirname(subtitleFile),
    '--subtitles',
    subtitleFile,
    `--${cfg.moviePlayer.toLowerCase()}`,
    ...cfg.webtorrentOptions,
  ])
}

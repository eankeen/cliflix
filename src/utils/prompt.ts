import _ from 'lodash'

import { Config } from '../config'
import { customTablePrompt } from './customTablePrompt'

function parseSubtitleTitle(title: any) {
  return title.replace(/\.srt$/i, '') // Extension
}

function parseTitleTitle(title: any) {
  return title
    .replace(/\d+(\.\d+)? ?[k|m|g|t]b/gi, '') // Size info
    .replace(/\s\s+/g, ' ') // Multiple spaces
    .replace(/- -/g, '-') // Empty blocks between dashes
    .replace(/\s*-$/, '') // Ending dash
}

export async function title(message: string, titles: any[]) {
  /* CHECKS */
  const hasSeeders = _.isNumber(titles?.[0].seeds)
  const hasLeechers = _.isNumber(titles?.[0].peers)
  const hasSize = _.isString(titles?.[0].size)
  const hasTime = _.isString(titles?.[0].time)

  /* TABLE */
  const table: string[][] = []
  titles.forEach((title: any) => {
    const row: string[] = []

    row.push(parseTitleTitle(title.title))

    if (Config.torrents.details.seeders && hasSeeders) row.push(title.seeds)
    if (Config.torrents.details.leechers && hasLeechers) row.push(title.peers)
    if (Config.torrents.details.size && hasSize) row.push(title.size)
    if (Config.torrents.details.time && hasTime) row.push(title.time)

    table.push(row)
  })

  /* COLORS */

  const colors: (undefined | string)[] = [undefined]

  if (Config.torrents.details.seeders && hasSeeders) colors.push('green')
  if (Config.torrents.details.leechers && hasLeechers) colors.push('red')
  if (Config.torrents.details.size && hasSize) colors.push('yellow')
  if (Config.torrents.details.time && hasTime) colors.push('magenta')

  return await customTablePrompt(message, table, titles, colors)
}

export async function subtitles(message: string, subtitlesAll: any) {
  const table: string[][] = []

  subtitlesAll.forEach((subtitles: any) => {
    const row: string[] = []

    row.push(parseSubtitleTitle(subtitles.filename))

    if (Config.subtitles.showDownloads) row.push(subtitles.showDownloads)

    table.push(row)
  })

  /* COLORS */
  const colors = [undefined, 'green']
  return await customTablePrompt(message, table, subtitlesAll, colors)
}

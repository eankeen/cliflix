import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import c from 'ansi-colors'
import filesizeParser from 'filesize-parser'
import * as inquirer from 'inquirer'
import prompt from 'inquirer-helpers'
import isOnline from 'is-online'
import * as prettySize from 'prettysize'
import * as request from 'request-promise-native'
import * as temp from 'temp'
import { Config } from './config'

function getDownloadsPath(
  Config: Record<string, any>
  // args?: {
  //   [k: string]: any
  // }
) {
  // if (args.outputDir) {
  //   return args.outputDir
  // }
  return Config.downloads.path
}

export const utils = {
  async checkConnection() {
    const online = await isOnline()

    if (!online)
      throw new Error(c.red('Looks like you are offline, try again later.\n'))
  },

  prompt: {
    parseList(list: string[], favorites: string[] = []) {
      list = _.difference(list, favorites)

      if (!list.length) return favorites
      if (!favorites.length) return list

      return [...favorites, new inquirer.Separator(), ...list] //FIXME: Proper separator width
    },

    async title(message, titles) {
      /* CHECKS */

      const hasSeeders = titles[0] && _.isNumber(titles[0].seeds),
        hasLeechers = titles[0] && _.isNumber(titles[0].peers),
        hasSize = titles[0] && _.isString(titles[0].size),
        hasTime = titles[0] && _.isString(titles[0].time)

      /* TABLE */

      const table: string[][] = []

      titles.forEach((title) => {
        const row: string[] = []

        row.push(utils.torrent.parseTitle(title.title))

        if (Config.torrents.details.seeders && hasSeeders) row.push(title.seeds)
        if (Config.torrents.details.leechers && hasLeechers)
          row.push(title.peers)
        if (Config.torrents.details.size && hasSize)
          row.push(utils.torrent.parseSize(title.size))
        if (Config.torrents.details.time && hasTime) row.push(title.time)

        table.push(row)
      })

      /* COLORS */

      const colors: (undefined | string)[] = [undefined]

      if (Config.torrents.details.seeders && hasSeeders) colors.push('green')
      if (Config.torrents.details.leechers && hasLeechers) colors.push('red')
      if (Config.torrents.details.size && hasSize) colors.push('yellow')
      if (Config.torrents.details.time && hasTime) colors.push('magenta')

      return await prompt.table(message, table, titles, colors)
    },

    async subtitles(message, subtitlesAll) {
      /* TABLE */

      const table: string[][] = []

      subtitlesAll.forEach((subtitles) => {
        const row: string[] = []

        row.push(utils.subtitles.parseTitle(subtitles.filename))

        if (Config.subtitles.details.downloads) row.push(subtitles.downloads)

        table.push(row)
      })

      /* COLORS */

      const colors = [undefined, 'green']

      return await prompt.table(message, table, subtitlesAll, colors)
    },
  },

  torrent: {
    parseTitle(title) {
      return title
        .replace(/\d+(\.\d+)? ?[k|m|g|t]b/gi, '') // Size info
        .replace(/\s\s+/g, ' ') // Multiple spaces
        .replace(/- -/g, '-') // Empty blocks between dashes
        .replace(/\s*-$/, '') // Ending dash
    },

    parseSize(size) {
      try {
        const bytes = filesizeParser(size)

        return prettySize(bytes, true, true, 1)
      } catch (e) {
        return size
      }
    },
  },

  subtitles: {
    parseTitle(title) {
      return title.replace(/\.srt$/i, '') // Extension
    },

    async download({ url, filename }) {
      const content = await request(url),
        stream = Config.downloads.save
          ? fs.createWriteStream(path.join(getDownloadsPath(Config), filename))
          : temp.createWriteStream()

      console.info(content)
      stream.write(content)
      stream.end()

      return stream
    },
  },

  webtorrent: {
    options: {
      appRe: new RegExp(`^--(${Config.outputs.supported.join('|')})$`, 'i'),
      outRe: /^--(o|out)$/i,
      subtitlesRe: /^--subtitles$/i,

      isOptionSet(options: string[], regex) {
        return !!options.find((option) => !!option.match(regex))
      },

      isAppSet(options: string[]) {
        return utils.webtorrent.options.isOptionSet(
          options,
          utils.webtorrent.options.appRe
        )
      },

      isSubtitlesSet(options: string[]) {
        return utils.webtorrent.options.isOptionSet(
          options,
          utils.webtorrent.options.subtitlesRe
        )
      },

      isOutSet(options: string[]) {
        return utils.webtorrent.options.isOptionSet(
          options,
          utils.webtorrent.options.outRe
        )
      },

      setApp(options: string[], app: string) {
        options.push(`--${app.toLowerCase()}`)

        return options
      },

      setSubtitles(options: string[], subtitles: string) {
        options.push('--subtitles', subtitles)

        return options
      },

      setOut(options: string[], output: string) {
        options.push('--out', output)

        return options
      },

      parse(dynamics: string[], defaults: string[] = []) {
        /* ENSURING NO DUPLICATE --APP SWITCH */

        if (
          utils.webtorrent.options.isAppSet(dynamics) &&
          utils.webtorrent.options.isAppSet(defaults)
        ) {
          defaults = defaults.filter(
            (option) => !option.match(utils.webtorrent.options.appRe)
          )
        }

        /* OPTIONS */

        let options = defaults.concat(dynamics)

        /* ENSURING --APP SWITCH */

        if (
          (Config.outputs.available.length ||
            Config.outputs.favorites.length) &&
          !utils.webtorrent.options.isAppSet(dynamics)
        ) {
          options = utils.webtorrent.options.setApp(
            dynamics,
            Config.outputs.favorites[0] || Config.outputs.available[0]
          )
        }

        /* ENSURING --OUT SETTING */

        console.info(options, 'a', dynamics, 'b', defaults)
        if (!utils.webtorrent.options.isOutSet(options)) {
          let outPath = Config.downloads.save
            ? getDownloadsPath(Config)
            : temp.mkdirSync('cliflix-')

          options = utils.webtorrent.options.setOut(options, outPath)
        }

        if (dynamics.includes('--outputDir')) {
          const outPath = dynamics[dynamics.indexOf('--outputDir') + 1]
          options = utils.webtorrent.options.setOut(options, outPath)
        }
        console.info(options)

        /* RETURN */

        return options
      },
    },
  },

  language: {
    codes: [
      'afr',
      'alb',
      'ara',
      'arm',
      'ast',
      'aze',
      'baq',
      'bel',
      'ben',
      'bos',
      'bre',
      'bul',
      'bur',
      'cat',
      'chi',
      'zht',
      'zhe',
      'hrv',
      'cze',
      'dan',
      'dut',
      'eng',
      'epo',
      'est',
      'ext',
      'fin',
      'fre',
      'glg',
      'geo',
      'ger',
      'ell',
      'heb',
      'hin',
      'hun',
      'ice',
      'ind',
      'ita',
      'jpn',
      'kan',
      'kaz',
      'khm',
      'kor',
      'kur',
      'lav',
      'lit',
      'ltz',
      'mac',
      'may',
      'mal',
      'mni',
      'mon',
      'mne',
      'nor',
      'oci',
      'per',
      'pol',
      'por',
      'pob',
      'pom',
      'rum',
      'rus',
      'scc',
      'sin',
      'slo',
      'slv',
      'spa',
      'swa',
      'swe',
      'syr',
      'tgl',
      'tam',
      'tel',
      'tha',
      'tur',
      'ukr',
      'urd',
      'vie',
    ],
    names: [
      'Afrikaans',
      'Albanian',
      'Arabic',
      'Armenian',
      'Asturian',
      'Azerbaijani',
      'Basque',
      'Belarusian',
      'Bengali',
      'Bosnian',
      'Breton',
      'Bulgarian',
      'Burmese',
      'Catalan',
      'Chinese (simplified)',
      'Chinese (traditional)',
      'Chinese bilingual',
      'Croatian',
      'Czech',
      'Danish',
      'Dutch',
      'English',
      'Esperanto',
      'Estonian',
      'Extremaduran',
      'Finnish',
      'French',
      'Galician',
      'Georgian',
      'German',
      'Greek',
      'Hebrew',
      'Hindi',
      'Hungarian',
      'Icelandic',
      'Indonesian',
      'Italian',
      'Japanese',
      'Kannada',
      'Kazakh',
      'Khmer',
      'Korean',
      'Kurdish',
      'Latvian',
      'Lithuanian',
      'Luxembourgish',
      'Macedonian',
      'Malay',
      'Malayalam',
      'Manipuri',
      'Mongolian',
      'Montenegrin',
      'Norwegian',
      'Occitan',
      'Persian',
      'Polish',
      'Portuguese',
      'Portuguese (BR)',
      'Portuguese (MZ)',
      'Romanian',
      'Russian',
      'Serbian',
      'Sinhalese',
      'Slovak',
      'Slovenian',
      'Spanish',
      'Swahili',
      'Swedish',
      'Syriac',
      'Tagalog',
      'Tamil',
      'Telugu',
      'Thai',
      'Turkish',
      'Ukrainian',
      'Urdu',
      'Vietnamese',
    ],

    getCode(name) {
      const { codes, names } = utils.language

      return codes[_.indexOf(names, name)]
    },

    getName(code) {
      const { codes, names } = utils.language

      return names[_.indexOf(codes, code)]
    },
  },
}

/* EXPORT */

export default utils

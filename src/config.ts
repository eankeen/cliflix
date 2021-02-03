import path from 'path'
import os from 'os'

function getCfgFile(): string {
  let cfg = path.join(process.env.HOME as string, '.config')
  if (process.env.XDG_CONFIG_HOME && process.env.XDG_CONFIG_HOME !== '') {
    cfg = process.env.XDG_CONFIG_HOME
  }

  return path.join(cfg, 'cliflix', 'cliflix.json')
}

const defaultConfig = {
  torrentProvider: '',
  torrentProviders: [
    '1337x',
    'ThePirateBay',
    'ExtraTorrent',
    'Rarbg',
    'Torrent9',
    'KickassTorrents',
    'TorrentProject',
    'Torrentz2',
  ],
  moviePlayer: '',
  moviePlayers: [
    'Airplay',
    'Chromecast',
    'DLNA',
    'MPlayer',
    'mpv',
    'VLC',
    'IINA',
    'XBMC',
  ],
  subtitleLanguage: '',
  subtitleLanguages: ['English', 'Spanish', 'German'],
  title: '',
  saveMedia: true,
  skipNoSubtitles: false,
  torrentListLength: 30,
  downloadDir: path.join(os.homedir(), 'Downloads'),
  configFile: getCfgFile(),
  webtorrentOptions: [],
}

defaultConfig.subtitleLanguages = defaultConfig.subtitleLanguages.concat([
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
  // 'English',
  'Esperanto',
  'Estonian',
  'Extremaduran',
  'Finnish',
  'French',
  'Galician',
  'Georgian',
  // 'German',
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
  // 'Spanish',
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
])
export { defaultConfig }

import isOnline from 'is-online'
import c from 'ansi-colors'

export async function checkConnection() {
  const online = await isOnline()

  if (!online)
    throw new Error(c.red('Looks like you are offline, try again later.\n'))
}

export function getDownloadsDir(Config: Record<string, any>) {
  return Config.downloadPath
}

export function isOptionSet(options: string[], regex) {
  return !!options.find((option) => !!option.match(regex))
}

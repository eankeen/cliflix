import isOnline from 'is-online'
import c from 'ansi-colors'

export async function checkConnection() {
  const online = await isOnline()

  if (!online)
    throw new Error(c.red('Looks like you are offline, try again later.\n'))
}

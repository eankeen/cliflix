import temp from 'temp'

import { Config } from '../config'

export const appRegex = new RegExp(
  `^--(${Config.outputs.supported.join('|')})$`,
  'i'
)

export function isOptionSet(options: string[], regex) {
  return !!options.find((option) => !!option.match(regex))
}

export function isAppSet(options: string[]) {
  return isOptionSet(options, appRegex)
}

export function setApp(options: string[], app: string) {
  options.push(`--${app.toLowerCase()}`)

  return options
}
export function setOut(options: string[], output: string) {
  options.push('--out', output)

  return options
}

export function parse(dynamics: string[], defaults: string[] = []) {
  /* ENSURING NO DUPLICATE --APP SWITCH */

  if (isAppSet(dynamics) && isAppSet(defaults)) {
    defaults = defaults.filter((option) => !option.match(appRegex))
  }

  /* OPTIONS */

  let options = defaults.concat(dynamics)

  /* ENSURING --APP SWITCH */

  if (!isAppSet(dynamics)) {
    options = setApp(
      dynamics,
      Config.outputs.favorites[0] || Config.outputs.available[0]
    )
  }

  /* ENSURING --OUT SETTING */
  if (!isOptionSet(options, /^--(o|out)$/i)) {
    let outPath = Config.downloads.save
      ? Config.downloads.path
      : temp.mkdirSync('cliflix-')

    options = setOut(options, outPath)
  }

  if (dynamics.includes('--outputDir')) {
    const outPath = dynamics[dynamics.indexOf('--outputDir') + 1]
    options = setOut(options, outPath)
  }

  return options
}

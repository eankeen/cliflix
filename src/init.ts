import fs from 'fs'
import _ from 'lodash'
import c from 'ansi-colors'
import JSON5 from 'json5'
import temp from 'temp'

import { Config } from './config'

export function initLocalConfig() {
  try {
    const content = fs
      .readFileSync(Config.localConfigPath, { encoding: 'utf8' })
      .toString()

    if (!content || !content.trim()) return

    const localConfig = _.attempt(JSON5.parse, content)

    if (_.isError(localConfig)) {
      console.error(
        c.red(
          `Error reading the configuration file (${c.bold(
            Config.localConfigPath
          )}). Is it properly formatted JSON?`
        )
      )
    } else {
      _.mergeWith(Config, localConfig, (prev, next) => {
        if (!_.isArray(prev) || !_.isArray(next)) return
        return next
      })
    }
  } catch (err) {
    console.error(err)
  }
}

export function initMisc() {
  // temp / signal handlers
  process.on('SIGINT', () => process.exit(1))
  temp.track()
  ;['exit', 'SIGINT', 'SIGTERM'].forEach((ev) => {
    process.on(ev, () => {
      temp.cleanupSync()
    })
  })
}

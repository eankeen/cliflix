import c from 'ansi-colors'
import temp from 'temp'
import type yargs from 'yargs'
import fetch from 'node-fetch'

import prompts, { PromptType } from 'prompts'
import { defaultConfig } from '../config'

export * from './gets'

export async function ensureConnection() {
  try {
    await fetch('https://google.com', {
      method: 'HEAD',
    })
  } catch (err) {
    console.error(c.red('Looks like you are offline. Exiting'))
    process.exit(1)
  }
}

/**
 */
export function mergeConfig(
  argv: yargs.Arguments,
  defaultCfg: typeof defaultConfig
): typeof defaultConfig {
  return Object.assign({}, defaultCfg, argv)
}

/**
  Assumes that property + 's' exists on object
*/
export async function ensureProperty(
  cfg: typeof defaultConfig,
  property: string,
  promptType: PromptType = 'select'
) {
  if (!cfg[property + 's'].includes(cfg[property])) {
    console.info(
      c.yellow(
        `Warning: '${property}' was either not provided or is not valid. Please select one`
      )
    )
    const input = await prompts({
      type: promptType,
      name: 'value',
      message: `Which ${property}?`,
      validate: (input: string) =>
        input.trim() === '' ? 'Input cannot be empty' : true,
      choices: cfg[property + 's'].map((property: string) => ({
        title: property.trim(),
        value: property,
      })),
    })
    cfg[property] = input.value
  }
}

export function init() {
  temp.track()

  process.on('SIGTERM', (sig) => {
    temp.cleanupSync()
    process.exit(1)
  })

  process.on('SIGINT', (sig) => {
    temp.cleanupSync()
    process.exit(1)
  })

  process.on('uncaughtException', (err) => {
    console.error(err)
  })

  process.on('unhandledRejection', (err) => {
    console.error(err)
  })
}

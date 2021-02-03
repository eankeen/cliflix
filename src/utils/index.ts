import path from 'path'
import os from 'os'

import c from 'ansi-colors'
import temp from 'temp'
import fetch from 'node-fetch'
import type yargs from 'yargs'
import onExit from 'signal-exit'

import prompts, { PromptType } from 'prompts'
import { defaultConfig } from '../config'

export * from './gets'

export async function ensureConnection() {
  try {
    await fetch('https://google.com', {
      method: 'HEAD',
    })
  } catch (err) {
    console.error(c.blue('You are offline. Please try again later'))
    process.exit(0)
  }
}

/**
 */
export function mergeConfig(
  argv: yargs.Arguments,
  jsonConfig: typeof defaultConfig,
  defaultCfg: typeof defaultConfig
): typeof defaultConfig {
  return Object.assign({}, defaultCfg, jsonConfig, argv)
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

    if (Object.keys(input).length === 0) {
      console.info(c.red('Error: User input empty. Exiting'))
      process.exit(1)
    }

    cfg[property] = input.value
  }
}

export function resolveHome(filepath: string): string {
  if (filepath[0] + filepath[1] === '~/') {
    return path.join(os.homedir(), filepath.slice(1))
  }
  return filepath
}

export function init() {
  temp.track()

  process.on('SIGTERM', (_sig) => {
    temp.cleanupSync()
    process.exit(1)
  })

  process.on('SIGINT', (_sig) => {
    temp.cleanupSync()
    process.exit(1)
  })

  onExit((_code, _signal) => {
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

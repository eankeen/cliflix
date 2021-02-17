import path from 'path'
import os from 'os'

import c from 'ansi-colors'
import fetch from 'node-fetch'
import type yargs from 'yargs'
import rimraf from 'rimraf'

import prompts, { PromptType } from 'prompts'
import { defaultConfig } from '../config'
import { promisify } from 'util'

export * from './gets'

export async function ensureConnection() {
  try {
    await fetch('https://google.com', {
      method: 'HEAD',
    })
  } catch (err) {
    console.error(c.blue('You are offline. Please try again later'))
    if (isDebug()) console.error(err)

    process.exit(0)
  }
}

/**
 * @description Merges configuration from all sources
 */
export function mergeConfig(
  argv: yargs.Arguments,
  jsonConfig: typeof defaultConfig,
  defaultCfg: typeof defaultConfig
): typeof defaultConfig {
  return Object.assign({}, defaultCfg, jsonConfig, argv)
}

/**
 * @description Ensure a property exists and is valid on the configuration object. Assumes that property + 's' exists on object
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

export async function cleanupTemp(
  subtitleFile: string | null = null
): Promise<void> {
  console.info('TODO: Implement cleanupTemp')
  // const ourTempDir =
  //   (subtitleFile && path.dirname(subtitleFile)) || globalThis.ourTempDir
  // // @ts-ignore
  // await promisify(rimraf)(ourTempDir, {
  //   disableGlob: true,
  // })
}

export function isDebug(): boolean {
  if (process.env?.DEBUG) {
    return true
  }
  return false
}

export function init() {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGHUP']
  for (const signal of signals) {
    process.on(signal, async (_sig) => {
      await cleanupTemp()

      process.exit(1)
    })
  }

  process.on('uncaughtException', (err) => {
    console.error(err)
  })

  process.on('unhandledRejection', (err) => {
    console.error(err)
  })
}

import truncate from 'cli-truncate'
import windowSize from 'window-size'
import c from 'ansi-colors'
import prompts from 'prompts'

import {
  sum,
  max,
  padStart,
  padEnd,
  isPlainObject,
  isString,
} from 'lodash'

function _cliWidth() {
  let CLI_WIDTH = 80
  const size = windowSize.get()
  return size ? size.width : CLI_WIDTH
}

function _cliPageSize() {
  let FULLSCREEN = true
  let PAGE_SIZE = 10
  const size = windowSize.get(),
    height = size ? size.height : PAGE_SIZE + 2

  return Math.min(height - 2, FULLSCREEN ? Infinity : PAGE_SIZE)
}

async function IHList(message: string, list: any[], fallback?) {
  //FIXME: list should be string[] | object[]

  /* TRUNCATE */

  const maxWidth = _cliWidth() - 3 // Accounting for inquirer's characters

  list.map((entry) => {
    if (!isString('string')) {
      return truncate(entry.trim(), maxWidth)
    } else if (isPlainObject(entry) && entry.name) {
      entry.name = truncate(entry.name.trim(), maxWidth)
    }
    return entry
  })

  /* END OF LIST */
  const pageSize = _cliPageSize()
  if (list.length > pageSize) list.push('\n')

  /* LIST */
  const result = (
    await prompts({
      type: 'autocomplete',
      name: 'input',
      message: message,
      choices: list.map(item => ({
        title: item.name,
        value: item
      }))
    })
  )?.input

  return result.value
}

export async function customTablePrompt(
  message: string,
  table: string[][],
  values: any[],
  colors: any[] = [],
  fallback?
): Promise<any> {
  /* TRUNCATE */
  const maxWidth = _cliWidth() - 7 // Accounting for inquirer's characters and table's characters
  table.map((row) => [truncate(row[0], maxWidth), ...row.slice(1)])

  /* FORMATTING */
  if (table[0].length > 1) {
    /* MAX LENGHTS  */
    const maxLenghts = table[0].map((val, index) =>
        max(table.map((row) => String(row[index]).length))
      ),
      overflowColumn = maxLenghts.findIndex(
        (length, index) =>
          sum(maxLenghts.slice(0, index + 1)) + index * 4 > maxWidth
      ),
      maxColumn =
        overflowColumn >= 0
          ? Math.max(0, overflowColumn - 1)
          : maxLenghts.length - 1

    /* FILTERING */
    table = table.map((row) => row.slice(0, maxColumn + 1))

    /* PADDING */
    table = table.map((row) => {
      return row.map((val, index) => {
        const padFN = index > 0 ? padStart : padEnd
        return padFN(val, maxLenghts[index])
      })
    })

    /* COLORIZE */
    if (colors.length) {
      table = table.map((row) => {
        return row.map((val, index) => {
          const color = colors[index]
          if (!color) return val
          return c[color](val)
        })
      })
    }

    /* LIST */
    const list = table.map((row, index) => ({
      name: row.length > 1 ? `| ${row.join(' | ')} |` : row[0],
      short: row[0].trim(),
      value: values[index],
    }))

    return await IHList(message, list, fallback)
  }
}

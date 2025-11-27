import { packageJson } from './package'
import picocolors from 'picocolors'
const { green } = picocolors

export const printCli = () => {
  console.log('')
  console.log(
    green(`\
██████╗ ██████╗ ███████╗
██╔══██╗██╔══██╗██╔════╝
██████╔╝██║  ██║███████╗
██╔══██╗██║  ██║╚════██║
██║  ██║██████╔╝███████║
╚═╝  ╚═╝╚═════╝ ╚══════╝
-------------------------
Version: ${packageJson.version}
Author: ${packageJson.author}
Github: ${packageJson.repository.url}
-------------------------
`)
  )
}

export const printRectangleWithCenteredText = (
  text: string,
  borderChar = '*',
  paddingX = 2,
  paddingY = 1
) => {
  const textWidth = text.length
  const totalWidth = 2 * (1 + paddingX) + textWidth
  const topBottomBorder = borderChar.repeat(totalWidth)
  console.log(topBottomBorder)

  const emptyRow = borderChar + ' '.repeat(totalWidth - 2) + borderChar
  for (let i = 0; i < paddingY; i++) {
    console.log(emptyRow)
  }

  const sidePadding = ' '.repeat(paddingX)
  const textLine = borderChar + sidePadding + text + sidePadding + borderChar

  console.log(textLine)

  for (let i = 0; i < paddingY; i++) {
    console.log(emptyRow)
  }
  console.log(topBottomBorder)
}

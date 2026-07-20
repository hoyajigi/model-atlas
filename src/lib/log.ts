const write = (stream: NodeJS.WriteStream, msg: string): void => {
  stream.write(`${msg}\n`)
}

export const info = (msg: string): void => write(process.stdout, msg)
export const warn = (msg: string): void => write(process.stderr, `WARN  ${msg}`)
export const error = (msg: string): void => write(process.stderr, `ERROR ${msg}`)

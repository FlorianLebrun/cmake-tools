
export type EnvVars = { [name: string]: string }

export const command: {
  exec(command: string, cwd: string, env: EnvVars): number
  call(program: string, args: string[], cwd, env: EnvVars): number
  exit(status: number)
}

export const directory: {
  exists(path: string): boolean
  filenames(path: string): string[]
  copy(src: string, dest: string)
  make(path: string)
  remove(path: string)
  clean(path: string)
}

export const file: {
  exists(path: string): boolean
  copy: {
    toFile(src: string, dest: string): string
    toDir(src: string, dest: string): string
  }
  move: {
    toFile(src: string, dest: string): string
    toDir(src: string, dest: string): string
  }
  read: {
    json(path: string): any
    text(path: string): string
  }
  write: {
    json(path: string, data: any)
    text(path: string, data: string)
  }
}

export const print: {
  log(...args)
  debug(...args)
  warning(...args)
  error(...args)
  success(...args)
  title(...args)
  info(...args)
  exception(exception: Error)
}

export type ArgInfosType = {
  name: string
  type: string
  isArray?: boolean
  required?: boolean
}

export type ArgvInfosType = {
  [name: string]: ArgInfosType
}

export function script(program: (argv: any[]) => void, argvInfos: ArgvInfosType)


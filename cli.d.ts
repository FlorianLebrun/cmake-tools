
export const directory: {
  exists(path: string): boolean
  filenames(path: string): string[]
  copy(src: string, dest: string): void
  make(path: string): string // Return the absolute path
  remove(path: string): void
}
const Path = require("path")
const process = require("process")
const child_process = require("child_process")
const fs = require("fs")

const command = {
  exec(command, cwd, env) {
    const code = child_process.execSync(command, {
      cwd, env, stdio: ['inherit', 'inherit', 'inherit']
    })
    if (code < 0) throw new Error(`Commannd '${command}' has failed with code ${code}.`)
    return code
  },
  exit(code) {
    process.exit(code)
  },
}

const file = {
  exists(path) {
    return fs.existsSync(path)
  },
  copy: {
    toFile(src, dest) {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    },
    toDir(src, dest) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    }
  },
  move: {
    toFile(src, dest) {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
    toDir(src, dest) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
  },
  read: {
    json(path, data) {
      try { return JSON.parse(fs.readFileSync(path).toString()) }
      catch (e) { }
    },
    text(path, data) {
      try { return fs.readFileSync(path).toString() }
      catch (e) { }
    }
  },
  write: {
    json(path, data) {
      fs.writeFileSync(path, JSON.stringify(data, null, 2))
    },
    text(path, data) {
      fs.writeFileSync(path, Array.isArray(data) ? data.join("\n") : data.toString())
    }
  },
}

const directory = {
  exists(path) {
    return fs.existsSync(path)
  },
  filenames(path) {
    try { return fs.readFileSync(path) || [] }
    catch (e) { return [] }
  },
  copy(src, dest) {
    directory.make(dest)
    if (fs.lstatSync(src).isDirectory()) {
      const files = fs.readdirSync(src)
      files.forEach(function (filename) {
        const srcfile = Path.join(src, filename)
        const dstfile = Path.join(dest, filename)
        if (fs.lstatSync(srcfile).isDirectory()) {
          copyDirSync(dstfile, srcfile)
        }
        else {
          copyFileSync(dstfile, srcfile)
        }
      })
    }
  },
  make(path) {
    if (path && !fs.existsSync(path)) {
      directory.make(Path.parse(path).dir)
      fs.mkdirSync(path)
    }
    return path
  },
  remove(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (entry) {
        var entry_path = Path.join(path, entry)
        if (fs.lstatSync(entry_path).isDirectory()) {
          removeDirSync(entry_path)
        }
        else {
          try { fs.unlinkSync(entry_path) }
          catch (e) { }
        }
      })
      fs.rmdirSync(path)
    }
  }
}

function script(callback, argvInfos) {
  try {
    const argv = {}
    let key = "0"
    for (let i = 0; i < process.argv.length; i++) {
      const arg = process.argv[i]
      if (arg.startsWith("--")) argv[key = arg.substr(2)] = undefined
      else if (Array.isArray(argv[key])) argv[key].push(arg)
      else if (argv[key] === undefined) argv[key] = arg
      else argv[key] = [argv[key], arg]
    }
    for (const key in argvInfos) {
      const info = argvInfos[key]
      let value = argv[key]
      try {
        if (value !== undefined) {
          function checkScalar(value) {
            if (info.type === "string") {
              if (typeof value !== "string") throw new Error(`shall be a string`)
            }
            else if (info.type === "number") {
              value = parseFloat(value)
            }
            else if (info.type === "object") {
              value = JSON.parse(value)
            }
            else if (info.type === "boolean") {
              value = value.toLowerCase()
              if (value === "true" || value === "on" || value === "1") value = true
              else if (value === "false" || value === "off" || value === "0") value = false
              else throw new Error(`shall be a boolean`)
            }
            return value
          }
          if (Array.isArray(value)) {
            value = value.map(checkScalar)
            if (info.isArray !== true) throw new Error("cannot be an array")
          }
          else {
            value = checkScalar(value)
            if (info.isArray === true) value = [value]
          }
        }
        else {
          if (info.required === true) throw new Error(`is required`)
          else if (info.default !== undefined) value = info.default
          else if (info.type === "string") value = ""
          else if (info.type === "number") value = 0
          else if (info.type === "object") value = {}
          else if (info.type === "boolean") boolean = false
        }
        argv[key] = value
      }
      catch (e) {
        throw new Error(`argument '${key} invalid: ${e.message}`)
      }
    }
    callback(argv)
  }
  catch (e) {
    console.error(e.message)
    process.exit(-1)
  }
}

module.exports = { script, command, file, directory }

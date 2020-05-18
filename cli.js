const Path = require("path")
const Process = require("process")
const ChildProcess = require("child_process")
const fs = require("fs")

const command = {
  exec(command, cwd, env) {
    const status = ChildProcess.execSync(command, {
      cwd, env, stdio: ['inherit', 'inherit', 'inherit']
    })
    if (status < 0) {
      throw new Error(`Command '${command}' has failed with status code ${status}.`)
    }
    return status
  },
  call(program, args, cwd, env) {
    const result = ChildProcess.spawnSync(program, args, {
      cwd, env, stdio: ['inherit', 'inherit', 'inherit']
    })
    if (result.error) {
      throw new Error(`Command '${program} ${args.join(" ")}' has crashed: ${result.error}.`)
    }
    else if (result.status < 0) {
      throw new Error(`Command '${program} ${args.join(" ")}' has failed with status code ${status}.`)
    }
    return result.status
  },
  exit(status) {
    Process.exit(status)
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
    json(path) {
      try { return JSON.parse(fs.readFileSync(path).toString()) }
      catch (e) { }
    },
    text(path) {
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
  remove(path) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  },
}

const directory = {
  exists(path) {
    return fs.existsSync(path)
  },
  filenames(path) {
    try { return fs.readdirSync(path) || [] }
    catch (e) { return [] }
  },
  copy(src, dest) {
    directory.make(dest)
    if (fs.existsSync(src) && fs.lstatSync(src).isDirectory()) {
      const files = fs.readdirSync(src)
      directory.make(dest)
      files.forEach(function (filename) {
        const srcfile = Path.join(src, filename)
        const dstfile = Path.join(dest, filename)
        if (fs.lstatSync(srcfile).isDirectory()) {
          directory.copy(srcfile, dstfile)
        }
        else {
          fs.copyFileSync(srcfile, dstfile)
        }
      })
    }
  },
  make(path) {
    if (path && !fs.existsSync(path)) {
      directory.make(Path.parse(path).dir)
      fs.mkdirSync(path)
    }
  },
  remove(path) {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
      fs.readdirSync(path).forEach(function (entry) {
        var entry_path = Path.join(path, entry)
        if (fs.lstatSync(entry_path).isDirectory()) {
          directory.remove(entry_path)
        }
        else {
          try { file.remove(entry_path) }
          catch (e) { }
        }
      })
      fs.rmdirSync(path)
    }
  },
  clean(path) {
    directory.remove(path)
    directory.make(path)
  },
}

const colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  Black: "\x1b[30m",
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[35m",
  Cyan: "\x1b[36m",
  White: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};
function printColored(colorTag) {
  return function (...args) {
    console.log(colorTag, ...args, colors.Reset);
  }
}
const print = {
  log: printColored(colors.White),
  debug: printColored(colors.Magenta),
  warning: printColored(colors.Magenta),
  error: printColored(colors.Bright + colors.Red),
  success: printColored(colors.Green),
  title: printColored(colors.Cyan),
  info: printColored(colors.Yellow),
  exception: function (e) {
    print.error(e.message);
    printColored(colors.Red)(e.stack);
  },
}

function script(callback, argvInfos) {
  try {
    const argv = {}
    let key = "0"
    for (let i = 0; i < Process.argv.length; i++) {
      const arg = Process.argv[i]
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
        throw new Error(`argument '${key}' invalid: ${e.message}`)
      }
    }
    callback(argv)
  }
  catch (e) {
    //print.error(e.message)
    print.exception(e)
    print.error(" >>> Failed script:", Process.argv.join(" "))
    Process.exit(-1)
  }
}

module.exports = { script, print, command, file, directory }

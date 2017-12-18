const fs = require('fs')
const { Writable } = require('stream')
const compile = require('./compile')

class StringWritable extends Writable {
  constructor () {
    super()
    this.output = ''
  }
  _write (chunk, encoding, callback) {
    const str = encoding === 'buffer' ? chunk.toString('utf8') : chunk
    this.output += str
    callback()
  }
  toString () {
    return this.output
  }
}

function getArgv () {
  return require('yargs')
    .usage('Usage: $0 [-i filename] [-o filename]')
    .option('debug', {
      alias: 'd',
      boolean: true,
      describe: 'debug mode.'
    })
    .option('output', {
      alias: 'o',
      describe: 'output path. standard output when omitted.'
    })
    .option('exec', {
      alias: 'e',
      boolean: true,
      describe: 'execute program.'
    }).argv
}

function getOutput (argv) {
  if (argv.exec) {
    return new StringWritable()
  } else if (argv.output) {
    return fs.createWriteStream(argv.output)
  } else {
    return process.stdout
  }
}

function readInput (stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    stream.on('error', err => {
      reject(err)
    })
  })
}

async function runCompile (input, output, argv) {
  const text = await readInput(input)
  const code = compile(text, { debug: argv.debug })
  output.write(code)
}

async function main () {
  const argv = getArgv()

  const output = getOutput(argv)

  if (argv._.length === 0) {
    await runCompile(process.stdin, output, argv)
  } else {
    for (const filename of argv._) {
      const input = fs.createReadStream(filename)
      await runCompile(input, output, argv)
    }
  }

  if (argv.exec) {
    eval(output.toString()) // eslint-disable-line no-eval
  }
}

main()

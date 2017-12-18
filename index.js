const fs = require('fs')
const compile = require('./compile')

function getArgv () {
  return require('yargs')
    .usage('Usage: $0 [-i filename] [-o filename]')
    .option('input', {
      alias: 'i',
      default: '-',
      describe: 'input path. "-" indicates standard input.'
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

function getInput (argv) {
  return argv.input === '-' ? process.stdin : fs.createReadStream(argv.input)
}

function getOutput (argv) {
  return argv.output ? fs.createWriteStream(argv.output) : process.stdout
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

async function main () {
  const argv = getArgv()

  const input = getInput(argv)
  const text = await readInput(input)

  const code = compile(text)

  if (argv.exec) {
    eval(code) // eslint-disable-line no-eval
  } else {
    const output = getOutput(argv)
    output.write(code)
  }
}

main()

const marked = require('marked')
const fs = require('fs')

function getArgv() {
    return require('yargs')
        .usage('Usage: $0 [-i filename] [-o filename]')
        .option('input', {
            alias: 'i',
            default: '-',
            describe: 'input path. "-" indicates standard input',
        })
        .option('output', {
            alias: 'o',
            describe: 'output path. standard output when omitted',
        })
        .argv
}

function getInput(argv) {
    return argv.input === '-'
        ? process.stdin
        : fs.createReadStream(argv.input)
}

function getOutput(argv) {
    return argv.output
        ? fs.createWriteStream(argv.output)
        : process.stdout
}

function readInput(stream) {
    return new Promise((resolve, reject) => {
        const chunks = []
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'))
        })
        stream.on('error', (err) => {
            reject(err)
        })
    })
}

function isRootMacro(text) {
    return /^<<.+>>$/.test(text)
}

function isMacro(text) {
    return /^<[^<][^>]*>$/.test(text)
}

function extractSubject(text) {
    return /^<([^<][^>]*)>$/.exec(text)[1]
}

function parseRootChunk(text) {
    const subjects = []
    const regex = /<([^<\n][^>\n]*)>/g
    while (match = regex.exec(text)) {
        subjects.push(match[1])
    }
    return subjects
}

function collectCode(tokens) {
    const STATE_INIT = 0
    const STATE_IN_ROOT = 1
    const STATE_IN_MACRO = 2

    const chunks = {
        root: [],
        codeTable: {},
    }

    let state = STATE_INIT
    let subject = ''

    for (const token of tokens) {
        if (token.type === 'heading') {
            if (isRootMacro(token.text)) {
                state = STATE_IN_ROOT
            } else if (isMacro(token.text)) {
                state = STATE_IN_MACRO
                subject = extractSubject(token.text)
                if (!chunks.codeTable[subject]) {
                    chunks.codeTable[subject] = []
                }
            }
        } else if (token.type === 'code' && token.lang === 'javascript') {
            if (state === STATE_IN_ROOT) {
                chunks.root.push(token.text)
            } else if (state === STATE_IN_MACRO) {
                chunks.codeTable[subject].push(token.text)
            }
        }
    }

    return chunks
}

function concatCode(chunks) {
    const subjects = parseRootChunk(chunks.root.join('\n'))

    return subjects.reduce((acc, subject) => {
        const code = chunks.codeTable[subject].join('\n')
        return acc + code + '\n'
    }, '')
}

function compile(text) {
    const tokens = marked.lexer(text)
    const chunks = collectCode(tokens)
    return concatCode(chunks)
}

async function main() {
    const argv = getArgv()

    const input = getInput(argv)
    const text = await readInput(getInput(argv))

    const code = compile(text)

    const output = getOutput(argv)
    output.write(code)
}

main()


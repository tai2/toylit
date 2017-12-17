const marked = require('marked')

function isRootMacro (text) {
  return /^<<.+>>$/.test(text)
}

function isMacro (text) {
  return /^<[^<][^>]*>$/.test(text)
}

function extractSubject (text) {
  return /^<([^<][^>]*)>$/.exec(text)[1]
}

function parseRootChunk (text) {
  const subjects = []
  const regex = /<([^<\n][^>\n]*)>/g
  for (;;) {
    const match = regex.exec(text)
    if (!match) {
      break
    }
    subjects.push(match[1])
  }
  return subjects
}

function collectCode (tokens) {
  const STATE_INIT = 0
  const STATE_IN_ROOT = 1
  const STATE_IN_MACRO = 2

  const chunks = {
    root: [],
    codeTable: {}
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

function concatCode (chunks) {
  const subjects = parseRootChunk(chunks.root.join('\n'))

  return subjects.reduce((acc, subject) => {
    const code = chunks.codeTable[subject].join('\n')
    return acc + code + '\n'
  }, '')
}

function compile (text) {
  const tokens = marked.lexer(text)
  const chunks = collectCode(tokens)
  return concatCode(chunks)
}

module.exports = compile

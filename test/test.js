import test from 'ava';
import fs from 'fs';
import compile from '../compile'

test('comile function results expected code', t => {
  const text = fs.readFileSync('./test/complex.md', 'utf8')
  const code = compile(text)
  const expected = `console.log('elem 1')
console.log('elem 2')
console.log('elem 3')
`
  t.is(code, expected);
});


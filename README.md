Here is a markdown text: `sample.md`

```markdown
# Sample document

## <<Structure>>

```javascript
<Element 1>
<Element 2>
```

## <Element 1>

```javascript
console.log('elem 1')
```

## <Element 2>

```javascript
console.log('elem 2')
```

```

And run the command.

```
$ cat sample.md | toylit
console.log('elem 1')
console.log('elem 2')
```

It produces a JavaScript program!

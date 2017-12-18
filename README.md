Here is a markdown text: `sample.md`

    # Sample document

    ## &* Structure

    ```javascript
    & Element 1
    & Element 2
    ```

    ## & Element 1

    This is a code chunk.

    ```javascript
    console.log('elem 1')
    ```

    ## & Element 2

    And another one.

    ```javascript
    console.log('elem 2')
    ```

And run the command.

```
$ cat sample.md | toylit
console.log('elem 1')
console.log('elem 2')
```

It produces a JavaScript program.

```
$ cat sample.md | toylit --exec
elem 1
elem 2
```

Or even execute it directly!

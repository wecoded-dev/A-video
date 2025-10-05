# Java Markdown CLI (Flexmark)

A minimal Java CLI that reads Markdown from stdin or a file and outputs HTML. Uses Flexmark.

## Build

```
javac -cp lib/flexmark-all-0.64.8.jar -d out src/Main.java
```

## Run

```
# From file
java -cp out:lib/flexmark-all-0.64.8.jar Main README.md

# From stdin
cat README.md | java -cp out:lib/flexmark-all-0.64.8.jar Main
```

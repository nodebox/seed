# Cheat Sheet

## Basic Elements

A **block** contains a set of options which Seed can pick from:

```seed
root:
- Dave
- Edna
- Mark
```

An **option** starts with `"- "` and can continue over multiple lines as long as it has 2 spaces in front of it:

```seed
root:
- This is a very long piece of text.
  Note that no extra spaces are inserted between.
   We need to add them ourselves
   by appending another space to the line.
```

A **token** will be replaced with a random choice from the block it refers to:

```seed
root:
- Welcome to {{ place }}!

place:
- Paris
- New Orleans
- Johannesburg
- Antwerp
```

## Repetition

Tokens can be repeated by adding a multiply (`*`) symbol:

```seed
root:
- {{ letter * 10 }}

letter:
- A
- B
- C
- D
```

You can also use [recursion](/docs/recursion) so a block includes itself:

```seed
root:
- A {{ root }}
```

## Ranges

You can pick from a numeric range using `..`:

```seed
root:
- You are {{ 5..95 }} years old.
```

You can also use this for character ranges:

```seed
root:
- {{ A..Z }}
```

Of course you can combine that with repetitions:

```seed
root:
- {{ A..Z * 10 }}
```

## Filters

To change the result of a token add a filter using the `|`. A filter can be used to transform the text:

```seed
root:
- {{ stop_word|sentence }} it begins {{ stop_word }} it ends.

stop_word:
- so
- and thus
- as such
```

Supported filters are `upper`, `lower`, `title` and `sentence`.

## SVG Graphics

[Documentation](/docs/generating-graphics) | [SVG Reference](https://developer.mozilla.org/en-US/docs/Web/SVG)

To create graphics use a `<svg>` tag containing width and height attributes:

```seed
root:
- <svg width=100 height=100>{{ shape * 20 }}</svg>

shape:
- <rect x={{ 0..100 }} y={{ 0..100 }} width=5 height=5 />
```

To start in the middle of the composition, add a group with a transform to half the width/height:

```seed
root:
- <svg width=100 height=100>
    <g transform="translate(50 50)">{{ shape * 25 }}</g>
  </svg>

shape:
- <circle cx=0 cy=0 r={{ 0..50 }} fill=none stroke=black />
```

A **background** is a rectangle with width / height set to 100%:

```seed
root:
- <svg width=100 height=100>{{ background }}{{ shape }}</svg>

background:
- <rect width=100% height=100% fill=#ddd />

shape:
- <polygon points="10,80 50,10 90,80" />
```

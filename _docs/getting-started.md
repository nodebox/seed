# Getting Started

Seed generates new, random content based on a set of _rules_ you define. These rules always generate text. But because we're on the web this text can also be HTML code or SVG graphics. Seed uses a system called a [context-free grammar](https://en.wikipedia.org/wiki/Context-free_grammar).

Here is a simple example that generates "thank you" notes (it is also displayed when [creating a new sketch](/sketch)):

<iframe src="/embed/-L0tnl8CMxUtqA9_cIKd"></iframe>

You can generate new variations using the "Generate" button (try it now!). Each variation has a unique _seed_, which consists of three letters. You can browse through the different variations using the arrows next to the seed value in the toolbar.

Saving in Seed is easy: each time you save a sketch it generates a new, unique URL that you can share. Other people can make variations and save their versions. This makes it easy to experiment. We're adding user logins soon so you can save your favorite sketches to your account.

## The Structure of a Sketch

A sketch in Seed consists of a number of "blocks". Each block starts with a name ending in a ":", and a list of options. If Seed encounters a `{{ token }}` it will look for a block with this name, pick an option from the list and replace the token with the selected option.

The `root:` element is special. Seed will always look for a `root:` element when generating new content. This is the _start_ of your document. Beneath this line there are two options that start with a `-`. When generating content, Seed will _choose one of these options_. The more options you give, the more freedom the system has to choose between.

> Create a list of options and Seed will choose one of them at random.

Each time Seed encounters this list it can make a different choice. The choice is random, but the variation is based on the _random seed_. We'll talk about random seeds later.

If this is all the system could do, we would be limited. We need a way to replace _parts_ of the text with other options. That's where _tokens_ come in.

If we look at the first line below `root:` we see that it has these special `{{ }}` brackets in the middle of the sentence. We call these **tokens**: special markers that signal to Seed that we want to replace them with random content. Which content depends on what's between the tokens: the _identifier_. In this case the identifier is a name. We're going to lookup this name, choose from one of its options and place the result back into the text.

> Use `{{ tokens }}` if you want Seed to fill in a random option.

## An Example

Let's run through an example. We'll pretend we are the computer and will try to evaluate this sketch and return a result. First, we'll take a look at the root:

```
root:
- Dear {{ giver }}, thank you for the {{ object }}.
- Hey {{ giver }}, thanks for the {{ object }}!
```

Here, we can pick two options. This selection happens at random, so let's say we picked the first option. Now our text looks like this:

```
Dear {{ giver }}, thank you for the {{ object }}.
```

(Note that the `-` in the beginning is not part of the text and is stripped away.)

We run through this piece of text, looking for tokens that we can replace. The first token we encounter is `{{ giver }}`. We look for a block starting with `giver:` and find it in the document:

```
giver:
- Aunt Emma
- Dave and Edna
- Uncle Bob
```

The `giver` block has three options so again we pick one at random. Here, we choose option 3: "Uncle Bob". We place this in the text. We now have:

```
Dear Uncle Bob, thank you for the {{ object }}.
```

We still have one replacement to do, the `{{ object }}`. Again we go looking for a `object:` block:

```
object:
- purple vase
- golden retriever
- dishwasher
```

Here we pick option 2, the golden retriever. Note that this block could _also_ have tokens! For example we could imagine that we want the material to be random, so we could say we don't just have a golden retriever, but a `{{ material }} retriever`. `material` is an identifier that points to a new block that has `golden`, `silver`, `bronze`, and so on.

We now have everything to assemble the final sentence:

```
Dear Uncle Bob, thank you for the golden retriever.
```

## More Complex Examples

This is enough to do simple text generation. By making our replacements more complex, we can create huge grammar files. For example here is a Immanuel Kant philosophy generator:

<iframe src="/embed/-L0jT5zaERgBPaf3P6LP"></iframe>

Note that this uses the exact same system as in this simple example. We just have _much more_ options to choose from, and each of those contain choices as well, and so on.

It's interesting to see how this is built up. Because we want the text to have multiple sentences, we render a number of `{{ sentence }}` tokens in the root:

```
root:
- <p>{{ sentence }}</p> <p>{{ sentence }}</p> <p>{{ sentence }}</p>
- ...more content here...
```

Each of those sentence tokens will be replaced with a random sentence. Every time we evaluate this the system will choose a different option. Because this is random it's possible that the system will accidentally pick the same one twice. Just choose a different variation if that happens.

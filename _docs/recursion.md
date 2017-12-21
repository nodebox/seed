# Recursion

In recursion, one part is defined in terms of itself. There are many examples of recursion in nature: think about trees, where smaller branches mirror the large-scale structure of the tree. Or think about the Romanesco broccoli, a vegetable that has a beautiful recursive shape.

![The fractal shape of a Romanesco broccoli](/_docs/romanesco.jpg)<br>
Image by [Jon Sullivan](https://commons.wikimedia.org/wiki/File:Fractal_Broccoli.jpg)

In PCG we can build our own recursive shapes by letting a block refer to itself. This automatically creates multiple copies of the shape. Here's a simple example:


<iframe src="/embed/-L0tODa6VYOxbW1yFq2D" width="100%" height="400"></iframe>

If you look closely you can see that at the end of the `circle:` block we call `circle:`again! So a {{ circle }} expands to a `<circle.../>` tag and a {{ circle }}, which expands to a `<circle.../>` tag and a {{ circle }}, which expands to... you get the idea. This is a recursive process: a system that calls itself. PCG has a mechanism to stop at some point (by default after 50 iterations), otherwise our expansion would never end and the system would crash.

Although this example certainly works to get many circles on screen, we would be better of to just use the multiply operator (`*`) as we've seen in the [generating graphics](/docs/graphics) chapter. Things get more interesting if every recursive shape changes a little bit: becomes bigger or smaller, rotates, etc. Like this:

<iframe src="/embed/-L0tQmnP25Y4AMejZ1FW" width="100%" height="400"></iframe>

Let's go through this example to see what's happening. We start by setting up our basic shape in the root block. Then we call `{{ shape }}` which does the actual work. In `shape:` we call the `rect` block. This is just a simple rect, however note that it is centered around the middle: its width and height is set to 100, and its X/Y position is set to -50, meaning it will be drawn at the center (note that we translate our canvas in the root so we don't actually show this from the top-left corner). We do this so it becomes easier to handle rotations.

The `rect:` block only draws a single rect. But the `shape:` block also creates a `<g>` group that contains a transform. Inside of that group we draw the shape itself. This is the recursive part: a shape consists of a rectangle, and a transformed shape, which consists of a rectangle and a transfromed shape, which...

Each copy will have the transformation applied to it, so each copy will be rotated 5 degrees, scaled to 90%, and shifted a bit to the bottom-right. Change the values in the transformation to see how they affect the shapes.

We can use this principle to generate many interesting recursive shapes, like trees:

<iframe src="/embed/-L0tPtYTqxVpgbCzPcTY" width="100%" height="400"></iframe>

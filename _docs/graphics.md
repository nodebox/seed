# Generating Graphics

**Seed generates only text.** It has no knowledge of graphical shapes, composition or color. However, we can "cheat" the system by realizing that everything we see on a web page is also text: it's just HTML code. And not just HTML code: webpages can also integrate [SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics), which is short for Scaleable Vector Graphics. In other words, _to generate graphics, we will generate SVG code_.

Here's a small example:

<iframe src="/embed/-L0tY6Jn8y3IN3nq3onZ"></iframe>

Let's look at the actual code we generate. The `root:` block has only one option which generates a `<svg>` tag. This tag contains properties for the `width` and `height` of the composition. We choose 300 here but you might choose different values depending on the size of your screen. The width and height are not absolutely required but not setting them will result in a tiny SVG document, which is not really useful. Inside of this tag we generate a `{{ circle * 50 }}`. This expands to 50 `{{ circle }}` blocks. In other words, we generate 50 circles.

The `circle:` block consists of a single option with a [&lt;circle&gt;](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle) tag. This a standard SVG element that has a number of properties:

* **cx** (short for "center X") defines the horizontal position of the center of the circle.
* **cy** (short for "center Y") defines the vertical position of the center of the circle.
* **r** (short for "radius") defines the radius of the circle. Note that this is the radius — _not_ the diameter — so the circle will be twice as big as this.
* **fill** defines the fill color of the circle. There are many ways in which we can [specify colors](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes): using predefined names, through RGB or HSL values, or using hexadecimal codes. If you're familiar with CSS colors, this is exactly the same.
* **stroke** defines the stroke color of the circle. We use a stroke color here so the overlapping circles don't turn into a big red blob. If we want we can also specify the `stroke-width` to set the line width of the stroke.

What else can we generate? SVG has support for lines, paths, rectangles, circles and text. We will show some examples below but you can easily find [more documentation on SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Basic_Shapes).

## Lines

Here's an example with the `<line>` element:

<iframe src="/embed/-L0tYx0M59tsxmPkFBhs"></iframe>

A `<line>` has the following attributes:

* **x1**: the starting horizontal position of the line.
* **y1**: the starting vertical position of the line.
* **x2**: the ending horizontal position of the line.
* **y2**: the ending vertical position of the line.

A line has no fill color but the stroke argument is **required** (otherwise the line won't show up).

Note that this also shows how to set a "background": just draw a rectangle the size of your composition. The easiest way is to set the width and height to 100%.

## Rectangles

We've already seen rectangles used as the background element. Here we use them to create a "city":

<iframe src="/embed/-L0tc3J7ipeCyDsc1JTa"></iframe>

A `<rect>` has the following attributes:

* **x**: the horizontal position of the rectangle.
* **y**: the vertical position of the rectangle.
* **width**: the width of the rectangle.
* **width**: the height of the rectangle.
* **rx**: the horizontal corner radius of the rectangle.
* **ry**: the vertical corner radius of the rectangle (if you leave this off it will be the same as `rx`).

Note that rectangles (and `<ellipse>`s) always draw from the top left coordinate.

In this example we created rectangles for the building anchored to the bottom of the composition. However we can't set the y value fixed to 300 and use negative heights for the builing. Instead we use a CSS `transform` to rotate the entire composition 180 degrees so it's flipped upside-down.

## Circles

Circles are a bit different since we specify their position from the center.

<iframe src="/embed/-L0tlxjGBhmKHk6pTYRC"></iframe>

This example uses two tricks:

* It uses a [SVG viewBox](https://www.sarasoueidan.com/blog/svg-coordinate-systems/#viewbox-syntax) to make the coordinate space smaller. Even though the SVG size is 300 by 300, we use coordinates between 0 and 10.
* To specify the radius it uses values between 0.1 and 0.9. To do that we start the value with "0." and then append the expression `{{ 1..9 }}`. This expands to `0.1` or `0.5` and so on.

A `<circle>` has the following attributes:

* **cx**: the horizontal position of the _center_ of the circle.
* **cy**: the vertical position of the _center_ of the circle.
* **r**: the radius of the circle. Note that this is the radius — _not_ the diameter — so the circle will be twice as big as this.

## Polygons

Polygons represent a closed shape defined by a set of points.

<iframe src="/embed/-L0ybOOZnPzMk4jY5mtB"></iframe>

The `points` attribute of a polygon contains pairs of X/Y coordinates, e.g. `10,80 50,10 90,80`. To generate a random list we use an extra space in front of a coordinate pair to separate them (otherwise we would get `10,8050,1090,80`).

A `<polygon>` has the following attributes:

* **points**: the list of coordinates in the form `x1,y1 x2,y2 x3,y3 ...`. The shape is closed automatically.

## Path

Path is the most versatile and complex shape. It can generate straight lines, quadratic béziers, cubic béziers, and arcs. It uses an efficient description that uses single-letter commands and coordinates, e.g. `M20 40` means "move to coordinate 20,40". Coordinates can be specified in both _absolute_ and _relative_ mode using uppercase and lowercase letters, respectively.

Here's an example using relative coordinates:

<iframe src="/embed/-L0yhos5xKBplkyguQTm"></iframe>

Try to decrease the amount of paths generated (change `{{ path * 300 }}` to `{{ path * 3 }}`) to see how this works. Every path is one line, going down. To generate a line, we first move to the center using the `M` move to command: `M150,5`. We then use relative line command "`l`" to move down. Here we change the X position randomly but never the Y position. Y always goes down with a constant offset, but X can fluctuate, resulting in overlapping lines creating this structure.

Here's an example that uses absolute coordinates. Again, try changing `{{ path * 150 }}` to a smaller value and gradually increasing it to see what's going on:

<iframe src="/embed/-L0yjzqujMm8H79NoJAh"></iframe>

Here again we use a small viewBox to limit the coordinates to a grid.

A `<path>` has only one attribute:

* **d**: the path data. Read the [SVG Path reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) for more info.

## Text

SVG text can be used for small text elements. It doesn't support line wrapping or more advanced features. Use absolutely-positioned `<div>`s for that.

<iframe src="/embed/-L0ylcK66j1ddxfC0spL"></iframe>

A `<text>` element has the following attributes:

* **x**: the horizontal position of the text.
* **y**: the vertical position of the text. Text is always positioned on the baseline.
* **font-size**: the font size of the text.
* **text-anchor**: the alignment of text. Either `start`, `middle` or `end`.

The text itself goes between the `<text>` opening and closing tags.

In addition there are methods for fitting text using `textLength` and `lengthAdjust` attributes. Read the [SVG text reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text) for more info.

## Colors: Fill and Stroke

You can color your shape by giving it a fill color or stroke color. Many options are possible in SVG using patterns, images and so on. We will just list the basics here. [Read the SVG documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes) for more information and examples.

* **fill**: the fill color of a shape. There are many ways in which we can [specify colors](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes): using predefined names, through RGB or HSL values, or using hexadecimal codes. If you're familiar with CSS colors, this is exactly the same. A fill of `none` means the shape is not filled.
* **stroke**: the stroke color of a shape. We can use the same colors as with fills. By default the stroke is `none`, meaning the shape is not stroked.
* **stroke-width**: the line width of the stroke. This is always used in combination with `stroke`. If you don't specify a `stroke-width` it will have a default value of 1.
* **stroke-linecap**: the shape at the end of a line: either `butt`, `square` or `round`.
* **stroke-linejoin**: the shape when two segments connect: either `miter`, `round` or `bevel`.
* **stroke-dasharray**: a pattern for dashed lines, as comma-seperated numbers, e.g. `"5,10,5"`.

In addition, you can also specify the `mix-blend-mode` to use Photoshop-style blending modes. This is a CSS style property, so it needs to go in the style attribute. Using `stroke-dasharray` and blend modes you can create some pretty interesting effects:

<iframe src="/embed/-L0tjSEkMcOWxluQdpzH"></iframe>

## Colors: Gradients

To use gradients in SVG you first have to define them in a `<defs>` section at the top of the document. Here you define if you want a `<linearGradient>` or `<radialGradient>`, the direction of the gradient and the color stops. then you can refer to them using a URL.

<iframe src="/embed/-L0yoeU8nR3yHXwYpK7i"></iframe>

Since we have to do this in two steps it difficult to generate a number of random gradients and have Seed refer to them. We're looking into a solution for this, using some sort of memory function so the system knows which gradients it has generated.

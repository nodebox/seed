# Generating Graphics

**PCG generates only text.** It has no knowledge of graphical shapes, composition or color. However, we can "cheat" the system by realizing that everything we see on a web page is also text: it's just HTML code. And not just HTML code: webpages can also integrate [SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics), which is short for Scaleable Vector Graphics. In other words, *to generate graphics, we will generate SVG code*.

Here's a small example:

```
root:
- <svg width="500" height="500">{{ circle }}</svg>

circle:
- <circle cx="{{ 0..500 }}" cy="{{ 0..500 }}" r="30" fill="red" stroke="white"/> {{circle}}
```

Which gives the following result (click for a live demo):

<a class="noline" href="/sketch/-L0kc3pFDjTy8ykTjUuU"><img src="/_docs/graphics-circles.png" style="height: 200px"></a>

Let's talk first about why we have *so many* circles. That's because at the end of the `circle:` block, we call itself again! So a {{ circle }} expands to a `<circle.../>` tag and a {{ circle }}, which expands to a `<circle.../>` tag and a {{ circle }}, which expands to... you get the idea. This process is called recursion. PCG has a mechanism to stop at some point (by default after 50 iterations), otherwise our expansion would never end and the system would crash. We can use this principle to generate many interesting recursive shapes, like [trees](/sketch/-L0jGl9IhooqRuTF9wxS).

Let's look at the actual code we generate. The `root:` block has only one option which generates a `<svg>` tag. This tag contains properties for the `width` and `height` of the composition. We choose 500 here but you might choose different values depending on the size of your screen. The width and height are not absolutely required but not setting them will result in a tiny SVG document, which is not really useful. Inside of this tag we generate a `{{ circle }}`.

The `circle:` block consists of a single option with a [&lt;circle&gt;](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle) tag. This a standard SVG element that has a number of properties:

- **cx** (short for "center X") defines the horizontal position of the center of the circle.
- **cy** (short for "center Y") defines the vertical position of the center of the circle.
- **r** (short for "radius") defines the radius of the circle. Note that this is the radius — *not* the diameter — so the circle will be twice as big as this.
- **fill** defines the fill color of the circle. There are many ways in which we can [specify colors](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Fills_and_Strokes): using predefined names, through RGB or HSL values, or using hexadecimal codes. If you're familiar with CSS colors, this is exactly the same.
- **stroke** defines the stroke color of the circle. We use a stroke color here so the overlapping circles don't turn into a big red blob. If we want we can also specify the `stroke-width` to set the line width of the stroke.

What else can we generate? SVG has support for lines, paths, rectangles, circles and text.

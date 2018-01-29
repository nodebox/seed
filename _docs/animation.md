# Animation

You can create simple animations by specifying the start and end value separated by a dash (`-`). Seed will animate over a period of 2 seconds (by default) from the start to the end value and back. **Press "Play" to start the animation**:

<iframe src="/embed/-L41Z3TFL0FkiNMkASGN"></iframe>


You can interpolate the color using RGB or HSL values:

<iframe src="/embed/-L2a7OTBQQXRQXRqFPhz"></iframe>

Note that we can't shift the *phase* of the animation. All shapes move at the same rate and start and end at the same position in time. This is a limitation of the current system.

SVG has a number of interesting properties to animate. For example, you can animate the `dashoffset` to "build up" a line (press "Play" to start):

<iframe src="/embed/-L41a3-q1wxzBc-9F61E"></iframe>

Animation support is limited at the moment. We're still working on being able to set the speed and animation type, and being able to export animations as GIFs.

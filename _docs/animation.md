# Animation

You can create simple animations by specifying the start and end value between square brackets [ ] separated by a comma. Seed will animate over a period of 2 seconds (by default) from the start to the end value and back. **Press "Play" to start the animation**:

<iframe src="/embed/-L4uoAl3sL0FkiNMkASG"></iframe>


You can interpolate the color using RGB or HSL values:

<iframe src="/embed/-L4uoOkuQQXRQXRqFPhz"></iframe>

Note that we can't shift the *phase* of the animation. All shapes move at the same rate and start and end at the same position in time. This is a limitation of the current system.

SVG has a number of interesting properties to animate. For example, you can animate the `dashoffset` to "build up" a line (press "Play" to start):

<iframe src="/embed/-L4uobpR1wxzBc-9F61E"></iframe>

To change the duration of an animation you can use the directive `%duration` as shown belown. You can specify the length in seconds `s` or in milliseconds `ms`. By default Seed uses an `%animation` setting of the `bounce` type, meaning it takes half the duration to move from beginning to end, and the other half to go back. You can also set the animation to the type `linear`, in that case it will move from beginning to end and return immediately to the beginning. Finally, if you set the animation to the type `once`, it will act the same way as with `bounce`, but the animation will finish as soon as it has ended the first time. You can try these settings by testing the animation below:

<iframe src="/embed/-L5Y0BTIsL0FkiNMkASG"></iframe>
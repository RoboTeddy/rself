## robosleep: an alarm that goes off if you're *not* in bed by a certain time

Because who would possibly consider going to sleep when there are interesting things on the internet? If you'd feel super guilty for waking up your roommates/neighbors/SO, then this may work for you!

(Uploading this for a friend who wants to duplicate it)


Parts list:

* [Particle Photon Kit](https://store.particle.io/collections/photon) or [Particle Electron](https://store.particle.io/collections/electron). I chose an Electron because I didn't want to have to worry about updating the hardware device if my wifi network changed.

* [Sure Action Pulsar Stress Sensor](https://www.iautomate.com/products/sure-action-pulsor-stress-sensor-enhp.html) (Mount this underneath your bed)

* Resistor (roughly 1k ohm) (see diagram in `robosleep/sender/main.ino`)

* [Piezoelectric buzzer](https://www.amazon.com/Adafruit-Accessories-Large-Enclosed-Element/dp/B01BMRDGBE/) (I used a different one; not sure where I bought it from)

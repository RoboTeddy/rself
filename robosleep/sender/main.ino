// for Particle Electron

int led = D7;  // The on-board LED

void buzz(int duration) {
  const int buzzerOut = D0;
  const int buzzerFrequency = 3500; // Hz
  tone(buzzerOut, buzzerFrequency, duration);
}

int _buzz(String command) {
    buzz(command.toInt());
    return 0;
}

float readResistance() {
  /*
  Vin ------------
                 /
             R1  \ 
            1k Ω /
                 |
  Vout ----------|
                 |
                 /
             R2  \  (Sure Action Pulsar)
                 /
                 |
                GND
  */
  const float Vin = 3.3;
  const float Vout = Vin * (analogRead(A0) / 4095.0);
  const float R1 = 1000.0;
  const float R2 = (R1 * Vout) / (Vin - Vout);
  return R2;
}

void setup() {
  pinMode(led, OUTPUT);
  Particle.function("buzz", _buzz);
}

void loop() {
  float r = readResistance();
  Particle.publish("R", String(r), PRIVATE);
  delay(60000);
}

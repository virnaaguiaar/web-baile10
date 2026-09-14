#ifndef MP3_H
#define MP3_H

#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>

extern SoftwareSerial softwareSerial;
extern DFRobotDFPlayerMini player;

void Mp3Setup() {
  softwareSerial.begin(9600);
  delay(100);

  if (player.begin(softwareSerial)) {
    Serial.println("✅ MP3 Online");
    player.volume(25);   // Volume 0-30
    player.stop();       // Garante que não inicia tocando
  } else {
    Serial.println("❌ Conexão com DFPlayer Mini falhou!");
  }
}

// Toca uma música pelo ID (1-4)
void mp3TocarMusica(int id) {
  if (id >= 1 && id <= 4) {
    player.play(id);
    Serial.printf("🎵 Tocando música %d\n", id);
  } else {
    Serial.printf("⚠️ ID de música inválido: %d\n", id);
  }
}

// Para a música atual
void mp3PararMusica() {
  player.stop();
  Serial.println("⏹️ Música parada");
}

// Controle de volume (opcional)
void mp3SetVolume(int vol) {
  if (vol < 0) vol = 0;
  if (vol > 30) vol = 30;
  player.volume(vol);
  Serial.printf("🔊 Volume: %d\n", vol);
}

#endif
#ifndef MP3_H
#define MP3_H

#include <HardwareSerial.h>          // ← era SoftwareSerial
#include <DFRobotDFPlayerMini.h>

extern HardwareSerial serialMP3;     // ← era SoftwareSerial softwareSerial
extern DFRobotDFPlayerMini player;

void Mp3Setup() {
    serialMP3.begin(9600, SERIAL_8N1, MP3_RX, MP3_TX);  // UART2, pinos 17 e 16
    delay(100);

    if (player.begin(serialMP3)) {   // ← era softwareSerial
        Serial.println("✅ MP3 Online");
        player.volume(25);
        player.stop();
    } else {
        Serial.println("❌ Conexão com DFPlayer Mini falhou!");
    }
}

void mp3TocarMusica(int id) {
    if (id >= 1 && id <= 4) {
        player.playFolder(1, id);    // ← era player.play(id)
        Serial.printf("🎵 Tocando música %d\n", id);
    } else {
        Serial.printf("⚠️ ID de música inválido: %d\n", id);
    }
}

void mp3PararMusica() {
    player.stop();
    Serial.println("⏹️ Música parada");
}

void mp3SetVolume(int vol) {
    if (vol < 0) vol = 0;
    if (vol > 30) vol = 30;
    player.volume(vol);
    Serial.printf("🔊 Volume: %d\n", vol);
}

#endif
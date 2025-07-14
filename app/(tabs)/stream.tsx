import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Move audioUrl outside component to prevent recreation
// const audioUrl =
// "https://static.stg.4t5techlabs.com/api/file/95692_37c8e44ccd7b1c5d_audio_recording_1751557375200.m4a";
const audioUrl = "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";
// const audioUrl =
// "https://static.stg.4t5techlabs.com/api/file/95804_b95f5bd4c8e773da_audio_recorder.mp4";

export default function StreamScreen() {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when player changes
    setHasError(false);

    // Configure audio mode for speaker output
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          shouldRouteThroughEarpiece: false, // Ensure audio plays through speaker
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: true,
        });
        console.log("Audio mode configured for speaker output");
      } catch (error) {
        console.log("Audio mode configuration error:", error);
        setHasError(true);
      }
    };

    configureAudio();

    // Configure audio player for speaker output
    if (player) {
      try {
        // Set volume to ensure audio is audible
        player.volume = 1.0; // Changed from 10.0 to 1.0 (valid range is 0-1)
        console.log("Audio player configured for speaker output");
      } catch (error) {
        console.log("Audio configuration error:", error);
        setHasError(true);
      }
    }

    console.log("Player status:", {
      isLoaded: status.isLoaded,
      duration: status.duration,
      playing: status.playing,
      isBuffering: status.isBuffering,
      currentTime: status.currentTime,
      playbackState: status.playbackState || "unknown",
    });

    // Update our local playing state to match the status
    setIsPlaying(status.playing);

    // If the audio fails to load after some time, log it
    if (!status.isLoaded && !status.isBuffering && !hasError) {
      console.warn("Audio file may not be compatible or accessible:", audioUrl);
      // Don't set error immediately, give it time to load
      const timeoutId = setTimeout(() => {
        if (!status.isLoaded && !status.isBuffering) {
          setHasError(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeoutId);
    }

    // Reset playing state when audio finishes
    if (status.currentTime === status.duration && status.duration > 0) {
      setIsPlaying(false);
    }
  }, [status, player, hasError]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const playPause = async () => {
    if (!player || isLoading) return;

    try {
      setIsLoading(true);
      console.log("Current playing state:", isPlaying);
      console.log("Status playing:", status.playing);

      if (isPlaying || status.playing) {
        console.log("Pausing audio...");
        await player.pause();
        setIsPlaying(false);
      } else {
        console.log("Playing audio...");
        await player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Play/Pause error:", error);
      Alert.alert("Error", "Failed to play/pause audio");
      // Reset loading state on error
      setIsPlaying(false);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const stopAudio = () => {
    try {
      console.log("Stopping audio...");
      player.seekTo(0);
      player.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Audio Streaming</Text>

        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>Streaming from:</Text>
          <Text style={styles.url} numberOfLines={2}>
            {audioUrl}
          </Text>
        </View>

        <View style={styles.playerContainer}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Status: {isPlaying ? "Playing" : "Paused"} | Loaded:{" "}
              {status.isLoaded ? "Yes" : "No"} | Buffering:{" "}
              {status.isBuffering ? "Yes" : "No"}
              {hasError && " | Error: Failed to load"}
            </Text>
            <Text style={styles.statusText}>
              Duration:{" "}
              {status.duration ? status.duration.toFixed(1) : "Unknown"}s |
              Current:{" "}
              {status.currentTime ? status.currentTime.toFixed(1) : "0"}s
            </Text>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(status.currentTime || 0)}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(status.duration || 0)}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      status.duration && status.duration > 0
                        ? `${
                            ((status.currentTime || 0) / status.duration) * 100
                          }%`
                        : "0%",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.playButton]}
              onPress={playPause}
              disabled={isLoading || !status.isLoaded || hasError}
            >
              <Text style={styles.buttonText}>
                {hasError
                  ? "Error"
                  : !status.isLoaded
                  ? "Loading..."
                  : isLoading
                  ? "Wait..."
                  : isPlaying
                  ? "Pause"
                  : "Play"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopAudio}
              disabled={!player}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  urlContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  url: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
  switchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: "center",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  playerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statusContainer: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 25,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#007AFF",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

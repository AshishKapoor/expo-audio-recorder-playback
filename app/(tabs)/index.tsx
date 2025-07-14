import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Slider from "@react-native-community/slider";

export default function HomeScreen() {
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionResponse, setPermissionResponse] = useState<any>(null);

  // Audio recorder setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Audio player setup - will be initialized when we have a recording
  const player = useAudioPlayer(recordingUri ? { uri: recordingUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // Request permissions and setup audio mode on component mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Request recording permissions
        const permissionStatus =
          await AudioModule.requestRecordingPermissionsAsync();
        setPermissionResponse(permissionStatus);

        if (!permissionStatus.granted) {
          Alert.alert(
            "Permission Required",
            "Microphone access is required for recording audio."
          );
          return;
        }

        // Configure audio mode for speakers playback
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          shouldPlayInBackground: true,
          // Force audio to use speakers instead of earpiece
          shouldRouteThroughEarpiece: false,
          interruptionModeAndroid: "duckOthers",
          interruptionMode: "duckOthers",
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
        Alert.alert("Setup Error", "Failed to setup audio recording.");
      }
    };

    setupAudio();
  }, []);

  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        Alert.alert(
          "Permission Required",
          "Microphone access is required for recording."
        );
        return;
      }

      // Stop any ongoing playback before clearing
      if (player && recordingUri) {
        try {
          player.pause();
        } catch (playerError) {
          console.log("Player already stopped or unavailable:", playerError);
        }
      }

      // Prepare and start recording first
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      // Clear previous recording after starting new recording
      if (recordingUri) {
        setRecordingUri(null);
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Recording Error", "Failed to start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordingUri(uri);
        console.log("Recording saved to:", uri);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Recording Error", "Failed to stop recording.");
    }
  };

  const playRecording = async () => {
    if (player && recordingUri) {
      try {
        // Ensure audio plays through speakers
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
          interruptionModeAndroid: "duckOthers",
          interruptionMode: "duckOthers",
        });

        player.play();
      } catch (error) {
        console.error("Error setting audio mode for playback:", error);
        // Still try to play even if audio mode setting fails
        player.play();
      }
    } else {
      Alert.alert("No Recording", "Please record audio first.");
    }
  };

  const stopPlayback = async () => {
    if (player) {
      player.pause();

      try {
        // Restore audio mode for recording capability
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
          interruptionModeAndroid: "duckOthers",
          interruptionMode: "duckOthers",
        });
      } catch (error) {
        console.error("Error restoring audio mode:", error);
      }
    }
  };

  const replayRecording = async () => {
    if (player && recordingUri) {
      try {
        // Ensure audio plays through speakers
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
          interruptionModeAndroid: "duckOthers",
          interruptionMode: "duckOthers",
        });

        player.seekTo(0);
        player.play();
      } catch (error) {
        console.error("Error setting audio mode for replay:", error);
        // Still try to play even if audio mode setting fails
        player.seekTo(0);
        player.play();
      }
    }
  };

  const clearRecording = async () => {
    try {
      // Stop any ongoing playback
      if (player) {
        player.pause();
      }

      // Clear the recording URI
      setRecordingUri(null);

      console.log("Recording cleared by user");
    } catch (error) {
      console.error("Error clearing recording:", error);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Audio Recorder & Player
      </ThemedText>

      {/* Recording Section */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recording
        </ThemedText>

        <View style={styles.recordingControls}>
          <TouchableOpacity
            style={[
              styles.button,
              recorderState.isRecording
                ? styles.stopButton
                : styles.recordButton,
            ]}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {recorderState.isRecording ? "Stop Recording" : "Start Recording"}
            </Text>
          </TouchableOpacity>

          {/* Clear Recording Button - only show when there's a recording and not currently recording */}
          {recordingUri && !recorderState.isRecording && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearRecording}
            >
              <Text style={styles.buttonText}>
                {recorderState.isRecording
                  ? "Start Recording"
                  : "Clear Recording"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {recorderState.isRecording && (
          <ThemedText style={styles.recordingTime}>
            Recording: {formatTime(recorderState.durationMillis / 1000)}
          </ThemedText>
        )}

        {recordingUri && !recorderState.isRecording && (
          <ThemedText style={styles.recordingStatus}>
            ✅ Recording saved successfully!
          </ThemedText>
        )}
      </ThemedView>

      {/* Playback Section */}
      {recordingUri && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Playback
          </ThemedText>

          {/* Playback Slider */}
          {playerStatus && (
            <View style={{ alignItems: "stretch", marginBottom: 16 }}>
              <Slider
                minimumValue={0}
                maximumValue={playerStatus.duration || 0}
                value={playerStatus.currentTime}
                onValueChange={(value) => {
                  if (player) player.seekTo(value);
                }}
                step={1}
                minimumTrackTintColor="#2196F3"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#2196F3"
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <ThemedText style={{ fontSize: 12 }}>
                  {formatTime(playerStatus.currentTime)}
                </ThemedText>
                <ThemedText style={{ fontSize: 12 }}>
                  {formatTime(playerStatus.duration || 0)}
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={[styles.button, styles.playButton]}
              onPress={playRecording}
            >
              <Text style={styles.buttonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopPlayback}
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.replayButton]}
              onPress={replayRecording}
            >
              <Text style={styles.buttonText}>Replay</Text>
            </TouchableOpacity>
          </View>

          {playerStatus && (
            <View style={styles.playbackInfo}>
              <ThemedText style={styles.playbackTime}>
                {formatTime(playerStatus.currentTime)} /{" "}
                {formatTime(playerStatus.duration || 0)}
              </ThemedText>
              <ThemedText style={styles.playbackStatus}>
                Status: {playerStatus.playing ? "Playing" : "Paused"}
              </ThemedText>
            </View>
          )}
        </ThemedView>
      )}

      {/* Instructions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Instructions
        </ThemedText>
        <ThemedText style={styles.instructions}>
          1. Tap &quot;Start Recording&quot; to begin recording audio
        </ThemedText>
        <ThemedText style={styles.instructions}>
          2. Tap &quot;Stop Recording&quot; when finished
        </ThemedText>
        <ThemedText style={styles.instructions}>
          3. Use &quot;Clear Recording&quot; to remove current recording
        </ThemedText>
        <ThemedText style={styles.instructions}>
          4. Audio will play through speakers (not earpiece)
        </ThemedText>
        <ThemedText style={styles.instructions}>
          5. Use the playback controls to listen to your recording
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  recordingControls: {
    alignItems: "center",
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  recordButton: {
    backgroundColor: "#ff4444",
  },
  stopButton: {
    backgroundColor: "#666666",
  },
  clearButton: {
    backgroundColor: "#ff8800",
    marginTop: 10,
  },
  playButton: {
    backgroundColor: "#4CAF50",
  },
  replayButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  recordingTime: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4444",
  },
  recordingStatus: {
    textAlign: "center",
    fontSize: 16,
    color: "#4CAF50",
  },
  playbackInfo: {
    alignItems: "center",
  },
  playbackTime: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playbackStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  instructions: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
});

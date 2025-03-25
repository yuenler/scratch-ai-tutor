// Voice recording functionality for BlockBuddy

// Create a namespace for our voice recording functions
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.VoiceRecording = window.BlockBuddy.VoiceRecording || {};

/**
 * Start voice recording and return the recorder object
 * @returns {Promise<Object>} Promise that resolves to the recorder object
 */
window.BlockBuddy.VoiceRecording.startRecording = function() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            // Return the base64 data
            resolve({
              base64data,
              recorder: { mediaRecorder, stream }
            });
          };
        });
        
        // Start recording
        mediaRecorder.start();
        
        // Return the MediaRecorder instance so it can be stopped later
        resolve({ mediaRecorder, stream });
      })
      .catch(error => {
        console.error("Error accessing microphone:", error);
        reject(error);
      });
  });
};

/**
 * Stop voice recording and get the audio data
 * @param {Object} recorderObj - The recorder object returned by startRecording
 * @returns {Promise<string>} Promise that resolves to the base64 encoded audio data
 */
window.BlockBuddy.VoiceRecording.stopRecording = function(recorderObj) {
  return new Promise((resolve, reject) => {
    if (!recorderObj || !recorderObj.mediaRecorder) {
      reject(new Error("Invalid recorder object"));
      return;
    }
    
    const audioChunks = [];
    
    recorderObj.mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });
    
    recorderObj.mediaRecorder.addEventListener("stop", () => {
      // Stop all tracks to properly release the microphone
      recorderObj.stream.getTracks().forEach(track => track.stop());
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
    });
    
    // Stop the recording
    if (recorderObj.mediaRecorder.state !== 'inactive') {
      recorderObj.mediaRecorder.stop();
    } else {
      reject(new Error("Recorder is not active"));
    }
  });
};

/**
 * Transcribe audio data using the Whisper API
 * @param {string} audioBase64 - The base64 encoded audio data
 * @returns {Promise<string>} Promise that resolves to the transcribed text
 */
window.BlockBuddy.VoiceRecording.transcribeAudio = function(audioBase64) {
  return new Promise((resolve, reject) => {
    console.log("Sending audio for transcription...");
    
    // Send the audio data to the background script
    chrome.runtime.sendMessage(
      {
        action: "transcribeAudio",
        data: { audioData: audioBase64 }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          reject("Error communicating with the server. Please try again.");
          return;
        }
        
        if (response.error) {
          console.error("API error:", response.error);
          reject(response.error || "Error transcribing audio. Please try again.");
          return;
        }
        
        // Return the transcribed text
        resolve(response.text || "");
      }
    );
  });
};

// Storage functions for voice recording preference
window.BlockBuddy.Storage = window.BlockBuddy.Storage || {};

/**
 * Get voice recording enabled preference
 * @returns {boolean} Whether voice recording is enabled
 */
window.BlockBuddy.Storage.getVoiceRecordingEnabledPreference = function() {
  return localStorage.getItem('blockBuddy_voiceRecordingEnabled') === 'true';
};

/**
 * Set voice recording enabled preference
 * @param {boolean} value - Whether voice recording is enabled
 */
window.BlockBuddy.Storage.setVoiceRecordingEnabledPreference = function(value) {
  localStorage.setItem('blockBuddy_voiceRecordingEnabled', String(value));
};

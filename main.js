let mediaRecorder;
let audioChunks = [];
let blob;
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusText = document.getElementById('status');

const downloadButton = document.getElementById('download');
const sendToButton = document.getElementById('sendTo');

const recordedAudio = document.getElementById('recordedAudio');
const audioDownload = document.getElementById('audioDownload');

const audioInputSelect = document.querySelector('select#audioSource');
const selectors = [audioInputSelect];

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
downloadButton.addEventListener('click', downloadRecording);
sendToButton.addEventListener('click', sendRecording);

audioInputSelect.onchange = start;

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .then(start)
  .catch(handleError);

function gotDevices(deviceInfos) {
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    blob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];
    recordedAudio.src = URL.createObjectURL(blob);
    recordedAudio.controls = true;
    recordedAudio.autoplay = false;
    downloadButton.disabled = false;
    sendToButton.disabled = false;
  };
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  if (window.stream) {
    window.stream.getAudioTracks().forEach(track => track.stop());
  }
  const audioSource = audioInputSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined }
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
}

function startRecording() {
  startButton.disabled = true;
  stopButton.disabled = false;
  audioChunks = [];
  if (mediaRecorder) {
    mediaRecorder.start();
    statusText.textContent = 'Status: Recording...';
  }
}

function stopRecording() {
  startButton.disabled = false;
  stopButton.disabled = true;
  if (mediaRecorder) {
    mediaRecorder.stop();
    statusText.textContent = 'Status: Stopped recording';
  }
}

function downloadRecording() {
  if (blob) {
    audioDownload.href = recordedAudio.src;
    audioDownload.download = 'audio.webm';
    audioDownload.click();
  }
}

function sendRecording() {
  if (blob) {
    sendAudio(blob);
  }
}

function sendAudio(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');

  fetch('https://your_server_domain', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      console.log('File uploaded successfully:', data);
      statusText.textContent = 'Status: File uploaded successfully';
    })
    .catch(error => {
      console.error('Error uploading file:', error);
      statusText.textContent = 'Status: Error uploading file';
    });
}
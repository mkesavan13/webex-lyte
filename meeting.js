// Prerequisite data SIP and Access Token (Hard Coded)
const myAccessToken = "MWJiZWQ3MzctNTllZS00YjMxLTg4MTQtNGNhYjIwNjBkZGI3Njk5MDBmY2UtOTUx_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f";
const sip = "pkalla.cisco@webex.com";

// Initializing Webex
const webex = window.Webex.init({
  credentials: {
    access_token: myAccessToken
  }
});

// Registering Webex Device
webex.meetings.register()
  .catch((err) => {
    console.error(err);
    alert(err);
    throw err;
  });

// Setting Local And Remote Stream Variables
let localMedia = {
  cameraStream: null,
  microphoneStream: null
};
let currentMeeting = null;
let isVideoStarted = false;
let isMicrophoneMuted = true;


function setMediaListeners(meeting) {
  meeting.on('media:ready', (media) => {
    console.log('media:ready event triggered for type:', media.type);
    if (media.type === 'local') {
      document.getElementById('localVideo').srcObject = media.stream;
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remoteVideo').srcObject = media.stream;
    }
    if (media.type === 'remoteAudio') {
      const remoteAudioElement = document.getElementById('remoteAudio');
      remoteAudioElement.srcObject = media.stream;
      remoteAudioElement.play();
    }
    if (media.type === 'remoteShare') {
      const remoteShareElement = document.getElementById('remoteShare');
      remoteShareElement.style.display = 'block';
      remoteShareElement.srcObject = media.stream;
     // document.getElementById('remoteoff').style.display = 'block';
     //document.getElementById('remotewidth').style.display='block';
      console.log('Remote share started, video element should be visible');
    }
  });
  meeting.on('media:stopped', (media) => {
    console.log('media:stopped event triggered for type:', media.type);
    if (media.type === 'local') {
      document.getElementById('localVideo').srcObject = null;
      document.getElementById('localVideo').style.backgroundImage = 'url("./images/image1.png")';
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remoteVideo').srcObject = null;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remoteAudio').srcObject = null;
    }
    if (media.type === 'remoteShare') {
      const remoteShareElement = document.getElementById('remoteShare');
      remoteShareElement.srcObject = null;
      console.log('Remote share stopped, video element should be hidden');
    }
  });
}
/*document.getElementById('remoteoff').addEventListener('click',function(){
  document.getElementById('remoteShare').style.display="none";
  document.getElementById('remoteoff').style.display="none";
  const remoteVideoElement = document.getElementById('remoteVideo');
      remoteVideoElement.style.width = '846px'; 
      remoteVideoElement.style.height = '486px'; 

})
document.getElementById('remotewidth').addEventListener('click',function(){
  const remoteVideoElement = document.getElementById('remoteVideo');
  remoteVideoElement.style.width = '320px';  // Set width to 320px
  remoteVideoElement.style.height = '240px'; // Set height to 240px
  document.getElementById('remotewidth').style.display='none';
})*/

// Clean up media listeners
function cleanUpMediaListeners(meeting) {
  meeting.off('media:ready');
  meeting.off('media:stopped');
}

// Including Leave Meeting logic
document.getElementById('leaveMeetingButton').addEventListener('click', () => {
  if (currentMeeting) {
    const confirmLeave = window.confirm("Are you sure you want to leave the meeting?");
    if (confirmLeave) {
      currentMeeting.leave().then(() => {
        document.getElementById('joinMeetingModal').style.display="none";
        console.log('Left the meeting');
        cleanUpMediaListeners(currentMeeting);
        document.getElementById('Video').innerHTML='<img src="./images/stop.png" style="width: 25px; ;height:25px">Start'
      }).catch((error) => {
        console.error('Failed to leave the meeting', error);
      });
    } else {
      console.log('User chose not to leave the meeting');
      document.getElementById('remoteShare').style.display="none";
    }
  }
});


// Adding Event Listeners to the JOIN, START/STOP, UNMUTE/MUTE buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("joinMeetingButton").addEventListener("click", joinMeeting);
  document.getElementById("Video").addEventListener("click", toggleVideo);
  document.getElementById("Microphone").addEventListener("click", toggleMicrophone);
  document.getElementById("Microphone").innerHTML = '<img src="./images/mute.png" alt="Mute Icon"> Unmute';
});



// JOIN MEETING FUNCTIONALITY
async function joinMeeting() {
  document.getElementById("joinMeetingButton").style.display = "none";
  $('#joinMeetingModal').modal('show');
  var element = document.querySelector('.container3');
  element.classList.add('blur');
  try {
    const meeting = await webex.meetings.create(sip);
    currentMeeting = meeting;
    setMediaListeners(meeting);

    // Load the local video stream before joining the meeting
    await loadCamera({ video: true, audio: false });

    await meeting.join();
    
    // Initialize the video state based on the sendVideo parameter
    isVideoStarted = true;
   // const isSharing = meeting.getShareStatus();

    // Add local video (and audio, if needed) to the meeting
    await meeting.addMedia({
      localStream: localMedia.cameraStream,
      mediaSettings: {
        receiveVideo:true,
        receiveAudio: true,
        receiveShare: false,
        sendVideo: isVideoStarted,
        sendAudio: false,
        sendShare: false
      }
    });
    // Update the video button text based on the video state
    document.getElementById('Video').innerHTML = isVideoStarted ? '<img src="./images/video-camera.png" style="width: 25px; ;height:25px">Stop' : '<img src="./images/stop.png" style="width: 25px;height:25px">Start';
    document.getElementById("Microphone").innerHTML = '<img src="./images/mute.png" alt="Mute Icon"> Unmute';
    // UI updates for successfully joining the meeting
  } catch (error) {
    console.error('Failed to join or create the meeting', error);
    alert('Failed to join or create the meeting: ' + error.message);
  }
}

// LOAD CAMERA FUNCTIONALITY
async function loadCamera(constraints) {
  try {
    // Stop any existing camera stream
    if (localMedia.cameraStream) {
      localMedia.cameraStream.getTracks().forEach(track => track.stop());
    }

    // Attempt to get a new camera stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localMedia.cameraStream = stream;
    document.getElementById('localVideo').srcObject = localMedia.cameraStream;

    // Set up an event listener for the video track to handle the camera being turned off
    const videoTrack = localMedia.cameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.log('The camera has been turned off or disconnected.');
        isVideoStarted = false;
        document.getElementById('Video').innerHTML = '<img src="./images/stop.png" style="width: 25px;height:25px">Start';
      };
    }
  } catch (error) {
    console.error('Error accessing the camera', error);
    if (error.name === 'NotAllowedError') {
      alert('Camera access was denied. Please allow camera permissions for this site.');
    } else {
      alert('Failed to load the camera: ' + error.message);
    }
  }
}

// Function to add video to the meeting
async function addVideoToMeeting(meeting, cameraStream) {
  try {
    await meeting.updateMedia({
      localStream: cameraStream,
      mediaSettings: {
        sendVideo: true
      }
    });
    isVideoStarted = true;
    document.getElementById('Video').innerHTML = '<img src="./images/video-camera.png" style="width: 25px;height:25px">Stop';
  } catch (error) {
    console.error('Failed to add video to the meeting', error);
    alert('Failed to start video: ' + error.message);
  }
}

// START/STOP FUNCTIONALITY
async function toggleVideo() {
  if (!isVideoStarted) {
    // Start video
    try {
      await loadCamera({ video: true, audio: false });
      if (currentMeeting) {
        await addVideoToMeeting(currentMeeting, localMedia.cameraStream);
      }
    } catch (error) {
      console.error('Error starting video', error);
    }
  } else {
    // Stop video
    try {
      if (currentMeeting) {
        await currentMeeting.updateMedia({
          localStream: localMedia.cameraStream,
          mediaSettings: {
            sendVideo: false
          }
        });
      }

      // Stop the local camera stream
      if (localMedia.cameraStream) {
        localMedia.cameraStream.getTracks().forEach(track => track.stop());
        localMedia.cameraStream = null;
        document.getElementById('localVideo').srcObject = null;
      }

      isVideoStarted = false;
      document.getElementById('Video').innerHTML = '<img src="./images/stop.png" style="width: 25px;height:25px">Start';
    } catch (error) {
      console.error('Error stopping video', error);
      alert('Failed to stop video: ' + error.message);
    }
  }
}

// LOAD MICROPHONE FUNCTIONALITY
async function loadMicrophone() {
  try {
    // Stop any existing microphone stream
    if (localMedia.microphoneStream) {
      localMedia.microphoneStream.getTracks().forEach(track => track.stop());
    }

    // Attempt to get a new microphone stream with the desired constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    localMedia.microphoneStream = stream;

    // Set up an event listener for the audio track to handle the microphone being turned off
    const audioTrack = localMedia.microphoneStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.onended = () => {
        console.log('The microphone has been turned off or disconnected.');
        isMicrophoneMuted = true;
        document.getElementById('Microphone').innerHTML = '<img src="./images/mute.png" alt="Mute Icon"> Unmute';
      };
    }
  } catch (error) {
    console.error('Error accessing the microphone', error);
    alert('Failed to load the microphone: ' + error.message);
  }
}

// Function to add audio to the meeting
async function addAudioToMeeting(meeting, microphoneStream) {
  try {
    await meeting.updateMedia({
      localStream: microphoneStream,
      mediaSettings: {
        sendAudio: true
      }
    });
    isMicrophoneMuted = false;
    document.getElementById('Microphone').innerHTML = '<img src="./images/voice.png" alt="Mute Icon"> Mute'
  } catch (error) {
    console.error('Failed to add audio to the meeting', error);
    alert('Failed to start audio: ' + error.message);
  }
}

// UNMUTE/MUTE FUNCTIONALITY
async function toggleMicrophone() {
  if (isMicrophoneMuted) {
    // Unmute microphone
    try {
      if (!localMedia.microphoneStream) {
        await loadMicrophone();
      }

      if (currentMeeting) {
        await addAudioToMeeting(currentMeeting, localMedia.microphoneStream);
      } else {
        console.error('No current meeting available.');
      }
    } catch (error) {
      console.error('Failed to unmute microphone in the meeting', error);
      alert('Failed to unmute microphone: ' + error.message);
    }
  } else {
    // Mute microphone
    try {
      if (currentMeeting && localMedia.microphoneStream) {
        localMedia.microphoneStream.getAudioTracks().forEach(track => track.enabled = false);
        await currentMeeting.updateMedia({
          localStream: localMedia.microphoneStream,
          mediaSettings: {
            sendAudio: false
          }
        });
        isMicrophoneMuted = true;
        document.getElementById("Microphone").innerHTML = '<img src="./images/mute.png" alt="Mute Icon"> Unmute';
      } else {
        console.error('No current meeting available.');
      }
    } catch (error) {
      console.error('Failed to mute microphone in the meeting', error);
      alert('Failed to mute microphone: ' + error.message);
    }
  }
}



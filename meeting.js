// 1) Access token and SIP URI (Hard Coded).
const accessToken = "";
const sipAddress = "";

// 2) Setting Media Variables.
const joinMeetingButton = document.getElementById('joinMeetingButton');
const leaveMeetingButton = document.getElementById('leaveMeetingButton');
const microphoneButton = document.getElementById('microphone');
const videoButton = document.getElementById('video');
const RemoteVideo = document.getElementById('remoteVideo');
const RemoteAudio = document.getElementById('remoteAudio');
const localVideo = document.getElementById('localVideo');
const shareButton = document.getElementById('share');
const bnrButton = document.getElementById('bnr');
const vbgButton = document.getElementById('vbg');

// 3) Setting Initiated Variables to Null.
let createdMeeting = null;
let localStream = null;
let isMuted = true;
let isVideoStarted = true;
let vbgEffect = false;

// 4) Webex Initialize.
const webex = window.Webex.init({
  credentials: {
    access_token: accessToken
  }
});

// 5) Registering Webex Device
webex.meetings.register()
  .catch((err) => {
    console.error('Error registering Webex device:', err);
    alert('Error registering Webex device. Check console for details.');
  });

// 6) CreateMeeting Function.
async function createMeeting() {
  try {
    const meeting = await webex.meetings.create(sipAddress);
    createdMeeting = meeting;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

// 7) Set Media Listeners(Remote Streams)
function setMediaListeners() {
  if (!createdMeeting) {
    console.error('No meeting available to set media listeners.');
    return;
  }
  createdMeeting.on('media:ready', (media) => {
    console.log('Media ready', media);
    switch (media.type) {
      case 'remoteVideo':
        RemoteVideo.srcObject = media.stream;
        break;
      case 'remoteAudio':
        RemoteAudio.srcObject = media.stream;
        RemoteAudio.play();
        break;
      default:
        console.error('Unknown media type:', media.type);
    }
  });
  createdMeeting.on('media:stopped', (media) => {
    switch (media.type) {
      case 'remoteVideo':
        RemoteVideo.srcObject = null;
        break;
      case 'remoteAudio':
        RemoteAudio.srcObject = null;
        break;
      default:
        console.error('Unknown media type:', media.type);
    }
  });
}

// 8) Get Local Streams Function.
async function getLocalStreams() {
  try {
    const microphoneStream = await webex.meetings.mediaHelpers.createMicrophoneStream({
      echoCancellation: true,
      noiseSuppression: true,
    });

    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream({ width: 640, height: 480 });
    localVideo.srcObject = cameraStream.outputStream;

    return {
      microphone: microphoneStream,
      camera: cameraStream,
    };
  } catch (error) {
    console.error('Error getting local streams:', error);
    throw error;
  }
}

// 9) Joining the Meeting and add Local Streams to meeting.
async function joinMeetingWithMedia(localStreams) {
  try {
    const meetingOptions = {
      mediaOptions: {
        allowMediaInLobby: true,
        shareAudioEnabled: false,
        shareVideoEnabled: false,
        localStreams,      
      },
    };

    await createdMeeting.joinWithMedia(meetingOptions);

    document.getElementById('joinMeetingModal').style.display = 'block';
    joinMeetingButton.style.display = 'none';
  } catch (error) {
    console.error('Error joining meeting with media:', error);
    throw error;
  }
}

// 10) Join Meeting Listener and Calling Above Functions(6 to 9).
joinMeetingButton.addEventListener('click', joinMeeting);
async function joinMeeting() {
  document.getElementById("joinMeetingButton").style.display = "none";
  document.getElementById("localvideoimage").style.display = "none";
  $('#joinMeetingModal').modal('show');
  var element = document.querySelector('.container3');
  element.classList.add('blur');
  try {
    await createMeeting();
    setMediaListeners();
    localStream = await getLocalStreams();
    createdMeeting.setRemoteQualityLevel('HIGH');
    await joinMeetingWithMedia(localStream);
  } catch (error) {
    console.error('Error joining meeting:', error);
  }
}

// 11) Leaving Meeting Listener and Function.
leaveMeetingButton.addEventListener('click', leaveMeeting);
async function leaveMeeting() {
  try {
    const confirmLeave = window.confirm("Are you sure you want to leave the meeting?");
    if(confirmLeave){
      await createdMeeting.leave();
      joinMeetingButton.style.display = 'block';
      $('#joinMeetingModal').modal('hide');
      videoButton.innerHTML = '<i class="fas fa-video icon green"></i>';
      microphoneButton.innerHTML = '<i class="fas fa-microphone icon green"></i>';
      microphoneButton.style.padding = "14px 21px";
      bnrButton.classList.remove('selected');
      vbgButton.classList.remove('selected');
      createdMeeting=null;
      localStream = null;
      isMuted = true;
      isVideoStarted = true;
      vbgEffect = false;
      
    }
  } catch (error) {
    console.error('Error leaving meeting:', error);
    $('#joinMeetingModal').modal('hide');

  }
}

// 12) Start and Stop Button using toggleVideo Function.
videoButton.addEventListener('click', toggleVideo);
async function toggleVideo() {
  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  // Stop Video
  if (isVideoStarted) {
    await createdMeeting.unpublishStreams([localStream.camera]);
    localVideo.srcObject = null;
    document.getElementById("localvideoimage").style.display = "block";
    videoButton.innerHTML = '<i class="fas fa-video-slash icon red"></i>';
    isVideoStarted = false;
    vbgButton.classList.remove('selected');
    if (vbgEffect && vbgEffect.isEnabled) {
      await vbgEffect.disable();
    }
  } 
  // Start Video
  else {
    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream({ width: 640, height: 480 });
    localStream.camera = cameraStream;
    localVideo.srcObject = cameraStream.outputStream;
    await createdMeeting.publishStreams({ camera: localStream.camera });
    videoButton.innerHTML = '<i class="fas fa-video icon green"></i>';
    document.getElementById("localvideoimage").style.display = "none";
    isVideoStarted = true;
  }
}

// 13) Mute and UnMute Button using toggleMicrophone Function
microphoneButton.addEventListener('click', toggleMicrophone);
async function toggleMicrophone() {
  if (!localStream) {
    console.error('No local stream available.');
    return;
  }
  // Unmute Local Audio
  if (!isMuted) {
    try {
      const microphoneStream = await webex.meetings.mediaHelpers.createMicrophoneStream({
        echoCancellation: true,
        noiseSuppression: true,
      });

      localStream.microphone = microphoneStream;
      await createdMeeting.publishStreams({ microphone: localStream.microphone });
      microphoneButton.innerHTML = '<i class="fas fa-microphone icon green"></i>';
      microphoneButton.style.padding = "14px 21px";
      isMuted = true;
    } catch (error) {
      console.error('Error creating microphone stream:', error);
    }
  } 
  // Mute Local Audio
  else {
    if (localStream.microphone) {
      await createdMeeting.unpublishStreams([localStream.microphone]);
      localStream.microphone = null;
      bnrButton.classList.remove('selected');
    }
    microphoneButton.innerHTML = '<i class="fas fa-microphone-slash icon red"></i>';
    microphoneButton.style.padding = "14px 17px";
    isMuted = false;
  }
}

// 16) Added the Local Share System using Share Button.
shareButton.addEventListener('click', localshare);
async function localshare() {
  const [localShareVideoStream, localShareAudioStream] =
    await webex.meetings.mediaHelpers.createDisplayStreamWithAudio();
  await createdMeeting.publishStreams({
    screenShare: {
      video: localShareVideoStream,
      audio: localShareAudioStream,
    }
  });
}

// 17) Enabled BNR using Event Listeners and toggleBNR Function.
bnrButton.addEventListener('click', toggleBNR);
async function toggleBNR() {
  let bnrEffect = null;
  if (!localStream || !localStream.microphone) {
    console.error('No local microphone stream available.');
    return;
  }

  try {
    if (!bnrEffect) {
      const audioContext = new AudioContext({ sampleRate: 48000 });
      bnrEffect = await webex.meetings.createNoiseReductionEffect(audioContext);
      await localStream.microphone.addEffect(bnrEffect);
    }

    if (bnrEffect.isEnabled) {
      await bnrEffect.disable();
      bnrButton.classList.remove('selected');
      console.log('BNR disabled');
    } else {
      await bnrEffect.enable();
      console.log('BNR enabled');
      bnrButton.classList.add('selected');
    }
  } catch (error) {
    console.error('Error toggling BNR:', error);
  }
}

// 18) Enabled VBG using Event Listeners and toggleVBG Function.
vbgButton.addEventListener('click', toggleVBG);
async function toggleVBG() {
  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  try {
    if (!vbgEffect) {
      vbgEffect = await webex.meetings.createVirtualBackgroundEffect();
    }
    if (vbgEffect.isEnabled) {
      await vbgEffect.disable();
      vbgButton.classList.remove('selected');
    } else {
      await localStream.camera.addEffect(vbgEffect);
      await vbgEffect.enable();
      console.log('VBG enabled');
      vbgButton.classList.add('selected');
    }
  } catch (error) {
    console.error('Error toggling VBG:', error);
  }
}

// 19) Permission Handling
async function handlePermissionChange(permissionName) {
  const permission = await navigator.permissions.query({ name: permissionName });
  permission.onchange = async () => {
    if (permission.state !== 'granted') {
      if (permissionName === 'camera') {
        if (isVideoStarted) {
          toggleVideo();
          vbgEffect=null;
        } 
        
      } else if (permissionName === 'microphone') {
        if (isMuted) {
          await toggleMicrophone();
        }
      }
    }
  }
}
// Monitor permission changes
handlePermissionChange('camera');
handlePermissionChange('microphone');
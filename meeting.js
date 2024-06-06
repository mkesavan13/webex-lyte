// 1)Access token and SIP URI (Hard Coded).
const accessToken = "";
const sipAddress = "";

// 2)Setting Media Variables.
const joinMeetingButton = document.getElementById('joinMeetingButton');
const leaveMeetingButton = document.getElementById('leaveMeetingButton');
const microphoneButton = document.getElementById('microphone');
const videoButton = document.getElementById('video');
const RemoteVideo = document.getElementById('remoteVideo');
const RemoteAudio = document.getElementById('remoteAudio');
const localVideo = document.getElementById('localVideo');
const shareButton=document.getElementById('share');
const bnrButton=document.getElementById('bnr');
const vbgButton=document.getElementById('vbg');

// 3)Setting Initiated Variables to Null.
let createdMeeting = null;
let localStream = null;
let isMuted = true;
let isVideoStarted = true;
// 4)Webex Initialize.
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

// 9) Joinning the Meeting and add Local Streams to meeting.
async function joinMeetingWithMedia(localStreams) {
  try {
    //const shareAudioEnabled = true;
   // const shareVideoEnabled = true;
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
joinMeetingButton.addEventListener('click',joinMeeting);
async function joinMeeting() {
  document.getElementById("joinMeetingButton").style.display = "none";
  $('#joinMeetingModal').modal('show');
  var element = document.querySelector('.container3');
  element.classList.add('blur');
  try {
    await createMeeting();
    setMediaListeners();
    localStream = await getLocalStreams();
    await joinMeetingWithMedia(localStream);
  } catch (error) {
    console.error('Error joining meeting:', error);
    reset();
  }
}

// 11) Leaving Meeting Listener and Function.
leaveMeetingButton.addEventListener('click',leaveMeeting);
async function leaveMeeting() {
  try {
    const confirmLeave = window.confirm("Are you sure you want to leave the meeting?");
    if(confirmLeave){
      joinMeetingButton.style.display = 'block';
    await createdMeeting.leave();
    reset();
  }
}
  catch (error) {
    console.error('Error leaving meeting:', error);
    reset();
    
  }
}

// 12) Start and Stop Button using toggleVideo Function.
videoButton.addEventListener('click',toggleVideo);
async function toggleVideo() {
  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  // Stop Video
  if (isVideoStarted) {
    await createdMeeting.unpublishStreams([localStream.camera]);
    localVideo.srcObject = null;
    videoButton.innerHTML = '<img src="./images/stop.png" style="width: 25px; height: 25px;">';
    isVideoStarted = false;
  } 
  //Start Video
  else {
    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream({ width: 640, height: 480 });
    localStream.camera = cameraStream;
    localVideo.srcObject = cameraStream.outputStream;
    await createdMeeting.publishStreams({ camera: localStream.camera });
    // Update button to display "Stop"
    videoButton.innerHTML = '<img src="./images/video-camera.png" style="width: 25px; height: 25px;">';
    isVideoStarted = true;
  }
}

// 13) Mute and UnMute Button using toggleMicrophone Function
microphoneButton.addEventListener('click',toggleMicrophone);
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
      await createdMeeting.publishStreams({microphone: localStream.microphone});
      microphoneButton.innerHTML = '<img src="./images/voice.png" style="width: 25px; height: 25px;">';
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
    microphoneButton.innerHTML = '<img src="./images/mute.png" style="width: 25px; height: 25px;">';
    isMuted = false;
  }
}

// 14) Reset All Streams using reset function inside calling cleanupMedia Function.
function reset() {
  $('#joinMeetingModal').modal('hide');
  document.querySelector('.container3').classList.remove('blur');
  cleanUpMedia();
  createdMeeting = null;
  isMuted = true;
  isVideoStarted = true;
  microphoneButton.innerHTML = '<img src="./images/voice.png" style="width: 25px; height: 25px;">';
  videoButton.innerHTML = '<img src="./images/video-camera.png" style="width: 25px; height: 25px;">';
}
// 15) Cleaning Up the Media usinf cleanUpMedia function.
function cleanUpMedia() {
  [localVideo, RemoteVideo, RemoteAudio].forEach((elem) => {
    if (elem.srcObject) {
      try {
        elem.srcObject.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.log('Cleanup media error:', error);
      } finally {
        elem.srcObject = null;
      }
    }
  });
}

//16)Added the Local Share System using Share Button.
shareButton.addEventListener('click',localshare)
async function localshare(){
  const [localShareVideoStream, localShareAudioStream] =
  await webex.meetings.mediaHelpers.createDisplayStreamWithAudio();
   await createdMeeting.publishStreams({
    screenShare: {
      video: localShareVideoStream,
      audio: localShareAudioStream,
    }
  });
}

//17) Enabled BNR using Event Listeners and toggleBNR Function.
bnrButton.addEventListener('click',toggleBNR);
  async function toggleBNR() {
    let bnrEffect=null;
    if (!localStream || !localStream.microphone) {
        console.error('No local microphone stream available.');
        return;
    }

    try {
        if (!bnrEffect) {
            bnrEffect = await webex.meetings.createNoiseReductionEffect();
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

//18) Enabled VBG using Event Listeners and toggleVBG Function.
document.getElementById('vbg').addEventListener('click',toggleVBG);
async function toggleVBG(){
  let vbgEffect=null;

  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  try{
    if(!vbgEffect){
      vbgEffect=await webex.meetings.createVirtualBackgroundEffect();
      await localStream.camera.addEffect(vbgEffect);
    }
    if(vbgEffect.isEnabled){
      await vbgEffect.disable();
      bnrButton.classList.remove('selected');

    }else{
      await vbgEffect.enable();
            console.log('VBG enabled');
            vbgButton.classList.add('selected');
      
    }
}
catch(error){
  console.error('Error toggling VBG:', error);

}
}


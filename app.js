// Prerequisite Access Token(Hard Coded)
const myAccessToken = "";
let sip;

// Initialization and Registration
const webex = window.Webex.init({
    credentials: {
      access_token: myAccessToken
    }
  });
  
  webex.meetings.register()
    .catch((err) => {
      console.error('Error registering Webex device:', err);
      alert('Error registering Webex device. Check console for details.');
    });

// Function to format date to ISO string with timezone offset
function toISOStringWithOffset(date) {
    const tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            return (num < 10 ? '0' : '') + num;
        };
  
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
  }
  
// Get current date and the end of the day
const now = new Date();
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
// Format dates to ISO strings with timezone offsets
const fromDate = toISOStringWithOffset(startOfDay);
const toDate = toISOStringWithOffset(endOfDay);
  
const apiUrl = `https://webexapis.com/v1/meetings?meetingType=scheduledMeeting&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
let ongoingMeetingListElement;
let upcomingMeetingListElement;
let meetingDetailsElement;
async function fetchMeetings() {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${myAccessToken}`
            }
        });
        const data = await response.json();
        console.log('API Response:', data); // Log the full response

        if (Array.isArray(data.items)) {
            displayOngoingMeetings(data.items);
            displayUpcomingMeetings(data.items);
        } else {
            throw new Error("Received data is not an array");
        }
    } catch (error) {
        console.error('Error fetching meetings:', error);
        ongoingMeetingListElement.innerHTML = '<p>Failed to load ongoing meetings. Please try again later.</p>';
        upcomingMeetingListElement.innerHTML = '<p>Failed to load upcoming meetings. Please try again later.</p>';
    }
}

function displayMeetingDetails(meeting) {
    meetingDetailsElement.innerHTML = ''; // Clear previous details
    sip=meeting.sipAddress;

    const detailsHTML = `
    <p><strong style="color:#00aaff;">Meeting Title</strong></p>
    <p>${meeting.title}</p>
    <p><strong style="color:#00aaff;">Meeting Link</strong></p>
    <p>${meeting.webLink}</p>
    <p><strong style="color:#00aaff">Meeting Number</strong></p>
    <p>${meeting.meetingNumber}</p>
    <p><strong style="color:#00aaff">Host Key</strong></p>
    <p>${meeting.hostKey}</p>
    <p><strong style="color:#00aaff">Password</strong></p>
    <p>${meeting.password}</p>
    <p><strong style="color:#00aaff">Access Code</strong></p>
    <p>${meeting.telephony.accessCode}</p>
    <p><strong style="color:#00aaff">Sip Address</strong></p>
    <p>${meeting.sipAddress}<p/>
`;
meetingDetailsElement.innerHTML = detailsHTML;

    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join Meeting';
    joinButton.addEventListener('click',joinMeeting)
    joinButton.classList.add('btn', 'join-btn');
    meetingDetailsElement.appendChild(joinButton);
}
function createMeetingList(meetings, filterFn, listElement, emptyMessage) {
    const filteredMeetings = meetings.filter(filterFn);

    if (filteredMeetings.length === 0) {
        listElement.innerHTML = `<p>${emptyMessage}</p>`;
        return;
    }

    listElement.innerHTML = '';

    filteredMeetings.forEach(meeting => {
        const meetingElement = document.createElement('div');
        meetingElement.classList.add('meeting');

        meetingElement.onclick = () => displayMeetingDetails(meeting);

        const meetingTitle = document.createElement('h2');
        meetingTitle.textContent = meeting.title || 'No title provided';
        meetingElement.appendChild(meetingTitle);

        const meetingDate = document.createElement('p');
        meetingDate.textContent = `Date: ${new Date(meeting.start).toLocaleString()}`;
        meetingElement.appendChild(meetingDate);

        const meetingOrganizer = document.createElement('p');
        meetingOrganizer.textContent = `Organizer: ${meeting.hostDisplayName || 'Unknown'}`;
        meetingElement.appendChild(meetingOrganizer);

        listElement.appendChild(meetingElement);
    });
}

function displayOngoingMeetings(meetings) {
    const now = new Date();
    createMeetingList(
        meetings,
        meeting => {
            const start = new Date(meeting.start);
            const end = new Date(meeting.end);
            return start <= now && now <= end;
        },
        ongoingMeetingListElement,
        'No current meetings found.'
    );
}

function displayUpcomingMeetings(meetings) {
    const now = new Date();
    createMeetingList(
        meetings,
        meeting =>
            new Date(meeting.start) > now,
            upcomingMeetingListElement,
            'No upcoming meetings found.'
    );
}
document.addEventListener('DOMContentLoaded', () => {
    ongoingMeetingListElement = document.getElementById('ongoing-meeting-list');
    upcomingMeetingListElement = document.getElementById('upcoming-meeting-list');
    meetingDetailsElement = document.getElementById('meeting-details');
    fetchMeetings();
});

// Join Meeting Process
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
const mirrorButton = document.getElementById('mirror');
const icon = document.getElementById('mic-icon');
const icon1 = document.getElementById('video-icon');

// Setting Meeting Control Variables
let createdMeeting = null;
let localStream = null;
let isMuted = true;
let isVideoStarted = true;
let vbgEffect = false;
let mirrorEffect = false;

// Created Meeting
async function createMeeting() {
  try {
    const meeting = await webex.meetings.create(sip);
    createdMeeting = meeting;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

// Set Media Listeners
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

// Set Local Streams
async function getLocalStreams() {
  try {
    const microphoneStream = await webex.meetings.mediaHelpers.createMicrophoneStream({
      echoCancellation: true,
      noiseSuppression: true,
    });

    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream();
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

// Join Meeting with Media Function
async function joinMeetingWithMedia(localStreams) {
  try {
    const meetingOptions = {
      mediaOptions: {
        allowMediaInLobby: true,
        shareAudioEnabled: false,
        shareVideoEnabled: false,
        audioEnabled:true,
        videoEnabled:true,
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

// Join Meeting By clicking Join Meeting Button
async function joinMeeting() {
  document.getElementById("page1").classList.add('blur');
  document.getElementById("localvideoimage").style.display = "none";
  $('#joinMeetingModal').modal('show');
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

// Leave Meeting Function
leaveMeetingButton.addEventListener('click', leaveMeeting);
async function leaveMeeting() {
  try {
    const confirmLeave = window.confirm("Are you sure you want to leave the meeting?");
    if(confirmLeave){
      await createdMeeting.leave();
      document.getElementById("page1").classList.remove('blur');
      $('#joinMeetingModal').modal('hide');
      //for microphone icon reset
      if (icon.classList.contains('fa-microphone-slash')) {
        icon.classList.remove('fa-microphone-slash', 'red');
        icon.classList.add('fa-microphone', 'green');
      }
      // for video icon reset
      if (icon1.classList.contains('fa-video-slash')) {
        icon1.classList.add('fa-video', 'green');
        icon1.classList.remove('fa-video-slash', 'red');
      }
      bnrButton.classList.remove('selected');
      vbgButton.classList.remove('selected');
      createdMeeting = null;
      localStream = null;
      isMuted = true;
      isVideoStarted = true;
      vbgEffect = false;
      mirrorEffect = false;
    }
  } catch (error) {
    console.error('Error leaving meeting:', error);
    document.getElementById("page1").classList.remove('blur');
    $('#joinMeetingModal').modal('hide');
    //for microphone icon reset
    if (icon.classList.contains('fa-microphone-slash')) {
      icon.classList.remove('fa-microphone-slash', 'red');
      icon.classList.add('fa-microphone', 'green');
    }
    // for video icon reset
    if (icon1.classList.contains('fa-video-slash')) {
      icon1.classList.add('fa-video', 'green');
      icon1.classList.remove('fa-video-slash', 'red');
    }
    bnrButton.classList.remove('selected');
    vbgButton.classList.remove('selected');
    createdMeeting = null;
    localStream = null;
    isMuted = true;
    isVideoStarted = true;
    vbgEffect = false;
    mirrorEffect = false;
  }
}

// Start and Stop Local Video 
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
    icon1.classList.remove('fa-video', 'green');
    icon1.classList.add('fa-video-slash', 'red');
    document.getElementById("localvideoimage").style.display = "block";
    
    isVideoStarted = false;
    vbgButton.classList.remove('selected');
    if (vbgEffect && vbgEffect.isEnabled) {
      await vbgEffect.disable();
    }
    vbgEffect = false;
    mirrorEffect = false;

  } 
  // Start Video
  else {
    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream();
    localStream.camera = cameraStream;
    localVideo.srcObject = cameraStream.outputStream;
    await createdMeeting.publishStreams({ camera: localStream.camera });
    icon1.classList.add('fa-video', 'green');
    icon1.classList.remove('fa-video-slash', 'red');
    document.getElementById("localvideoimage").style.display = "none";
    isVideoStarted = true;
  }
}

// Mute and Unmute Audio
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
      icon.classList.add('fa-microphone', 'green');
      icon.classList.remove('fa-microphone-slash', 'red');
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
    icon.classList.remove('fa-microphone', 'green');
    icon.classList.add('fa-microphone-slash', 'red');
    isMuted = false;
  }
}

// Share Local Screen
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

// Enable BNR Feature
bnrButton.addEventListener('click', toggleBNR);
async function toggleBNR() {
  let bnrEffect = null;
  if (!localStream || !localStream.microphone) {
    console.error('No local microphone stream available.');
    return;
  }

  try {
    if (!bnrEffect) {
      bnrEffect = await localStream.microphone.getEffectByKind('noise-reduction-effect');
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

// Enable Background Blur
vbgButton.addEventListener('click', toggleVBG);
async function toggleVBG() {
  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  try {
    if (!vbgEffect) {
      vbgEffect = await webex.meetings.createVirtualBackgroundEffect(
        {
          mode: 'BLUR',
          blurStrength: 'STRONGER',
        }
      );
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

// Enable Mirror Effect
mirrorButton.addEventListener('click',toggleMirror);
async function toggleMirror(){
  if (!localStream || !localStream.camera || !localStream.camera.outputStream) {
    console.error('No local video stream available.');
    return;
  }
  if(!mirrorEffect){
    localVideo.classList.add('mirror');
    mirrorButton.classList.add('selected');
    mirrorEffect=true;

  }
  else{
    localVideo.classList.remove('mirror');
    mirrorButton.classList.remove('selected');
    mirrorEffect=false;
  }

}

// Handling Permission
async function handlePermissionChange(permissionName) {
  const permission = await navigator.permissions.query({ name: permissionName });
  permission.onchange = async () => {
    if (permission.state !== 'granted') {
      if (permissionName === 'camera') {
        if (isVideoStarted) {
          toggleVideo();
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
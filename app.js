// Prerequisite data SIP and Access Token(Hard Coded)
const myAccessToken = "";
const sip = "";
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

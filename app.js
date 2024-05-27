// Prerequisite data SIP and Access Token(Hard Coded)
const myAccessToken = "ODcwYWE1MDQtODc5ZC00ZDhiLWI5ODYtZTk0ZGUyNTA4YzM2MTIwNmIzOTQtZDhm_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f";
const sip = "pasoma.cisco@webex.com";

document.addEventListener('DOMContentLoaded', () => {
    const ongoingMeetingListElement = document.getElementById('ongoing-meeting-list');
    const upcomingMeetingListElement = document.getElementById('upcoming-meeting-list');
    const meetingDetailsElement = document.getElementById('meeting-details');
    
    const webhookApiUrl = 'https://webexapis.com/v1/meetings';
    
    async function fetchMeetings() {
        try {
            const response = await fetch(webhookApiUrl, {
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
            <p><strong>Meeting Link:</strong> ${meeting.webLink}</p>
            <p><strong>Meeting Number:</strong> ${meeting.meetingNumber}</p>
            <p><strong>Host Key:</strong> ${meeting.hostKey}</p>
            <p><strong>Password:</strong> ${meeting.password}</p>
            <p><strong>Access Code:</strong> ${meeting.telephony.accessCode}</p>
            <p><strong>Sip Address:</strong> ${meeting.sipAddress}</p>
        `;
        meetingDetailsElement.innerHTML = detailsHTML;

        const joinButton = document.createElement('button');
        joinButton.innerText = 'Join Meeting';
        joinButton.classList.add('btn', 'join-btn');
        joinButton.addEventListener('click', () => {
            window.open(meeting.webLink, '_blank');
            });
        meetingDetailsElement.appendChild(joinButton);
    }

    function displayOngoingMeetings(meetings) {
        const now = new Date();
        const ongoingMeetings = meetings.filter(meeting => {
            const start = new Date(meeting.start);
            const end = new Date(meeting.end);
            return start <= now && now <= end;
        });

        if (ongoingMeetings.length === 0) {
            ongoingMeetingListElement.innerHTML = '<p>No current meetings found.</p>';
            return;
        }

        ongoingMeetingListElement.innerHTML = '';

        ongoingMeetings.forEach(meeting => {
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

            ongoingMeetingListElement.appendChild(meetingElement);
        });
    }

    function displayUpcomingMeetings(meetings) {
        const now = new Date();
        const upcomingMeetings = meetings.filter(meeting => {
            const start = new Date(meeting.start);
            return start > now;
        });

        if (upcomingMeetings.length === 0) {
            upcomingMeetingListElement.innerHTML = '<p>No upcoming meetings found.</p>';
            return;
        }

        upcomingMeetingListElement.innerHTML = '';

        upcomingMeetings.forEach(meeting => {
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

            upcomingMeetingListElement.appendChild(meetingElement);
        });
    }

    fetchMeetings();
});

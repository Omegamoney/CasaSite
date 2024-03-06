const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const statusGif = document.getElementById('status-gif');
const workAudio = document.getElementById('workAudio');
const homeAudio = document.getElementById('homeAudio');
const muteButton = document.getElementById('mute-toggle');
// Set the volume to 20%
workAudio.volume = 0.2;
homeAudio.volume = 0.2;
let isMuted = false;

const homeTimeHours = {
    'monday': 18,
    'tuesday': 18,
    'wednesday': 18,
    'thursday': 18,
    'friday': 17
};

const startWorkHour = 8; // Work starts at 08:00

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    updateAudio();
});
function updateAudio() {
    if (isMuted) {
        workAudio.pause();
        homeAudio.pause();
    } else {
        playCurrentStateAudio();
    }
}
function playCurrentStateAudio() {
    if (isMuted) {
        return;
    }
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.getDay();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today];
    const endWorkHour = homeTimeHours[dayOfWeek] || 18; // Default to 18 if not specified

    if (today === 0 || today === 6) { // If it's weekend, play home audio
        workAudio.pause();
        if (!homeAudio.playing) {
            homeAudio.play();
        }
    } else if (currentHour >= startWorkHour && currentHour < endWorkHour) {
        homeAudio.pause();
        if (!workAudio.playing) {
            workAudio.play();
        }
    } else {
        workAudio.pause();
        if (!homeAudio.playing) {
            homeAudio.play();
        }
    }
}

function calculateTimeUntilHome() {
    const now = new Date();
    const today = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today];

    // If it's the weekend, don't do anything
    if (today === 0 || today === 6) return;

    let currentHour = now.getHours();
    let targetHour = homeTimeHours[dayOfWeek] || 0;
    let startHour = startWorkHour;
    let targetMinute = 0;
    let targetSecond = 0;

    // Check if it's past start time and before end time, show guradance.gif and play beneath the mask
    if (currentHour >= startHour && currentHour < targetHour && statusGif.src !== 'https://casa.stellaraeon.app/guradance.gif') {
        statusGif.src = 'guradance.gif';
    }

    // Check if it's time to go home and show toothless.gif and play the song specialist
    if (currentHour >= targetHour && now.getMinutes() >= targetMinute && statusGif.src !== 'https://casa.stellaraeon.app/toothless.gif') {
        statusGif.src = 'toothless.gif';
        secondsUntilHome = 0
        updateAudio();
        return;
    }

    // Calculate remaining time until home
    let secondsUntilHome = (targetHour - currentHour) * 3600 +
        (targetMinute - now.getMinutes()) * 60 +
        (targetSecond - now.getSeconds());

    // If it's before start time, calculate remaining time until work starts
    if (currentHour < startHour) {
        secondsUntilHome = (startHour - currentHour) * 3600 -
            now.getMinutes() * 60 -
            now.getSeconds();
    }

    let hours = Math.floor(secondsUntilHome / 3600);
    let minutes = Math.floor((secondsUntilHome % 3600) / 60);
    let seconds = secondsUntilHome % 60;

    // Display the time
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
    playCurrentStateAudio();
}

// Call the function initially and update every second
calculateTimeUntilHome();
setInterval(calculateTimeUntilHome, 1000);
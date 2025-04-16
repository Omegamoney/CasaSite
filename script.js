// script.js
const DateTime = luxon.DateTime;
let currentGif = "";
let selectedTimeZone = "browser";

// Load saved timezone preference, if any
document.addEventListener('DOMContentLoaded', () => {
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) {
        selectedTimeZone = savedTimezone;
        const timezoneDropdown = document.getElementById('timezone-dropdown');
        timezoneDropdown.value = savedTimezone;
    }
});

// Populate timezone dropdown automatically using Intl.supportedValuesOf if available
function populateTimezones() {
    const timezoneDropdown = document.getElementById('timezone-dropdown');
    timezoneDropdown.innerHTML = '';

    // Add the Browser Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "browser";
    defaultOption.textContent = "Padrão do Navegador";
    timezoneDropdown.appendChild(defaultOption);

    let timezones = [];
    if (Intl.supportedValuesOf) {
        timezones = Intl.supportedValuesOf('timeZone');
    } else {
        // Fallback list if not supported
        timezones = [
            "America/New_York",
            "Europe/London",
            "Asia/Tokyo",
            "Australia/Sydney"
        ];
    }

    // Sort timezones alphabetically
    timezones.sort();

    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz;
        timezoneDropdown.appendChild(option);
    });

    timezoneDropdown.addEventListener('change', (e) => {
        selectedTimeZone = e.target.value;
        // Save the selected timezone locally
        localStorage.setItem('timezone', selectedTimeZone);
    });
}

// Get current time as a Luxon DateTime, in the chosen timezone (or local if "browser")
function getCurrentTime() {
    if (selectedTimeZone === "browser") {
        return DateTime.now();
    } else {
        return DateTime.now().setZone(selectedTimeZone);
    }
}

function updateCountdown() {
    const now = getCurrentTime();
    let targetTime;
    let afterHours = false;
    let displayDays = false;

    // Luxon weekday: 1 = Monday, ..., 7 = Sunday
    if (now.weekday >= 1 && now.weekday <= 4) { // Monday to Thursday
        targetTime = now.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    } else if (now.weekday === 5) { // Friday
        targetTime = now.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
    } else { // Saturday and Sunday
        targetTime = now.plus({ days: (8 - now.weekday) }).set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    }

    if (now > targetTime) { // After hours
        afterHours = true;
        if (now.weekday === 5 || now.weekday === 6) {
            targetTime = now.plus({ days: (8 - now.weekday) }).set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
            displayDays = true;
        } else {
            targetTime = now.plus({ days: 1 }).set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
        }
    }

    const diffMillis = targetTime.toMillis() - now.toMillis();
    const hours = Math.floor(diffMillis / (1000 * 60 * 60));
    const minutes = Math.floor((diffMillis % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMillis % (1000 * 60)) / 1000);
    let days = 0;

    if (displayDays) {
        days = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
    }

    const timerElement = document.getElementById('timer');
    timerElement.innerHTML = `
        <div class="timer-box">
            ${hours}
            <span>Horas</span>
        </div>
        <div class="timer-box">
            ${minutes}
            <span>Minutos</span>
        </div>
        <div class="timer-box">
            ${seconds}
            <span>Segundos</span>
        </div>
        ${displayDays ? `<div class="timer-box timer-box-extra">${days}<span>Dias</span></div>` : ""}
    `;

    const header = document.querySelector('h1');
    header.textContent = afterHours ? "Tempo de Descanso" : "Tempo Restante";

    const gif = document.getElementById('gif-img');
    if (!afterHours && currentGif !== "daytime.gif") {
        gif.src = "daytime.gif";
        gif.alt = "Daytime gif";
        currentGif = "daytime.gif";
    } else if (afterHours && currentGif !== "afterhours.gif") {
        gif.src = "afterhours.gif";
        gif.alt = "After hours gif";
        currentGif = "afterhours.gif";
    }

    updateProgressBar(); // Update the progress bar based on current time
}

// Update the progress bar based on the working day's progress
function updateProgressBar() {
    const now = getCurrentTime();
    const progressBar = document.getElementById('progress-bar');
    
    // Only calculate progress for weekdays (Monday-Friday)
    if (now.weekday >= 1 && now.weekday <= 5) {
        const workStart = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
        let workEnd;
        if (now.weekday === 5) {
            workEnd = now.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
        } else {
            workEnd = now.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
        }
        let progress;
        if (now < workStart) {
            progress = 0;
        } else if (now > workEnd) {
            progress = 100;
        } else {
            progress = ((now.toMillis() - workStart.toMillis()) / (workEnd.toMillis() - workStart.toMillis())) * 100;
        }
        progressBar.style.width = `${progress}%`;
    } else {
        // For weekends, set the bar to full (or you could hide it)
        progressBar.style.width = "100%";
    }
}

populateTimezones();
setInterval(updateCountdown, 1000);

// PWA Integration
let deferredPrompt;
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
        });
    });
}
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById("installButton");
    if (installButton) {
        installButton.style.display = "block";
        installButton.addEventListener("click", () => {
            installButton.style.display = "none";
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                    console.log("User accepted the install prompt");
                } else {
                    console.log("User dismissed the install prompt");
                }
                deferredPrompt = null;
            });
        });
    }
});

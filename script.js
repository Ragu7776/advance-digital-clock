document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    // Clock
    const timeDisplay = document.getElementById('timeDisplay');
    const dateDisplay = document.getElementById('dateDisplay');
    const dayDisplay = document.getElementById('dayDisplay');
    const toggleTimeFormatBtn = document.getElementById('toggleTimeFormatBtn');
    const timezoneSelect = document.getElementById('timezoneSelect');

    // Stopwatch
    const stopwatchDisplay = document.getElementById('stopwatchDisplay');
    const startStopwatchBtn = document.getElementById('startStopwatchBtn');
    const pauseStopwatchBtn = document.getElementById('pauseStopwatchBtn');
    const resetStopwatchBtn = document.getElementById('resetStopwatchBtn');
    const lapStopwatchBtn = document.getElementById('lapStopwatchBtn');
    const lapTimesList = document.getElementById('lapTimesList');

    // Countdown
    const countdownHourInput = document.getElementById('countdownHour');
    const countdownMinuteInput = document.getElementById('countdownMinute');
    const countdownSecondInput = document.getElementById('countdownSecond');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const startCountdownBtn = document.getElementById('startCountdownBtn');
    const pauseCountdownBtn = document.getElementById('pauseCountdownBtn');
    const resetCountdownBtn = document.getElementById('resetCountdownBtn');

    // Alarm
    const alarmHourInput = document.getElementById('alarmHour');
    const alarmMinuteInput = document.getElementById('alarmMinute');
    const setAlarmBtn = document.getElementById('setAlarmBtn');
    const clearAlarmBtn = document.getElementById('clearAlarmBtn');
    const currentAlarmDisplay = document.getElementById('currentAlarmDisplay');

    // Theme Toggle
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const body = document.body;

    // Audio Elements
    const alarmSound = document.getElementById('alarmSound');
    const buttonClickSound = document.getElementById('buttonClickSound');


    // --- Global Variables (Clock & Settings) ---
    let is24HourFormat = false; // Default to 12-hour
    let selectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to local time zone
    const commonTimeZones = [
        { name: 'Your Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
        { name: 'Kolkata (IST)', value: 'Asia/Kolkata' },
        { name: 'New York (EST)', value: 'America/New_York' },
        { name: 'London (GMT)', value: 'Europe/London' },
        { name: 'Tokyo (JST)', value: 'Asia/Tokyo' },
        { name: 'Sydney (AEST)', value: 'Australia/Sydney' },
        { name: 'Dubai (GST)', value: 'Asia/Dubai' },
        { name: 'Los Angeles (PST)', value: 'America/Los_Angeles' },
        { name: 'Berlin (CET)', value: 'Europe/Berlin' },
    ];

    // --- Global Variables (Stopwatch) ---
    let stopwatchStartTime;
    let stopwatchElapsedTime = 0;
    let stopwatchTimerInterval;
    let isStopwatchRunning = false;
    let lapTimes = [];
    let lastLapTime = 0;

    // --- Global Variables (Countdown) ---
    let countdownTotalTime = 0; // Total time in milliseconds for countdown
    let countdownRemainingTime = 0; // Remaining time in milliseconds
    let countdownTimerInterval;
    let isCountdownRunning = false;
    let countdownInputDisabled = false; // To prevent input changes while running/paused

    // --- Global Variables (Alarm) ---
    let alarmTime = null; // Stores the alarm time (Date object)
    let alarmInterval; // For checking alarm


    // --- Helper Functions ---
    function playClickSound() {
        buttonClickSound.currentTime = 0; // Rewind to start if already playing
        buttonClickSound.play().catch(e => console.log("Audio play failed:", e)); // Catch promise rejection
    }

    // Formats milliseconds into HH:MM:SS.ms (for stopwatch)
    function formatMsToHMSms(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10); // Show up to 2 decimal places for ms

        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        const formattedMilliseconds = String(milliseconds).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    }

    // Formats milliseconds into HH:MM:SS (for countdown)
    function formatMsToHMS(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000)); // Ensure non-negative
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }


    // --- Digital Clock Functions ---
    function updateClock() {
        const now = new Date();

        // Time formatting based on selectedTimeZone and is24HourFormat
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !is24HourFormat,
            timeZone: selectedTimeZone
        };
        const currentTime = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
        timeDisplay.textContent = currentTime;

        // Date and Day formatting (can also use timeZone if needed)
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: selectedTimeZone
        };
        const currentDate = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
        dateDisplay.textContent = currentDate;

        const dayOptions = {
            weekday: 'long',
            timeZone: selectedTimeZone
        };
        const currentDay = new Intl.DateTimeFormat('en-US', dayOptions).format(now);
        dayDisplay.textContent = currentDay;
    }

    // --- Stopwatch Functions ---
    function updateStopwatchDisplay() {
        const now = Date.now();
        stopwatchElapsedTime = now - stopwatchStartTime;
        stopwatchDisplay.textContent = formatMsToHMSms(stopwatchElapsedTime);
    }

    function addLap() {
        const currentLapElapsedTime = stopwatchElapsedTime - lastLapTime;
        lastLapTime = stopwatchElapsedTime;

        lapTimes.push({
            total: stopwatchElapsedTime,
            lap: currentLapElapsedTime
        });

        renderLapTimes();
        lapTimesList.scrollTop = lapTimesList.scrollHeight; // Scroll to bottom
    }

    function renderLapTimes() {
        lapTimesList.innerHTML = '';
        lapTimes.forEach((lap, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Lap ${index + 1}:</span>
                <span>${formatMsToHMSms(lap.lap)}</span>
                <span>(Total: ${formatMsToHMSms(lap.total)})</span>
            `;
            lapTimesList.appendChild(li);
        });
    }

    // --- Countdown Functions ---
    function setCountdownTime() {
        const hours = parseInt(countdownHourInput.value) || 0;
        const minutes = parseInt(countdownMinuteInput.value) || 0;
        const seconds = parseInt(countdownSecondInput.value) || 0;

        countdownTotalTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
        countdownRemainingTime = countdownTotalTime;
        countdownDisplay.textContent = formatMsToHMS(countdownRemainingTime);

        // Enable/disable buttons based on whether time is set
        const hasTime = countdownTotalTime > 0;
        startCountdownBtn.disabled = !hasTime;
        resetCountdownBtn.disabled = !hasTime;
        countdownInputDisabled = false; // Allow input changes initially
    }

    function updateCountdownDisplay() {
        countdownRemainingTime -= 1000; // Decrement by 1 second

        if (countdownRemainingTime <= 0) {
            countdownRemainingTime = 0;
            clearInterval(countdownTimerInterval);
            isCountdownRunning = false;
            countdownDisplay.textContent = '00:00:00';
            alarmSound.play().catch(e => console.log("Audio play failed:", e));
            alert('Countdown finished!');
            resetCountdown(); // Automatically reset after completion
            return;
        }

        countdownDisplay.textContent = formatMsToHMS(countdownRemainingTime);
    }

    function startCountdown() {
        if (!isCountdownRunning && countdownRemainingTime > 0) {
            isCountdownRunning = true;
            countdownTimerInterval = setInterval(updateCountdownDisplay, 1000);

            startCountdownBtn.disabled = true;
            pauseCountdownBtn.disabled = false;
            resetCountdownBtn.disabled = false;
            countdownInputDisabled = true;
            toggleCountdownInputs(true);
        }
    }

    function pauseCountdown() {
        if (isCountdownRunning) {
            isCountdownRunning = false;
            clearInterval(countdownTimerInterval);

            startCountdownBtn.disabled = false;
            pauseCountdownBtn.disabled = true;
            countdownInputDisabled = true;
            toggleCountdownInputs(true);
        }
    }

    function resetCountdown() {
        isCountdownRunning = false;
        clearInterval(countdownTimerInterval);
        countdownTotalTime = 0;
        countdownRemainingTime = 0;
        countdownDisplay.textContent = '00:00:00';

        countdownHourInput.value = '';
        countdownMinuteInput.value = '';
        countdownSecondInput.value = '';

        startCountdownBtn.disabled = true; // No time set
        pauseCountdownBtn.disabled = true;
        resetCountdownBtn.disabled = true;
        countdownInputDisabled = false;
        toggleCountdownInputs(false);
    }

    function toggleCountdownInputs(disable) {
        countdownHourInput.disabled = disable;
        countdownMinuteInput.disabled = disable;
        countdownSecondInput.disabled = disable;
    }


    // --- Alarm Functions ---
    function setAlarm() {
        playClickSound(); // Play sound on set
        const hour = parseInt(alarmHourInput.value);
        const minute = parseInt(alarmMinuteInput.value);

        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            alert('Please enter a valid alarm time (HH:MM).');
            return;
        }

        const now = new Date();
        alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

        // If the alarm time is in the past for today, set it for tomorrow
        if (alarmTime.getTime() < now.getTime()) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }

        const formattedAlarmTime = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: 'numeric',
            month: 'short'
        }).format(alarmTime);

        currentAlarmDisplay.textContent = `Alarm set for: ${formattedAlarmTime}`;
        setAlarmBtn.disabled = true;
        clearAlarmBtn.disabled = false;
        alarmHourInput.disabled = true;
        alarmMinuteInput.disabled = true;

        // Start checking for alarm every second
        alarmInterval = setInterval(checkAlarm, 1000);
        alert(`Alarm set for ${formattedAlarmTime}`);
    }

    function clearAlarm() {
        playClickSound(); // Play sound on clear
        clearInterval(alarmInterval);
        alarmTime = null;
        currentAlarmDisplay.textContent = 'No alarm set';
        setAlarmBtn.disabled = false;
        clearAlarmBtn.disabled = true;
        alarmHourInput.disabled = false;
        alarmMinuteInput.disabled = false;
        alarmHourInput.value = '';
        alarmMinuteInput.value = '';
        alert('Alarm cleared!');
    }

    function checkAlarm() {
        if (!alarmTime) return;

        const now = new Date();
        // Check if current time is equal to or past alarm time within the same minute
        if (now.getHours() === alarmTime.getHours() &&
            now.getMinutes() === alarmTime.getMinutes() &&
            now.getSeconds() >= alarmTime.getSeconds() &&
            now.getTime() >= alarmTime.getTime()) {
            alarmSound.play().catch(e => console.log("Audio play failed:", e));
            alert('ALARM! Time to wake up!');
            clearAlarm();
        }
    }


    // --- Local Storage Functions ---
    function savePreferences() {
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        localStorage.setItem('is24HourFormat', is24HourFormat);
        localStorage.setItem('selectedTimeZone', selectedTimeZone);
        // Could also save stopwatch state, lap times, countdown state, alarm state, but adds complexity.
    }

    function loadPreferences() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            toggleThemeBtn.textContent = '☀️ Light Mode';
        } else {
            body.classList.remove('dark-mode');
            toggleThemeBtn.textContent = '🌙 Dark Mode';
        }

        const savedFormat = localStorage.getItem('is24HourFormat');
        if (savedFormat !== null) {
            is24HourFormat = (savedFormat === 'true');
            toggleTimeFormatBtn.textContent = is24HourFormat ? '12-Hr Format' : '24-Hr Format';
        }

        const savedTimeZone = localStorage.getItem('selectedTimeZone');
        if (savedTimeZone && commonTimeZones.some(tz => tz.value === savedTimeZone)) {
            selectedTimeZone = savedTimeZone;
        } else {
             // Fallback to local timezone if saved one is invalid/missing
            selectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    }


    // --- Event Listeners ---
    // Clock Controls
    toggleTimeFormatBtn.addEventListener('click', () => {
        playClickSound();
        is24HourFormat = !is24HourFormat;
        toggleTimeFormatBtn.textContent = is24HourFormat ? '12-Hr Format' : '24-Hr Format';
        updateClock();
        savePreferences();
    });

    timezoneSelect.addEventListener('change', (event) => {
        playClickSound();
        selectedTimeZone = event.target.value;
        updateClock();
        savePreferences();
    });

    // Stopwatch Controls
    startStopwatchBtn.addEventListener('click', () => {
        playClickSound();
        if (!isStopwatchRunning) {
            isStopwatchRunning = true;
            stopwatchStartTime = Date.now() - stopwatchElapsedTime;
            stopwatchTimerInterval = setInterval(updateStopwatchDisplay, 10); // Update every 10ms for milliseconds

            startStopwatchBtn.disabled = true;
            pauseStopwatchBtn.disabled = false;
            resetStopwatchBtn.disabled = false;
            lapStopwatchBtn.disabled = false;
        }
    });

    pauseStopwatchBtn.addEventListener('click', () => {
        playClickSound();
        if (isStopwatchRunning) {
            isStopwatchRunning = false;
            clearInterval(stopwatchTimerInterval);

            startStopwatchBtn.disabled = false;
            pauseStopwatchBtn.disabled = true;
        }
    });

    resetStopwatchBtn.addEventListener('click', () => {
        playClickSound();
        isStopwatchRunning = false;
        clearInterval(stopwatchTimerInterval);
        stopwatchElapsedTime = 0;
        lastLapTime = 0;
        lapTimes = [];
        stopwatchDisplay.textContent = '00:00:00.000';
        renderLapTimes();

        startStopwatchBtn.disabled = false;
        pauseStopwatchBtn.disabled = true;
        resetStopwatchBtn.disabled = true;
        lapStopwatchBtn.disabled = true;
    });

    lapStopwatchBtn.addEventListener('click', () => {
        playClickSound();
        if (isStopwatchRunning) {
            addLap();
        }
    });

    // Countdown Controls
    // Input event to update display immediately after setting time
    countdownHourInput.addEventListener('input', setCountdownTime);
    countdownMinuteInput.addEventListener('input', setCountdownTime);
    countdownSecondInput.addEventListener('input', setCountdownTime);

    startCountdownBtn.addEventListener('click', () => {
        playClickSound();
        startCountdown();
    });

    pauseCountdownBtn.addEventListener('click', () => {
        playClickSound();
        pauseCountdown();
    });

    resetCountdownBtn.addEventListener('click', () => {
        playClickSound();
        resetCountdown();
    });


    // Alarm Controls
    setAlarmBtn.addEventListener('click', setAlarm);
    clearAlarmBtn.addEventListener('click', clearAlarm);

    // Theme Toggle
    toggleThemeBtn.addEventListener('click', () => {
        playClickSound();
        body.classList.toggle('dark-mode');
        // Update button text based on current theme
        if (body.classList.contains('dark-mode')) {
            toggleThemeBtn.textContent = '☀️ Light Mode';
        } else {
            toggleThemeBtn.textContent = '🌙 Dark Mode';
        }
        savePreferences(); // Save theme preference
    });


    // --- Initialization on Load ---
    function initialize() {
        loadPreferences(); // Load preferences first

        // Populate Time Zone dropdown
        timezoneSelect.innerHTML = ''; // Clear existing options
        commonTimeZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.value;
            option.textContent = zone.name;
            if (zone.value === selectedTimeZone) {
                option.selected = true; // Select saved/default
            }
            timezoneSelect.appendChild(option);
        });

        // Initial update for clock and stopwatch
        updateClock();
        setInterval(updateClock, 1000); // Clock updates every second
        stopwatchDisplay.textContent = '00:00:00.000'; // Initial display for stopwatch

        // Initialize button states
        startStopwatchBtn.disabled = false;
        pauseStopwatchBtn.disabled = true;
        resetStopwatchBtn.disabled = true;
        lapStopwatchBtn.disabled = true;
        clearAlarmBtn.disabled = true;

        startCountdownBtn.disabled = true; // No time set initially
        pauseCountdownBtn.disabled = true;
        resetCountdownBtn.disabled = true;

        // Set current time in alarm inputs as default
        const now = new Date();
        alarmHourInput.value = String(now.getHours()).padStart(2, '0');
        alarmMinuteInput.value = String(now.getMinutes()).padStart(2, '0');

        // Set current time in countdown inputs as default (optional, can be empty)
        // countdownHourInput.value = '';
        // countdownMinuteInput.value = '';
        // countdownSecondInput.value = '';
    }

    initialize(); // Call initialization function
});
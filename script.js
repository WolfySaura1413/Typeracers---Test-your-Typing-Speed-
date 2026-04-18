const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "Actions speak louder than words.",
    "Practice makes perfect when learning how to type.",
    "Life is what happens when you're busy making other plans.",
    "The early bird catches the worm.",
    "Success is not final, failure is not fatal.",
    "Every cloud has a silver lining.",
    "Do not count your chickens before they hatch.",
    "Rome was not built in a day."
];

let targetSentence = "";
let previousValue = "";
let totalTyped = 0;
let totalErrors = 0;
let startTime = 0;
let timerInterval = null;
let isTyping = false;
let wpmHistory = [];
let lastSampleTime = 0;
let chartInstance = null;

// DOM Elements
const sentenceDisplay = document.getElementById('sentence-display');
const typingInput = document.getElementById('typing-input');
const wpmDisplay = document.getElementById('wpm-display');
const timeDisplay = document.getElementById('time-display');
const accuracyDisplay = document.getElementById('accuracy-display');
const errorsDisplay = document.getElementById('errors-display');

const btnRestart = document.getElementById('btn-restart');
const btnNewSentence = document.getElementById('btn-new-sentence');
const btnReplay = document.getElementById('btn-replay');
const resultsModal = document.getElementById('results-modal');
const pbNotification = document.getElementById('pb-notification');

// Initialize Game
function initGame(newSentence = true) {
    if (newSentence) {
        targetSentence = sentences[Math.floor(Math.random() * sentences.length)];
    }
    
    // Reset state
    clearInterval(timerInterval);
    isTyping = false;
    previousValue = "";
    totalTyped = 0;
    totalErrors = 0;
    wpmHistory = [];
    lastSampleTime = 0;
    
    // Reset DOM
    typingInput.value = "";
    typingInput.disabled = false;
    wpmDisplay.innerText = "0";
    timeDisplay.innerText = "0s";
    accuracyDisplay.innerText = "100%";
    errorsDisplay.innerText = "0";
    
    resultsModal.classList.add('hidden');
    
    renderSentence();
    typingInput.focus();
}

function renderSentence() {
    sentenceDisplay.innerHTML = "";
    targetSentence.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (index === 0) {
            span.className = 'char pending active';
        } else {
            span.className = 'char pending';
        }
        sentenceDisplay.appendChild(span);
    });
}

function updateSentenceDisplay() {
    const chars = sentenceDisplay.querySelectorAll('.char');
    const val = typingInput.value;
    
    chars.forEach((span, index) => {
        span.className = 'char';
        if (index < val.length) {
            if (val[index] === targetSentence[index]) {
                span.classList.add('correct');
            } else {
                span.classList.add('incorrect');
            }
        } else if (index === val.length) {
            span.classList.add('pending', 'active');
        } else {
            span.classList.add('pending');
        }
    });
}

function startTimer() {
    isTyping = true;
    startTime = Date.now();
    wpmHistory = [];
    lastSampleTime = 0;
    
    timerInterval = setInterval(() => {
        const timeElapsed = (Date.now() - startTime) / 1000;
        timeDisplay.innerText = timeElapsed.toFixed(1) + 's';
        
        const wpm = calculateWPM(timeElapsed);
        wpmDisplay.innerText = wpm;
        
        if (timeElapsed - lastSampleTime >= 0.5) {
            wpmHistory.push({ time: timeElapsed.toFixed(1), wpm });
            lastSampleTime = timeElapsed;
        }
    }, 100);
}

function calculateWPM(timeElapsedInSeconds) {
    if (timeElapsedInSeconds === 0) return 0;
    const words = typingInput.value.length / 5;
    const minutes = timeElapsedInSeconds / 60;
    return Math.round(words / minutes);
}

function updateStats() {
    const accuracy = totalTyped === 0 ? 100 : Math.round(((totalTyped - totalErrors) / totalTyped) * 100);
    accuracyDisplay.innerText = `${accuracy}%`;
    errorsDisplay.innerText = totalErrors;
}

function endGame() {
    clearInterval(timerInterval);
    isTyping = false;
    typingInput.disabled = true;
    
    const timeElapsed = (Date.now() - startTime) / 1000;
    const finalWpm = calculateWPM(timeElapsed);
    const accuracy = Math.round(((totalTyped - totalErrors) / totalTyped) * 100);
    
    document.getElementById('modal-wpm').innerText = finalWpm;
    document.getElementById('modal-time').innerText = timeElapsed.toFixed(1) + 's';
    document.getElementById('modal-accuracy').innerText = accuracy + '%';
    document.getElementById('modal-errors').innerText = totalErrors;
    
    // Add final sample for chart
    wpmHistory.push({ time: timeElapsed.toFixed(1), wpm: finalWpm });
    
    // Check PB
    const bestWpm = localStorage.getItem('typeracers_best_wpm') || 0;
    if (finalWpm > bestWpm) {
        localStorage.setItem('typeracers_best_wpm', finalWpm);
        pbNotification.classList.remove('hidden');
    } else {
        pbNotification.classList.add('hidden');
    }
    
    // Show modal
    resultsModal.classList.remove('hidden');
    
    // Draw chart
    drawChart();
}

function drawChart() {
    const ctx = document.getElementById('wpm-chart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const labels = wpmHistory.map(d => d.time + 's');
    const data = wpmHistory.map(d => d.wpm);
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'WPM',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: 'rgba(248, 250, 252, 0.7)' },
                    title: { display: true, text: 'WPM', color: 'rgba(248, 250, 252, 0.7)' }
                },
                x: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: 'rgba(248, 250, 252, 0.7)', maxTicksLimit: 10 },
                    title: { display: true, text: 'Time (s)', color: 'rgba(248, 250, 252, 0.7)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            }
        }
    });
}

// Event Listeners
typingInput.addEventListener('keydown', (e) => {
    // Disable Backspace
    if (e.key === 'Backspace') {
        e.preventDefault();
    }
    // Prevent arrow keys to mess up the cursor
    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
    }
});

typingInput.addEventListener('input', (e) => {
    let currentVal = typingInput.value;
    
    // Check if new chars added
    if (currentVal.length > previousValue.length) {
        if (!isTyping) startTimer();
        
        // Truncate to target sentence length if exceeded
        if (currentVal.length > targetSentence.length) {
            currentVal = currentVal.substring(0, targetSentence.length);
            typingInput.value = currentVal;
        }
        
        // Calculate new errors and typed count
        for (let i = previousValue.length; i < currentVal.length; i++) {
            totalTyped++;
            if (currentVal[i] !== targetSentence[i]) {
                totalErrors++;
            }
        }
        
        previousValue = currentVal;
        
        updateStats();
        updateSentenceDisplay();
        
        // Check for end of game
        if (currentVal.length === targetSentence.length) {
            endGame();
        }
    }
});

btnRestart.addEventListener('click', () => {
    initGame(false); // keep same sentence
});

btnNewSentence.addEventListener('click', () => {
    initGame(true); // new sentence
});

btnReplay.addEventListener('click', () => {
    initGame(false); // replay same sentence
});

// Start game on load
window.onload = () => {
    initGame(true);
};

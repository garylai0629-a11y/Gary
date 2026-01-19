const videoElement = document.getElementById('input_video');
const photos = document.querySelectorAll('.gallery-photo');
const message = document.getElementById('anniversary-message');

// --- 1. FIREWORKS LOGIC ---
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function createFirework() {
    // Simple firework visual (Expansion)
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 2, 0, Math.PI * 2);
    ctx.fill();
}

function animate() {
    ctx.fillStyle = 'rgba(11, 13, 23, 0.1)'; // Fade effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(Math.random() > 0.9) createFirework();
    requestAnimationFrame(animate);
}
animate();

// --- 2. HAND TRACKING LOGIC ---
function updateDisplay(fingerCount) {
    // Hide everything first
    photos.forEach(p => p.classList.remove('active'));
    message.classList.remove('active');

    if (fingerCount >= 1 && fingerCount <= 5) {
        const target = document.getElementById(`photo${fingerCount}`);
        if (target) target.classList.add('active');
    } else {
        message.classList.add('active');
    }
}

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Finger counting logic (Simplified)
        // We check if the tip of the finger is higher than the joint below it
        let count = 0;
        const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
        tips.forEach(tip => {
            if (landmarks[tip].y < landmarks[tip - 2].y) count++;
        });
        
        // Special check for Thumb
        if (landmarks[4].x < landmarks[3].x) count++; 

        updateDisplay(count);
    } else {
        updateDisplay(0); // Show "Happy Anniversary" if no hand seen
    }
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();
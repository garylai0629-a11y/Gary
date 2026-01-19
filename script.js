// --- 1. HOLLOW PURPLE & WHITE HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 25000; // Slightly lower for better hand-tracking performance
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // Standard Heart Shell Formula
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 5;

    // "Hollow" Logic: Move particles to the edges with slight jitter
    const edgeJitter = 1 + (Math.random() - 0.5) * 0.15;
    positions[i * 3] = x * edgeJitter;
    positions[i * 3 + 1] = y * edgeJitter;
    positions[i * 3 + 2] = z * edgeJitter;

    // Mix Purple and White
    if (Math.random() > 0.8) {
        // White stars
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    } else {
        // Purple stars
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 1;
    }
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.25, // Larger spheres as requested
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 40;

function animate3D() {
    requestAnimationFrame(animate3D);
    heartPoints.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate3D();

// --- 2. THE HAND SIGN FIX ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');
const videoElement = document.getElementById('input_video');

function updateUI(fingerCount) {
    if (fingerCount === 0) {
        letter.classList.add('active');
        frame.style.display = 'none';
    } else {
        letter.classList.remove('active');
        frame.style.display = 'flex';
        photos.forEach((p, index) => {
            p.classList.toggle('active', index === (fingerCount - 1));
        });
    }
}

// MediaPipe Setup
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    // This logs to the console so you can see if it's working
    console.log("Tracking Active..."); 
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;
        
        // Finger counting logic
        if (landmarks[8].y < landmarks[6].y) count++;   // Index
        if (landmarks[12].y < landmarks[10].y) count++; // Middle
        if (landmarks[16].y < landmarks[14].y) count++; // Ring
        if (landmarks[20].y < landmarks[18].y) count++; // Pinky
        
        // Thumb (Adjusted for better detection)
        const thumbTip = landmarks[4];
        const thumbBase = landmarks[2];
        if (Math.abs(thumbTip.x - thumbBase.x) > 0.1) count++;

        updateUI(count);
    } else {
        updateUI(0);
    }
});

// START CAMERA ONLY AFTER LIBRARIES LOAD
const cameraHelper = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Delay camera start by 2 seconds to ensure Three.js doesn't block the initialization
setTimeout(() => {
    console.log("Starting Camera...");
    cameraHelper.start();
}, 2000);

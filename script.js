// --- 1. LIGHTWEIGHT HOLLOW HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); // Disabled antialias for speed
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 15000; // Reduced for performance
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 5;
    const edge = 1 + (Math.random() - 0.5) * 0.15;
    
    positions[i * 3] = x * edge;
    positions[i * 3 + 1] = y * edge;
    positions[i * 3 + 2] = z * edge;

    if (Math.random() > 0.8) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    } else {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 1;
    }
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.8 });
const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 45;

function animate() {
    requestAnimationFrame(animate);
    heartPoints.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 2. UI CONTROL ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateUI(fingerCount) {
    if (fingerCount === 0) {
        if (!letter.classList.contains('active')) letter.classList.add('active');
        frame.style.display = 'none';
    } else {
        letter.classList.remove('active');
        frame.style.display = 'flex';
        photos.forEach((p, i) => {
            p.classList.toggle('active', i === (fingerCount - 1));
        });
    }
}

// --- 3. THE HAND TRACKING (ISOLATED) ---
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 is much faster than 1 for older/busy computers
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        console.log("HAND SEEN!"); // If you see this in F12, the detection is working
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;
        
        // Simple Finger Logic
        if (landmarks[8].y < landmarks[6].y) count++;   // Index
        if (landmarks[12].y < landmarks[10].y) count++; // Middle
        if (landmarks[16].y < landmarks[14].y) count++; // Ring
        if (landmarks[20].y < landmarks[18].y) count++; // Pinky
        
        // Thumb logic
        const thumbTip = landmarks[4].x;
        const thumbBase = landmarks[2].x;
        // Check if thumb is extended horizontally
        if (Math.abs(thumbTip - thumbBase) > 0.05) count++;

        updateUI(count);
    } else {
        updateUI(0);
    }
});

const videoElement = document.getElementById('input_video');
const cameraHelper = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// DELAY START: Gives the 3D heart time to settle before the AI starts
setTimeout(() => {
    cameraHelper.start();
}, 3000);

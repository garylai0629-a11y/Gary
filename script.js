// --- 1. THE PURPLE STARDUST HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 30000; 
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.random();
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 12;

    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;

    colors[i * 3] = 0.6 + Math.random() * 0.4; // Purple R
    colors[i * 3 + 1] = 0.1; // Green low
    colors[i * 3 + 2] = 0.9; // Blue high
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 40;

function animate3D() {
    requestAnimationFrame(animate3D);
    heartPoints.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate3D();

// --- 2. HAND TRACKING & UI ---
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

// Initialize MediaPipe Hands
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
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;
        
        // Improved logic: Compare tip Y to the joint TWO levels down
        if (landmarks[8].y < landmarks[6].y) count++;   // Index
        if (landmarks[12].y < landmarks[10].y) count++; // Middle
        if (landmarks[16].y < landmarks[14].y) count++; // Ring
        if (landmarks[20].y < landmarks[18].y) count++; // Pinky
        
        // Thumb logic (Distance from palm center)
        const thumbDist = Math.abs(landmarks[4].x - landmarks[2].x);
        const palmSize = Math.abs(landmarks[3].x - landmarks[17].x);
        if (thumbDist > palmSize * 0.8) count++;

        updateUI(count);
    } else {
        updateUI(0);
    }
});

// Start Camera with Error Handling
const cameraHelper = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

cameraHelper.start().catch(err => {
    alert("Camera failed! Please ensure you clicked 'Allow' and are using HTTPS.");
});

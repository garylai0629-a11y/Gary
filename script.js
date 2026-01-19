// --- 1. THREE.JS 3D PURPLE HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 30000; // Optimized for performance
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    // Better 3D Heart Math
    const t = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    // Heart Shape Logic
    const r = Math.random();
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 10;

    // Apply random distribution inside the heart
    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;

    // Purple Gradient (Varying from light violet to deep indigo)
    colors[i * 3] = 0.5 + Math.random() * 0.3; // R: 0.5 - 0.8
    colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G: Low for purple
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B: 0.8 - 1.0
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending // Makes the purple glow
});

const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 40;

function animate3D() {
    requestAnimationFrame(animate3D);
    heartPoints.rotation.y += 0.004; // Slow rotation
    heartPoints.rotation.x += 0.001; 
    renderer.render(scene, camera);
}
animate3D();

// --- 2. HAND TRACKING LOGIC (STABILIZED) ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');
const videoElement = document.getElementById('input_video');

function updateUI(fingerCount) {
    letter.classList.remove('active');
    frame.style.display = 'none';
    photos.forEach(p => p.classList.remove('active'));

    if (fingerCount === 0) {
        letter.classList.add('active');
    } else if (fingerCount >= 1 && fingerCount <= 5) {
        frame.style.display = 'flex';
        const target = document.getElementById(`photo${fingerCount}`);
        if (target) target.classList.add('active');
    }
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;

        // Thumb Logic (Horizontal)
        if (Math.abs(landmarks[4].x - landmarks[2].x) > Math.abs(landmarks[3].x - landmarks[2].x)) count++;
        // 4 Fingers Logic (Vertical)
        const tips = [8, 12, 16, 20];
        const joints = [6, 10, 14, 18];
        for (let i = 0; i < 4; i++) {
            if (landmarks[tips[i]].y < landmarks[joints[i]].y) count++;
        }
        updateUI(count);
    } else {
        updateUI(0);
    }
});

const cameraHandler = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480
});
cameraHandler.start();

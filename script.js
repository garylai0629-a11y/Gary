// --- 1. THREE.JS 3D HEART SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 70000; // 70k particles
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // Mathematical Heart Shape
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 8; 

    const spread = Math.random() * 1.5;
    positions[i * 3] = x * spread;
    positions[i * 3 + 1] = y * spread;
    positions[i * 3 + 2] = z * spread;

    colors[i * 3] = 1; // Rose Red
    colors[i * 3 + 1] = 0.7 + Math.random() * 0.3; // Gold/Pink tint
    colors[i * 3 + 2] = 0.8;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6
});

const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 45;

function animate3D() {
    requestAnimationFrame(animate3D);
    heartPoints.rotation.y += 0.003; 
    renderer.render(scene, camera);
}
animate3D();

// --- 2. UI CONTROL LOGIC ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateUI(fingerCount) {
    // Hide all first
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

// --- 3. MEDIAPIPE HAND TRACKING (STABILIZED) ---
const videoElement = document.getElementById('input_video');

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

        // Correct finger counting logic
        const tips = [8, 12, 16, 20];
        const joints = [6, 10, 14, 18];
        
        // 4 Fingers
        for (let i = 0; i < 4; i++) {
            if (landmarks[tips[i]].y < landmarks[joints[i]].y) count++;
        }
        // Thumb (Horizontal check)
        if (Math.abs(landmarks[4].x - landmarks[2].x) > Math.abs(landmarks[3].x - landmarks[2].x)) {
            count++;
        }

        console.log("Hand detected! Fingers:", count); // Open Console (F12) to see this
        updateUI(count);
    } else {
        updateUI(0); // Show letter if no hand is seen
    }
});

const cameraHandler = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Start the camera after a short delay to let the 3D heart load
setTimeout(() => {
    cameraHandler.start();
}, 1000);

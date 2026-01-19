// --- 1. 3D HOLLOW HEART (PURPLE/WHITE) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 20000; 
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 6;
    const edge = 1 + (Math.random() - 0.5) * 0.1;
    positions[i * 3] = x * edge;
    positions[i * 3 + 1] = y * edge;
    positions[i * 3 + 2] = z * edge;

    if (Math.random() > 0.8) { // White
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    } else { // Purple
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.1; colors[i * 3 + 2] = 1;
    }
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending });
const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 45;

function animate() {
    requestAnimationFrame(animate);
    heartPoints.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 2. UI & HAND LOGIC ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');
const status = document.getElementById('status-debug');

function updateUI(fingerCount) {
    if (fingerCount === 0) {
        letter.classList.add('active');
        frame.style.display = 'none';
    } else {
        letter.classList.remove('active');
        frame.style.display = 'flex';
        photos.forEach((p, i) => p.classList.toggle('active', i === (fingerCount - 1)));
    }
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

hands.onResults((results) => {
    status.innerText = "Camera: Active & Tracking"; // Success!
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;
        // Simple Y-coord check for 4 fingers
        if (landmarks[8].y < landmarks[6].y) count++;
        if (landmarks[12].y < landmarks[10].y) count++;
        if (landmarks[16].y < landmarks[14].y) count++;
        if (landmarks[20].y < landmarks[18].y) count++;
        // Thumb check
        if (Math.abs(landmarks[4].x - landmarks[17].x) > Math.abs(landmarks[3].x - landmarks[17].x)) count++;
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

// Force Start
cameraHelper.start().then(() => {
    status.innerText = "Camera: Starting...";
}).catch(err => {
    status.innerText = "Camera: Error - " + err;
});

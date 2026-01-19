// --- THREE.JS 3D HEART START ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const particlesGeometry = new THREE.BufferGeometry();
const count = 70000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    // Heart Formula
    const t = Math.random() * Math.PI * 2;
    // Basic heart shape
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 5; // Adds thickness

    // Randomize position slightly for "dust" effect
    const spread = Math.random() * 1.2;
    positions[i * 3] = x * spread;
    positions[i * 3 + 1] = y * spread;
    positions[i * 3 + 2] = z * spread;

    // Pink/Gold colors
    colors[i * 3] = 1; // R
    colors[i * 3 + 1] = Math.random() * 0.8; // G
    colors[i * 3 + 2] = 0.8; // B
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});

const heartPoints = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(heartPoints);
camera.position.z = 40;

function animate3D() {
    requestAnimationFrame(animate3D);
    heartPoints.rotation.y += 0.005; // Heart slowly spins
    renderer.render(scene, camera);
}
animate3D();

// --- HAND TRACKING LOGIC ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateUI(fingerCount) {
    // Hide everything
    letter.classList.remove('active');
    frame.style.display = 'none';
    photos.forEach(p => p.classList.remove('active'));

    if (fingerCount === 0) {
        letter.classList.add('active');
    } else if (fingerCount >= 1 && fingerCount <= 5) {
        frame.style.display = 'block';
        const target = document.getElementById(`photo${fingerCount}`);
        if (target) target.classList.add('active');
    }
}

// (Reuse the Hands logic from previous message)
const videoElement = document.getElementById('input_video');
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.7 });

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let count = 0;
        const tips = [8, 12, 16, 20];
        const joints = [6, 10, 14, 18];
        for (let i = 0; i < 4; i++) { if (landmarks[tips[i]].y < landmarks[joints[i]].y) count++; }
        if (Math.abs(landmarks[4].x - landmarks[0].x) > Math.abs(landmarks[3].x - landmarks[0].x)) count++;
        updateUI(count);
    } else {
        updateUI(0);
    }
});

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 640, height: 480
});
cameraUtils.start();

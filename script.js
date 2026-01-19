// --- 1. 3D HOLLOW SHELL HEART ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 25000;
const positions = new Float32Array(count * 3);
const heartData = new Float32Array(count * 3); // Original Heart Shape
const starData = new Float32Array(count * 3);  // Splattered Starfield

for (let i = 0; i < count; i++) {
    // 3D Parametric Heart Formula (The "Shell" look)
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI;
    
    // Better 3D Heart math for a rounded, hollow look
    let x = 16 * Math.pow(Math.sin(u), 3) * Math.sin(v);
    let y = (13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u)) * Math.sin(v);
    let z = 10 * Math.cos(v); 

    heartData[i*3] = x;
    heartData[i*3+1] = y;
    heartData[i*3+2] = z;

    // Target positions for the "Splatter" (Wide starfield)
    starData[i*3] = (Math.random() - 0.5) * 180;
    starData[i*3+1] = (Math.random() - 0.5) * 120;
    starData[i*3+2] = (Math.random() - 0.5) * 60;

    // Start at heart position
    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Colors: Mix of White and Purple
const colors = new Float32Array(count * 3);
for(let i=0; i<count; i++) {
    if(Math.random() > 0.8) { // White
        colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1;
    } else { // Purple
        colors[i*3]=0.6; colors[i*3+1]=0.2; colors[i*3+2]=1;
    }
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.9 });
const points = new THREE.Points(geo, mat);
scene.add(points);
camera.position.z = 50;

let exploded = false;

function animate() {
    requestAnimationFrame(animate);
    const pos = geo.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // Smoothly slide between heart and splatter (Lerp)
        const tx = exploded ? starData[i3] : heartData[i3];
        const ty = exploded ? starData[i3+1] : heartData[i3+1];
        const tz = exploded ? starData[i3+2] : heartData[i3+2];

        pos[i3] += (tx - pos[i3]) * 0.08;
        pos[i3+1] += (ty - pos[i3+1]) * 0.08;
        pos[i3+2] += (tz - pos[i3+2]) * 0.08;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.003;
    renderer.render(scene, camera);
}
animate();

// --- 2. HAND DETECTION ---
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6});

hands.onResults((results) => {
    const letter = document.getElementById('anniversary-letter');
    const frame = document.getElementById('frame');
    const photos = document.querySelectorAll('.gallery-photo');

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let fingers = 0;
        if (landmarks[8].y < landmarks[6].y) fingers++;
        if (landmarks[12].y < landmarks[10].y) fingers++;
        if (landmarks[16].y < landmarks[14].y) fingers++;
        if (landmarks[20].y < landmarks[18].y) fingers++;
        if (Math.abs(landmarks[4].x - landmarks[17].x) > 0.1) fingers++;

        if (fingers > 0) {
            exploded = true; // Splatter the heart
            letter.style.display = 'none';
            frame.style.display = 'flex';
            photos.forEach((p, i) => p.classList.toggle('active', i === (fingers - 1)));
        } else {
            exploded = false; // Back to heart
            letter.style.display = 'block';
            frame.style.display = 'none';
        }
    } else {
        exploded = false;
        letter.style.display = 'block';
        frame.style.display = 'none';
    }
});

const videoElement = document.getElementById('input_video');
const cameraHelper = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 640, height: 480
});
cameraHelper.start();

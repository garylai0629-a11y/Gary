// --- 1. SMOOTH 3D HEART MATH ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 20000;
const positions = new Float32Array(count * 3);
const heartData = new Float32Array(count * 3); 
const starData = new Float32Array(count * 3);  

for (let i = 0; i < count; i++) {
    // Elegant 3D Heart (The "A. Taubin" Formula)
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    
    // Smooth parametric shell
    const x = 16 * Math.pow(Math.sin(phi), 3) * Math.sin(theta);
    const y = (13 * Math.cos(phi) - 5 * Math.cos(2 * phi) - 2 * Math.cos(3 * phi) - Math.cos(4 * phi)) * Math.sin(theta);
    const z = 8 * Math.cos(theta); // Depth

    heartData[i*3] = x;
    heartData[i*3+1] = y;
    heartData[i*3+2] = z;

    // Splattered Starfield (Romantic Warmth)
    starData[i*3] = (Math.random() - 0.5) * 180;
    starData[i*3+1] = (Math.random() - 0.5) * 120;
    starData[i*3+2] = (Math.random() - 0.5) * 60;

    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Romantic Colors: Warm White, Rose, and Soft Gold
const colors = new Float32Array(count * 3);
for(let i=0; i<count; i++) {
    const r = Math.random();
    if(r > 0.7) { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; } // White
    else if(r > 0.3) { colors[i*3]=1; colors[i*3+1]=0.6; colors[i*3+2]=0.8; } // Rose
    else { colors[i*3]=1; colors[i*3+1]=0.8; colors[i*3+2]=0.4; } // Gold
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.9 });
const points = new THREE.Points(geo, mat);
scene.add(points);
camera.position.z = 50;

let exploded = false;

function animate() {
    requestAnimationFrame(animate);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const tx = exploded ? starData[i3] : heartData[i3];
        const ty = exploded ? starData[i3+1] : heartData[i3+1];
        const tz = exploded ? starData[i3+2] : heartData[i3+2];

        pos[i3] += (tx - pos[i3]) * 0.08;
        pos[i3+1] += (ty - pos[i3+1]) * 0.08;
        pos[i3+2] += (tz - pos[i3+2]) * 0.08;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 2. HAND LOGIC ---
function updateDisplay(fingers) {
    const letter = document.getElementById('anniversary-letter');
    const frame = document.getElementById('frame');
    const photos = document.querySelectorAll('.gallery-photo');

    // Default: Reset everything
    exploded = false;
    letter.style.display = 'none';
    frame.style.display = 'none';

    if (fingers === 0) {
        exploded = false; 
        letter.style.display = 'block'; // Show Letter on Fist
    } else if (fingers >= 1 && fingers <= 5) {
        exploded = true; 
        frame.style.display = 'flex';
        photos.forEach((p, i) => p.classList.toggle('active', i === (fingers - 1)));
    }
}

// (Standard Camera/Hands Setup)
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6});
hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const lm = res.multiHandLandmarks[0];
        let f = 0;
        if (lm[8].y < lm[6].y) f++; if (lm[12].y < lm[10].y) f++;
        if (lm[16].y < lm[14].y) f++; if (lm[20].y < lm[18].y) f++;
        if (Math.abs(lm[4].x - lm[17].x) > 0.12) f++;
        updateDisplay(f);
    } else {
        updateDisplay(-1); // Neutral state (Heart only)
    }
});
const video = document.getElementById('input_video');
const cam = new Camera(video, {onFrame: async () => {await hands.send({image: video});}, width: 640, height: 480});
cam.start();

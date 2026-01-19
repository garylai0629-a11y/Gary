// --- 1. 3D SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 25000;
const positions = new Float32Array(count * 3);
const heartPos = new Float32Array(count * 3);
const starPos = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    // 3D Heart Shell Math
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI;
    heartPos[i*3] = 16 * Math.pow(Math.sin(u), 3) * Math.sin(v);
    heartPos[i*3+1] = (13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u)) * Math.sin(v);
    heartPos[i*3+2] = 10 * Math.cos(v);

    // Warm Romantic Starfield
    starPos[i*3] = (Math.random() - 0.5) * 160;
    starPos[i*3+1] = (Math.random() - 0.5) * 120;
    starPos[i*3+2] = (Math.random() - 0.5) * 80;

    positions[i*3] = heartPos[i*3];
    positions[i*3+1] = heartPos[i*3+1];
    positions[i*3+2] = heartPos[i*3+2];

    // Colors: Gold, Pink, White
    const rand = Math.random();
    if(rand > 0.6) { // Rose Pink
        colors[i*3]=1; colors[i*3+1]=0.4; colors[i*3+2]=0.7;
    } else if (rand > 0.3) { // Warm Gold
        colors[i*3]=1; colors[i*3+1]=0.85; colors[i*3+2]=0.4;
    } else { // White
        colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1;
    }
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const mat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.9 });
const points = new THREE.Points(geo, mat);
scene.add(points);
camera.position.z = 50;

let isSplattered = false;

function animate() {
    requestAnimationFrame(animate);
    const posArr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const tx = isSplattered ? starPos[i3] : heartPos[i3];
        const ty = isSplattered ? starPos[i3+1] : heartPos[i3+1];
        const tz = isSplattered ? starPos[i3+2] : heartPos[i3+2];

        posArr[i3] += (tx - posArr[i3]) * 0.07;
        posArr[i3+1] += (ty - posArr[i3+1]) * 0.07;
        posArr[i3+2] += (tz - posArr[i3+2]) * 0.07;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animate();

// --- 2. LOGIC ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function showContent(fingers) {
    // Default: Heart + Nothing shown
    isSplattered = false;
    letter.style.display = 'none';
    frame.style.display = 'none';

    if (fingers === 0) {
        isSplattered = false; // Stay as heart
        letter.style.display = 'block';
    } else if (fingers >= 1 && fingers <= 5) {
        isSplattered = true; // Splatter stars
        frame.style.display = 'block';
        photos.forEach((p, i) => p.classList.toggle('active', i === (fingers - 1)));
    }
}

// --- 3. HAND TRACKING ---
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6});

hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const lm = res.multiHandLandmarks[0];
        let f = 0;
        if (lm[8].y < lm[6].y) f++; if (lm[12].y < lm[10].y) f++;
        if (lm[16].y < lm[14].y) f++; if (lm[20].y < lm[18].y) f++;
        if (Math.abs(lm[4].x - lm[17].x) > 0.1) f++;
        showContent(f);
    } else {
        showContent(-1); // Initial state: Heart only
    }
});

const video = document.getElementById('input_video');
const cam = new Camera(video, { onFrame: async () => { await hands.send({image: video}); }, width: 640, height: 480 });
cam.start();

// --- 1. RESTORED CLASSIC HEART SHAPE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 25000;
const positions = new Float32Array(count * 3);
const heartData = new Float32Array(count * 3); 
const starData = new Float32Array(count * 3);  

for (let i = 0; i < count; i++) {
    // Restoring the "Beginning" Heart Shape math
    const t = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.2 + 0.8; // Keeps it hollow/concentrated on edges
    
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 8; 

    heartData[i*3] = x * r;
    heartData[i*3+1] = y * r;
    heartData[i*3+2] = z;

    // Splattered Starfield (Romantic Colors)
    starData[i*3] = (Math.random() - 0.5) * 180;
    starData[i*3+1] = (Math.random() - 0.5) * 120;
    starData[i*3+2] = (Math.random() - 0.5) * 60;

    positions[i*3] = heartData[i*3];
    positions[i*3+1] = heartData[i*3+1];
    positions[i*3+2] = heartData[i*3+2];
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const colors = new Float32Array(count * 3);
for(let i=0; i<count; i++) {
    const rand = Math.random();
    if(rand > 0.7) { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; } // White
    else if(rand > 0.3) { colors[i*3]=1; colors[i*3+1]=0.6; colors[i*3+2]=0.8; } // Rose
    else { colors[i*3]=1; colors[i*3+1]=0.85; colors[i*3+2]=0.4; } // Gold
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, opacity: 0.85 });
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
    points.rotation.y += 0.004;
    renderer.render(scene, camera);
}
animate();

// --- 2. ACCURATE DISTANCE-BASED DETECTION ---
function updateDisplay(fingers) {
    const letter = document.getElementById('anniversary-letter');
    const frame = document.getElementById('frame');
    const photos = document.querySelectorAll('.gallery-photo');

    exploded = false;
    letter.style.display = 'none';
    frame.style.display = 'none';

    if (fingers === 0) {
        exploded = false; 
        letter.style.display = 'block';
    } else if (fingers >= 1 && fingers <= 5) {
        exploded = true; 
        frame.style.display = 'flex';
        photos.forEach((p, i) => p.classList.toggle('active', i === (fingers - 1)));
    }
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7});

hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const lm = res.multiHandLandmarks[0];
        const getDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        let f = 0;
        const wrist = lm[0];
        // Tips: 8, 12, 16, 20. Joints: 6, 10, 14, 18.
        const tips = [8, 12, 16, 20];
        const bases = [6, 10, 14, 18];
        
        for (let i = 0; i < 4; i++) {
            if (getDist(lm[tips[i]], wrist) > getDist(lm[bases[i]], wrist)) f++;
        }
        // Improved Thumb Logic
        if (getDist(lm[4], lm[17]) > getDist(lm[2], lm[17]) * 1.3) f++;
        
        updateDisplay(f);
    } else {
        updateDisplay(-1);
    }
});

const video = document.getElementById('input_video');
const cam = new Camera(video, {onFrame: async () => {await hands.send({image: video});}, width: 640, height: 480});
cam.start();

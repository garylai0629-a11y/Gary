// --- 1. THE SOLID HEART (Original Shape) ---
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
    const t = Math.random() * Math.PI * 2;
    // Solid fill: Randomize radius from 0 to 1
    const r = Math.random(); 
    
    // Original silhouette math you liked
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 15; 

    heartData[i*3] = x * r;
    heartData[i*3+1] = y * r;
    heartData[i*3+2] = z * r;

    // Splatter Target (Across the screen)
    starData[i*3] = (Math.random() - 0.5) * 200;
    starData[i*3+1] = (Math.random() - 0.5) * 150;
    starData[i*3+2] = (Math.random() - 0.5) * 100;

    positions[i*3] = heartData[i*3];
    positions[i*3+1] = heartData[i*3+1];
    positions[i*3+2] = heartData[i*3+2];
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const colors = new Float32Array(count * 3);
for(let i=0; i<count; i++) {
    // Warm Romantic colors
    const rand = Math.random();
    if(rand > 0.6) { colors[i*3]=1; colors[i*3+1]=0.8; colors[i*3+2]=0.9; } // Soft Pink
    else { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; } // White
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const mat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.9 });
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
        pos[i3] += (tx - pos[i3]) * 0.1;
        pos[i3+1] += (ty - pos[i3+1]) * 0.1;
        pos[i3+2] += (tz - pos[i3+2]) * 0.1;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 2. THE HAND RULES (STRICT VERSION) ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateContent(f) {
    // Hide everything first
    letter.style.display = 'none';
    frame.style.display = 'none';
    photos.forEach(p => p.classList.remove('active'));

    if (f === 0) {
        exploded = true; // Splatter stars
        letter.style.display = 'block'; // Show Letter
    } else if (f >= 1 && f <= 5) {
        exploded = true; // Splatter stars
        frame.style.display = 'flex'; // Show Photo Frame
        const target = document.getElementById(`photo${f}`);
        if(target) target.classList.add('active');
    } else {
        exploded = false; // Return to Heart
    }
}

// MediaPipe Hands
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7});
hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const lm = res.multiHandLandmarks[0];
        let f = 0;
        // Simple but reliable finger count
        if (lm[8].y < lm[6].y) f++; 
        if (lm[12].y < lm[10].y) f++; 
        if (lm[16].y < lm[14].y) f++; 
        if (lm[20].y < lm[18].y) f++;
        // Thumb check
        if (Math.abs(lm[4].x - lm[5].x) > 0.08) f++; 
        updateContent(f);
    } else {
        updateContent(-1);
    }
});

const video = document.getElementById('input_video');
const cam = new Camera(video, {
    onFrame: async () => { await hands.send({image: video}); },
    width: 640, height: 480
});
cam.start();

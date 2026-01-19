// --- 1. SOLID 3D HEART ---
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
    // Solid Heart Logic: Randomize 'r' from 0 to 1 to fill the inside
    const r = Math.random(); 
    
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = (Math.random() - 0.5) * 10; 

    heartData[i*3] = x * r;
    heartData[i*3+1] = y * r;
    heartData[i*3+2] = z * r;

    // Splatter Target
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
    const rand = Math.random();
    if(rand > 0.7) { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; } // White
    else if(rand > 0.3) { colors[i*3]=1; colors[i*3+1]=0.6; colors[i*3+2]=0.8; } // Rose
    else { colors[i*3]=1; colors[i*3+1]=0.85; colors[i*3+2]=0.4; } // Gold
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

        pos[i3] += (tx - pos[i3]) * 0.1; // Faster transition
        pos[i3+1] += (ty - pos[i3+1]) * 0.1;
        pos[i3+2] += (tz - pos[i3+2]) * 0.1;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

// --- 2. HAND SIGN RULES ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateContent(f) {
    // Hide everything by default
    letter.style.display = 'none';
    frame.style.display = 'none';
    photos.forEach(p => p.classList.remove('active'));
    exploded = false;

    if (f === 0) {
        // FIST: Show Letter, Heart Shape
        letter.style.display = 'block';
        exploded = false;
    } else if (f >= 1 && f <= 5) {
        // 1-5: Show Photo, Splatter Stars
        exploded = true;
        frame.style.display = 'flex';
        const targetPhoto = document.getElementById(`photo${f}`);
        if (targetPhoto) targetPhoto.classList.add('active');
    }
}

// MediaPipe Hands
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75});

hands.onResults((res) => {
    if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
        const lm = res.multiHandLandmarks[0];
        let f = 0;
        // Basic finger counting (Tip higher than PIP joint)
        if (lm[8].y < lm[6].y) f++; 
        if (lm[12].y < lm[10].y) f++; 
        if (lm[16].y < lm[14].y) f++; 
        if (lm[20].y < lm[18].y) f++;
        // Thumb check (horizontal distance from index base)
        if (Math.abs(lm[4].x - lm[5].x) > 0.08) f++; 

        updateContent(f);
    } else {
        updateContent(-1); // No hand = just the heart
    }
});

const video = document.getElementById('input_video');
const cam = new Camera(video, {onFrame: async () => {await hands.send({image: video});}, width: 640, height: 480});
cam.start();

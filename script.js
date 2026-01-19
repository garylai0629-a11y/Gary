// --- 1. 3D Heart and Starfield Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const count = 25000; // Number of particles for the heart/stars
const positions = new Float32Array(count * 3); // Current positions
const heartData = new Float32Array(count * 3); // Target positions for heart shape
const starData = new Float32Array(count * 3);  // Target positions for splattered stars

for (let i = 0; i < count; i++) {
    // Generate particles for a SOLID 3D Heart (using a more uniform distribution)
    const t = Math.random() * Math.PI * 2; // Angle around the heart
    const u = Math.random() * Math.PI * 2; // Angle for Z-axis distribution
    const p = Math.pow(Math.random(), 1/3); // Factor to fill the volume
    
    // Classic Heart Shape mathematical formula
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    let z = 8 * Math.cos(u); // Simpler Z distribution

    // Apply 'p' to fill the heart's interior, making it solid
    heartData[i*3] = x * p;
    heartData[i*3+1] = y * p;
    heartData[i*3+2] = z * p;

    // Generate positions for the splattered starfield
    starData[i*3] = (Math.random() - 0.5) * 200; // Wide X range
    starData[i*3+1] = (Math.random() - 0.5) * 150; // Wide Y range
    starData[i*3+2] = (Math.random() - 0.5) * 100; // Wide Z range

    // Initialize particles in the heart shape
    positions[i*3] = heartData[i*3];
    positions[i*3+1] = heartData[i*3+1];
    positions[i*3+2] = heartData[i*3+2];
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Romantic Colors: White, Rose Pink, and Warm Gold
const colors = new Float32Array(count * 3);
for(let i=0; i<count; i++) {
    const rand = Math.random();
    if(rand > 0.7) { 
        colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; // White
    } else if(rand > 0.3) { 
        colors[i*3]=1; colors[i*3+1]=0.7; colors[i*3+2]=0.85; // Rose Pink
    } else { 
        colors[i*3]=1; colors[i*3+1]=0.9; colors[i*3+2]=0.5; // Warm Gold
    }
}
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({ 
    size: 0.4, // Size of each stardust particle
    vertexColors: true, 
    transparent: true, 
    opacity: 0.9,
    blending: THREE.AdditiveBlending // Makes colors blend beautifully, creating a glowing effect
});
const points = new THREE.Points(geo, mat);
scene.add(points);
camera.position.z = 50; // Adjust camera distance

let isSplattered = false; // Flag to control heart/starfield state

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    const posArray = geo.attributes.position.array;
    
    // Smoothly transition particles between heart and starfield
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const targetX = isSplattered ? starData[i3] : heartData[i3];
        const targetY = isSplattered ? starData[i3+1] : heartData[i3+1];
        const targetZ = isSplattered ? starData[i3+2] : heartData[i3+2];

        // Linear interpolation (Lerp) for smooth movement
        posArray[i3] += (targetX - posArray[i3]) * 0.1; // Adjust 0.1 for faster/slower transition
        posArray[i3+1] += (targetY - posArray[i3+1]) * 0.1;
        posArray[i3+2] += (targetZ - posArray[i3+2]) * 0.1;
    }
    geo.attributes.position.needsUpdate = true; // Tell Three.js to update particle positions
    
    points.rotation.y += 0.005; // Rotate the heart/starfield
    renderer.render(scene, camera);
}
animate(); // Start the animation

// --- 2. UI Control based on Hand Signs ---
const letter = document.getElementById('anniversary-letter');
const frame = document.getElementById('frame');
const photos = document.querySelectorAll('.gallery-photo');

function updateContent(detectedFingers) {
    // Reset all UI elements
    letter.style.display = 'none';
    frame.style.display = 'none';
    photos.forEach(p => p.classList.remove('active')); // Hide all photos

    // Logic based on detected fingers
    if (detectedFingers === 0) {
        // Hand sign 0: Splatter stars, show letter
        isSplattered = true; 
        letter.style.display = 'block';
    } else if (detectedFingers >= 1 && detectedFingers <= 5) {
        // Hand signs 1-5: Splatter stars, show corresponding picture
        isSplattered = true; 
        frame.style.display = 'flex'; // Use flex to center the frame
        const targetPhoto = document.getElementById(`photo${detectedFingers}`);
        if (targetPhoto) {
            targetPhoto.classList.add('active'); // Show the specific photo
        }
    } else {
        // No hand detected, or invalid sign: Show solid heart, hide UI
        isSplattered = false; 
    }
}

// --- 3. MediaPipe Hand Tracking Setup ---
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1, // Track one hand
    modelComplexity: 1, // Higher complexity for better accuracy
    minDetectionConfidence: 0.7, // Only detect if confidence is high
    minTrackingConfidence: 0.7 // Only track if confidence is high
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks

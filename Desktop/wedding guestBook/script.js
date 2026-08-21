// === 1. KONFIGURASI FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyCIcp7tc9ScC8Xzyj5e_330WRTeRP_f9A4",
  authDomain: "wedding-guestbook-1f0cf.firebaseapp.com",
  projectId: "wedding-guestbook-1f0cf",
  storageBucket: "wedding-guestbook-1f0cf.appspot.com",
  messagingSenderId: "192281203837",
  appId: "1:192281203837:web:d5977763aec94b2133cd14"
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

/// ============================================================
// GANTI BAGIAN KAMERA DI SCRIPT.JS DENGAN KODE DI BAWAH INI
// ============================================================

const webcam = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const photoResult = document.getElementById('photoResult');

const btnBukaKamera = document.getElementById('btnBukaKamera');
const btnJepret = document.getElementById('btnJepret');
const btnUlangFoto = document.getElementById('btnUlangFoto');

let cameraStream = null;

// 1. Buka Kamera (Dioptimalkan untuk HP)
btnBukaKamera.addEventListener('click', async () => {
    try {
        const constraints = { 
            video: { 
                facingMode: 'user', // Kamera depan
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = cameraStream;

        // Trik khusus HP: Tunggu video memuat metadata baru ditayangkan
        webcam.onloadedmetadata = () => {
            webcam.play();
            webcam.style.display = 'block';
            photoResult.style.display = 'none';

            btnBukaKamera.style.display = 'none';
            btnJepret.style.display = 'inline-block';
        };

    } catch (err) {
        alert("Gagal mengakses kamera. Izinkan akses kamera pada browser kamu.");
        console.error(err);
    }
});

// 2. Jepret Foto (Cegah Hasil Hitam)
btnJepret.addEventListener('click', () => {
    // Ambil resolusi asli dari video HP
    const width = webcam.videoWidth || 640;
    const height = webcam.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(webcam, 0, 0, width, height);

    // Konversi ke foto
    const dataFoto = canvas.toDataURL('image/jpeg', 0.7); 
    photoResult.src = dataFoto;

    photoResult.style.display = 'block';
    webcam.style.display = 'none';

    // Matikan aliran kamera setelah foto diambil
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    btnJepret.style.display = 'none';
    btnUlangFoto.style.display = 'inline-block';
});

// 3. Foto Ulang
btnUlangFoto.addEventListener('click', () => {
    btnUlangFoto.style.display = 'none';
    btnBukaKamera.click();
});

// === 3. LOGIKA REKAM SUARA ===
let mediaRecorder;
let audioChunks = [];
let audioBase64 = ""; // Menampung hasil konversi audio ke teks

const btnStartMic = document.getElementById('btnStartMic');
const btnStopMic = document.getElementById('btnStopMic');
const statusRekam = document.getElementById('statusRekam');
const audioPreview = document.getElementById('audioPreview');

btnStartMic.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Konversi Audio Blob ke Base64 Text
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                audioBase64 = reader.result; // Data audio berbentuk teks siap simpan
            };

            audioPreview.src = audioUrl;
            audioPreview.style.display = 'block';
            statusRekam.innerText = "Selesai merekam! Dengarkan hasilnya di bawah.";
            statusRekam.style.color = "green";
        };

        mediaRecorder.start();
        btnStartMic.disabled = true;
        btnStopMic.disabled = false;
        statusRekam.innerText = "🔴 Sedang merekam...";
        statusRekam.style.color = "#d9534f";

    } catch (err) {
        alert("Gagal mengakses mikrofon.");
    }
});

btnStopMic.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        btnStartMic.disabled = false;
        btnStopMic.disabled = true;
    }
});


// === 4. LOGIKA TOMBOL KIRIM (SIMPAN LANGSUNG KE FIRESTORE) ===
const btnKirim = document.getElementById('btnKirim');

btnKirim.addEventListener('click', async () => {
    const nama = document.getElementById('nama').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const photoSrc = photoResult.src;

    if (!nama) {
        alert("Harap isi nama kamu terlebih dahulu!");
        return;
    }

    if (!photoSrc || photoResult.style.display === 'none') {
        alert("Harap jepret foto terlebih dahulu!");
        return;
    }

    btnKirim.disabled = true;
    btnKirim.innerText = "⏳ Mengirim ucapan...";

    try {
        // Langsung simpan data ke Firestore tanpa butuh Firebase Storage!
        await db.collection("guests").add({
            nama: nama,
            instagram: instagram || "-",
            photoUrl: photoSrc,     // Berisi Teks Foto (Base64)
            audioUrl: audioBase64,  // Berisi Teks Audio (Base64)
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Terima kasih ${nama}! Ucapan dan foto kamu berhasil dikirim. ❤️`);
        location.reload();

    } catch (error) {
        console.error("Gagal mengirim data:", error);
        alert("Terjadi kesalahan saat mengirim: " + error.message);
        btnKirim.disabled = false;
        btnKirim.innerText = "🚀 Kirim Ucapan";
    }
});
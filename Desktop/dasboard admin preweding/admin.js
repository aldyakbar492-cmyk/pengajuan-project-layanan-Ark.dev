
        // Konfigurasi Firebase
        const firebaseConfig = {
          apiKey: "AIzaSyCIcp7tc9ScC8Xzyj5e_330WRTeRP_f9A4",
          authDomain: "wedding-guestbook-1f0cf.firebaseapp.com",
          projectId: "wedding-guestbook-1f0cf",
          storageBucket: "wedding-guestbook-1f0cf.appspot.com",
          messagingSenderId: "192281203837",
          appId: "1:192281203837:web:d5977763aec94b2133cd14"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const db = firebase.firestore();

        const guestList = document.getElementById('guestList');

        // Mengambil data real-time dari Firestore
        db.collection("guests").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            if (snapshot.empty) {
                guestList.innerHTML = "<p style='text-align: center;'>Belum ada tamu yang mengisi ucapan.</p>";
                return;
            }

            guestList.innerHTML = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                const docId = doc.id; // Ambil ID Dokumen untuk keperluan hapus
                
                const card = document.createElement('div');
                card.className = 'guest-item';
                card.innerHTML = `
                    <img src="${data.photoUrl}" class="guest-img" alt="Foto Tamu">
                    <div class="guest-info">
                        <h4>${data.nama}</h4>
                        <p><b>IG:</b> ${data.instagram}</p>
                        ${data.audioUrl ? `<audio controls src="${data.audioUrl}"></audio>` : '<p><i>Tidak ada rekaman suara</i></p>'}
                    </div>
                    <button class="btn-delete" onclick="hapusTamu('${docId}', '${data.nama}')">🗑️ Hapus</button>
                `;
                guestList.appendChild(card);
            });
        }, (error) => {
            console.error("Firestore Error:", error);
            guestList.innerHTML = "<p style='color:red; text-align:center;'>Gagal mengambil data: " + error.message + "</p>";
        });

        // Fungsi Hapus Data Tamu
        async function hapusTamu(id, nama) {
            const konfirmasi = confirm(`Apakah kamu yakin ingin menghapus ucapan dari "${nama}"?`);
            if (konfirmasi) {
                try {
                    await db.collection("guests").doc(id).delete();
                    alert(`Data ucapan dari "${nama}" berhasil dihapus!`);
                } catch (error) {
                    console.error("Gagal menghapus:", error);
                    alert("Gagal menghapus data: " + error.message);
                }
            }
        }

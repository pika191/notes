// Array untuk menyimpan catatan aktif
let notes = [];
// Array untuk menyimpan catatan yang dihapus (history)
let historyNotes = [];
// Objek untuk menyimpan timer setiap note dengan pengingat
const timers = {};

// Fungsi untuk memperbarui jam digital
function updateDigitalClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[now.getDay()];

    const date = now.getDate();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const digitalClock = document.getElementById('digitalClock');
    if (digitalClock) {
        digitalClock.textContent = `${dayName}, ${date} ${monthName} ${year} | ${hours}:${minutes}:${seconds}`;
    }
}

// Update jam digital setiap detik
setInterval(updateDigitalClock, 1000);
// Update segera saat halaman dimuat
updateDigitalClock();

// Fungsi untuk menampilkan tab yang dipilih
function showTab(tabName) {
    // Sembunyikan semua tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Hapus kelas active dari semua tombol tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Tampilkan tab yang dipilih
    document.getElementById(tabName).classList.remove('hidden');
    // Tambahkan kelas active ke tombol tab yang sesuai
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
}

// Event listener untuk tombol tab
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            showTab(tabName);
        });
    });
});

// Fungsi untuk mengatur event listener tombol tab
function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

// Fungsi untuk menampilkan semua catatan ke dalam container
function displayNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = "";

    // Urutkan catatan berdasarkan waktu pembuatan (terbaru di atas)
    notes.sort((a, b) => b.createdAt - a.createdAt);

    notes.forEach(note => {
        const noteEl = createNoteElement(note, false);
        container.appendChild(noteEl);
    });

    // Perbarui waktu "live" setiap menit
    setTimeout(() => {
        updateLiveTimes();
    }, 60000); // Update setiap 1 menit
}

// Fungsi untuk menampilkan semua catatan history
function displayHistoryNotes() {
    const container = document.getElementById('historyContainer');
    container.innerHTML = "";

    // Urutkan catatan berdasarkan waktu penghapusan (terbaru di atas)
    historyNotes.sort((a, b) => b.deletedAt - a.deletedAt);

    historyNotes.forEach(note => {
        const noteEl = createNoteElement(note, true);
        container.appendChild(noteEl);
    });
}

// Fungsi untuk membuat element catatan
function createNoteElement(note, isHistory = false) {
    const noteEl = document.createElement('div');
    noteEl.className = `note ${isHistory ? 'history-note' : ''}`;

    // Menerapkan gaya teks berdasarkan properti catatan
    let contentStyle = "";
    if (note.isBold) contentStyle += "font-weight: bold;";
    if (note.isItalic) contentStyle += "font-style: italic;";
    if (note.fontColor) contentStyle += `color: ${note.fontColor};`;

    // Format waktu pembuatan catatan
    const createdDate = new Date(note.createdAt);
    const timeAgo = formatTimeAgo(createdDate);
    const formattedDate = createdDate.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Tambahkan tombol restore jika ini catatan history
    const restoreBtn = isHistory ?
        `<button onclick="restoreNote(${note.id})" class="restore">Pulihkan</button>` :
        "";

    // Tambahkan tombol update jika ini bukan catatan history
    const updateBtn = !isHistory ?
        `<button onclick="prepareUpdateNote(${note.id})" class="update">Update</button>` :
        "";

    // Tambahkan info waktu penghapusan untuk catatan history
    const deletedInfo = isHistory ?
        `<div class="creation-time">
         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="12" cy="12" r="10"></circle>
           <polyline points="12 6 12 12 16 14"></polyline>
         </svg>
         Dihapus: ${new Date(note.deletedAt).toLocaleString('id-ID')} (${formatTimeAgo(new Date(note.deletedAt))})
       </div>` :
        "";

    noteEl.innerHTML = `
    <h3>${note.title}</h3>
    <p style="${contentStyle}">${note.content}</p>
    ${note.reminder && !isHistory ? `<p><strong>Pengingat:</strong> ${new Date(note.reminder).toLocaleString()}</p>` : ""}
    ${note.reminder && isHistory ? `<p><strong>Pengingat:</strong> ${new Date(note.reminder).toLocaleString()} (sudah berlalu)</p>` : ""}
    <div class="creation-time">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Dibuat: ${formattedDate} (${timeAgo})

</think>

span>
    </div>
    ${deletedInfo}
    <div class="note-actions">
      ${updateBtn}
      ${isHistory ? `<button onclick="deletePermanently(${note.id})" class="delete">Hapus Permanen</button>` : `<button onclick="deleteNote(${note.id})" class="delete">Hapus</button>`}
      ${restoreBtn}
    </div>
  `;

  return noteEl;
}

// Fungsi untuk memformat waktu sebagai "X waktu yang lalu"
function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return `${seconds} detik yang lalu`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} menit yang lalu`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} jam yang lalu`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} hari yang lalu`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} bulan yang lalu`;
  }

  const years = Math.floor(months / 12);
  return `${years} tahun yang lalu`;
}

// Fungsi untuk memperbarui waktu "live" pada catatan
function updateLiveTimes() {
  // Update untuk catatan aktif
  document.querySelectorAll('#notesContainer .creation-time span').forEach((el, index) => {
    if (index < notes.length) {
      const createdDate = new Date(notes[index].createdAt);
      const timeAgo = formatTimeAgo(createdDate);

      // Ambil teks asli dan ganti bagian timeAgo
      const text = el.textContent;
      const parts = text.split(' (');
      if (parts.length === 2) {
        el.textContent = `${parts[0]} (${timeAgo})`;
      }
    }
  });

  // Update untuk catatan history
  document.querySelectorAll('#historyContainer .creation-time span').forEach((el, index) => {
    if (index < historyNotes.length) {
      const createdDate = new Date(historyNotes[index].createdAt);
      const timeAgo = formatTimeAgo(createdDate);

      // Ambil teks asli dan ganti bagian timeAgo
      const text = el.textContent;
      const parts = text.split(' (');
      if (parts.length === 2) {
        el.textContent = `${parts[0]} (${timeAgo})`;
      }
    }
  });
}

// Fungsi untuk mempersiapkan pembaruan catatan
window.prepareUpdateNote = function(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  // Isi form dengan data catatan
  document.getElementById('noteId').value = note.id;
  document.getElementById('title').value = note.title;
  document.getElementById('content').value = note.content;
  document.getElementById('boldText').checked = note.isBold;
  document.getElementById('italicText').checked = note.isItalic;
  document.getElementById('fontColor').value = note.fontColor || '#000000';

  if (note.reminder) {
    const date = new Date(note.reminder);
    const formattedDate = date.toISOString().slice(0, 16); // Format untuk input datetime-local
    document.getElementById('reminder').value = formattedDate;
  } else {
    document.getElementById('reminder').value = "";
  }

  // Ubah teks tombol submit
  document.getElementById('submitBtn').textContent = "Update Catatan";
  document.getElementById('cancelBtn').classList.remove('hidden');

  // Tampilkan form jika belum ditampilkan
  const noteForm = document.getElementById('noteForm');
  if (noteForm.classList.contains('hidden')) {
    document.getElementById('toggleFormBtn').click();
  }

  // Scroll ke form
  noteForm.scrollIntoView({ behavior: 'smooth' });
};

// Fungsi untuk membatalkan pembaruan catatan
document.getElementById('cancelBtn').addEventListener('click', () => {
  resetForm();
});

// Fungsi untuk mereset form
function resetForm() {
  document.getElementById('noteForm').reset();
  document.getElementById('noteId').value = "";
  document.getElementById('submitBtn').textContent = "Tambah Catatan";
  document.getElementById('cancelBtn').classList.add('hidden');
}

// Ketika form disubmit, catatan baru akan dibuat atau diperbarui
document.getElementById("noteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const noteId = document.getElementById('noteId').value;
  const titleEl = document.getElementById("title");
  const contentEl = document.getElementById("content");
  const reminderEl = document.getElementById("reminder");
  const boldTextEl = document.getElementById("boldText");
  const italicTextEl = document.getElementById("italicText");
  const fontColorEl = document.getElementById("fontColor");

  const title = titleEl.value.trim();
  const content = contentEl.value;
  const reminder = reminderEl.value ? new Date(reminderEl.value).getTime() : null;
  const isBold = boldTextEl.checked;
  const isItalic = italicTextEl.checked;
  const fontColor = fontColorEl.value;
  const createdAt = noteId ? notes.find(n => n.id == noteId).createdAt : Date.now();

  if (!title) {
    alert("Judul catatan harus diisi!");
    return;
  }

  if (noteId) {
    // Update catatan yang sudah ada
    const noteIndex = notes.findIndex(n => n.id == noteId);
    if (noteIndex !== -1) {
      // Batalkan timer pengingat lama jika ada
      if (timers[noteId]) {
        clearTimeout(timers[noteId]);
        delete timers[noteId];
      }

      // Update catatan
      notes[noteIndex] = {
        ...notes[noteIndex],
        title,
        content,
        reminder,
        isBold,
        isItalic,
        fontColor,
        updatedAt: Date.now()
      };

      // Buat jadwal pengingat baru jika ada
      if (reminder) {
        scheduleReminder(notes[noteIndex], reminder);
      }
    }
  } else {
    // Buat catatan baru
    const newNote = {
      id: Date.now(),
      title,
      content,
      reminder,
      isBold,
      isItalic,
      fontColor,
      createdAt
    };

    notes.push(newNote);

    // Buat jadwal pengingat jika ada
    if (reminder) {
      scheduleReminder(newNote, reminder);
    }
  }

  // Simpan ke localStorage
  saveNotes();
  displayNotes();

  // Reset form
  resetForm();
  // Sembunyikan form setelah operasi selesai
  document.getElementById('noteForm').classList.add('hidden');
  document.getElementById('toggleFormBtn').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
      <path d="M16 3v4"></path>
      <path d="M8 3v4"></path>
      <path d="M4 11h16"></path>
      <path d="M11 15h1"></path>
      <path d="M12 15v3"></path>
    </svg>
    <span>Tambah Catatan</span>
  `;
});

// Fungsi untuk menghapus catatan (ke history)
window.deleteNote = function(noteId) {
  const noteIndex = notes.findIndex(note => note.id === noteId);
  if (noteIndex !== -1) {
    // Batalkan timer pengingat jika ada
    if (timers[noteId]) {
      clearTimeout(timers[noteId]);
      delete timers[noteId];
    }

    // Pindahkan ke history dengan menambahkan deletedAt
    const deletedNote = {
      ...notes[noteIndex],
      deletedAt: Date.now()
    };

    historyNotes.push(deletedNote);
    // Hapus dari catatan aktif
    notes.splice(noteIndex, 1);

    // Simpan perubahan
    saveNotes();
    displayNotes();
    displayHistoryNotes();
  }
};

// Fungsi untuk menghapus catatan secara permanen dari history
window.deletePermanently = function(noteId) {
  historyNotes = historyNotes.filter(note => note.id !== noteId);
  saveNotes();
  displayHistoryNotes();
};

// Fungsi untuk memulihkan catatan dari history
window.restoreNote = function(noteId) {
  const historyIndex = historyNotes.findIndex(note => note.id === noteId);
  if (historyIndex !== -1) {
    const restoredNote = historyNotes[historyIndex];

    // Jika ada waktu reminder dan belum lewat, buat jadwal pengingat baru
    if (restoredNote.reminder) {
      const now = Date.now();
      if (restoredNote.reminder > now) {
        scheduleReminder(restoredNote, restoredNote.reminder);
      }
    }

    // Tambahkan kembali ke catatan aktif
    notes.push(restoredNote);
    // Hapus dari history
    historyNotes.splice(historyIndex, 1);

    // Simpan perubahan
    saveNotes();
    displayNotes();
    displayHistoryNotes();
  }
};

// Fungsi untuk menyimpan catatan aktif dan history ke localStorage
function saveNotes() {
  localStorage.setItem("activeNotes", JSON.stringify(notes));
  localStorage.setItem("historyNotes", JSON.stringify(historyNotes));
}

// Fungsi untuk memuat catatan dari localStorage
function loadNotes() {
  const storedActiveNotes = localStorage.getItem("activeNotes");
  const storedHistoryNotes = localStorage.getItem("historyNotes");

  if (storedActiveNotes) {
    notes = JSON.parse(storedActiveNotes);
    // Buat jadwal pengingat untuk catatan aktif yang memiliki pengaturan waktu pengingat
    notes.forEach(note => {
      if (note.reminder) {
        const now = Date.now();
        // Hanya buat pengingat jika waktunya belum lewat
        if (note.reminder > now) {
          scheduleReminder(note, note.reminder);
        }
      }
    });
  }

  if (storedHistoryNotes) {
    historyNotes = JSON.parse(storedHistoryNotes);
  }
}

// Fungsi untuk mengatur jadwal pengingat menggunakan setTimeout
function scheduleReminder(note, reminderTime) {
  // Jika reminderTime adalah string (dari localStorage), konversi ke number
  if (typeof reminderTime === 'string') {
    reminderTime = new Date(reminderTime).getTime();
  }

  const reminderDateTime = new Date(reminderTime);
  const now = new Date();
  const delay = reminderDateTime.getTime() - now.getTime();

  // Jika waktu pengingat telah berlalu, abaikan reminder ini.
  if (delay < 0) {
    return;
  }

  const timerId = setTimeout(() => {
    // Tampilkan notifikasi pengingat
    if (confirm(`Pengingat:
jud<think>

ul: ${note.title}
isi: ${note.content}`)) {
      alert("Anda telah teringat!");
    }

    // Setelah pengingat ditampilkan, pindahkan catatan ke history
    deleteNote(note.id);
  }, delay);

  timers[note.id] = timerId;
}

// Fungsi untuk memeriksa pengingat yang sudah lewat saat aplikasi dimulai
function checkExpiredReminders() {
  const now = Date.now();
  let hasExpired = false;

  // Periksa catatan aktif
  notes.forEach(note => {
    if (note.reminder && note.reminder <= now) {
      hasExpired = true;
      // Hampiri pengguna tentang pengingat yang sudah lewat
      alert(`Pengingat untuk catatan "${note.title}" sudah lewat pada ${new Date(note.reminder).toLocaleString()}`);

      // Pindahkan catatan ke history
      deleteNote(note.id);
    }
  });

  // Jika ada pengingat yang sudah lewat, perbarui tampilan
  if (hasExpired) {
    displayNotes();
    displayHistoryNotes();
  }
}

// Ketika halaman dimuat, kita ambil catatan dari localStorage dan buat jadwal pengingat.
window.addEventListener('load', () => {
  loadNotes();
  displayNotes();
  displayHistoryNotes();
  setupLayout();
  setupKeyboardShortcuts();
  setupToggleForm();
  setupTabs();
  checkExpiredReminders();

  // Mulai interval untuk memeriksa pengingat yang sudah lewat setiap menit
  setInterval(checkExpiredReminders, 60000); // Periksa setiap 1 menit
});

// Fungsi untuk mengatur layout dua kolom
function setupLayout() {
  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'left-column';

  const rightColumn = document.createElement('div');
  rightColumn.className = 'right-column';

  // Pindahkan form ke kolom kiri
  const noteForm = document.getElementById('noteForm');
  const toggleBtn = document.getElementById('toggleFormBtn');

  leftColumn.appendChild(toggleBtn);
  leftColumn.appendChild(noteForm);

  // Pindahkan tabs container ke kolom kanan
  const tabsContainer = document.querySelector('.tabs-container');
  rightColumn.appendChild(tabsContainer);

  // Tambahkan container utama ke body
  document.body.insertBefore(mainContainer, document.querySelector('h1').nextSibling);
  mainContainer.appendChild(leftColumn);
  mainContainer.appendChild(rightColumn);
}

// Fungsi untuk mengatur event listener keyboard shortcuts
function setupKeyboardShortcuts() {
  const contentEl = document.getElementById('content');
  const boldTextEl = document.getElementById('boldText');
  const italicTextEl = document.getElementById('italicText');

  contentEl.addEventListener('keydown', (e) => {
    // Ctrl+B untuk bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      boldTextEl.checked = !boldTextEl.checked;
      applyTextStyling();
    }
    // Ctrl+I untuk italic
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      italicTextEl.checked = !italicTextEl.checked;
      applyTextStyling();
    }
  });
}

// Fungsi untuk mengatur event listener tombol toggle form
function setupToggleForm() {
  const toggleBtn = document.getElementById('toggleFormBtn');
  const noteForm = document.getElementById('noteForm');

  toggleBtn.addEventListener('click', () => {
    noteForm.classList.toggle('hidden');

    // Ubah teks tombol berdasarkan status form
    if (noteForm.classList.contains('hidden')) {
      toggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
          <path d="M16 3v4"></path>
          <path d="M8 3v4"></path>
          <path d="M4 11h16"></path>
          <path d="M11 15h1"></path>
          <path d="M12 15v3"></path>
        </svg>
        <span>Tambah Catatan</span>
      `;
    } else {
      toggleBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
          <path d="M8 3h8v4H8z"></path>
          <path d="M8 11h8v4H8z"></path>
          <path d="M8 19h8v4H8z"></path>
        </svg>
        <span>Sembunyikan Form</span>
      `;
    }
  });
}

// Fungsi untuk menerapkan styling teks pada textarea
function applyTextStyling() {
  const contentEl = document.getElementById('content');
  const boldTextEl = document.getElementById('boldText');
  const italicTextEl = document.getElementById('italicText');

  let style = "";

  if (boldTextEl.checked) style += "font-weight: bold;";
  if (italicTextEl.checked) style += "font-style: italic;";

  contentEl.style.cssText = style;
}

// Event listener untuk checkbox styling
document.getElementById('boldText').addEventListener('change', applyTextStyling);
document.getElementById('italicText').addEventListener('change', applyTextStyling);
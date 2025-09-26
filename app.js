// Array untuk menyimpan catatan aktif
let notes = [];
// Array untuk menyimpan catatan yang dihapus (history)
let historyNotes = [];
// Objek untuk menyimpan timer setiap note dengan pengingat
const timers = {};

// Fungsi untuk menangani error runtime (Chrome extension errors)
function handleRuntimeError(error) {
    if (error && error.message && error.message.includes('Receiving end does not exist')) {
        console.warn('Extension connection error handled:', error.message);
        return true; // Error handled
    }
    return false; // Error not handled
}

// Fungsi untuk safe message passing (mengatasi extension errors)
function safeMessagePass(callback) {
    try {
        if (typeof callback === 'function') {
            callback();
        }
    } catch (error) {
        if (!handleRuntimeError(error)) {
            console.error('Unexpected error:', error);
        }
    }
}

// Crypto API configuration
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'sui', 'binancecoin', 'solana', 'worldcoin-wld'];
const CRYPTO_DISPLAY_NAMES = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'sui': 'SUI',
    'binancecoin': 'BNB',
    'solana': 'SOL',
    'worldcoin-wld': 'WLD'
};

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

// Fungsi untuk fetch harga cryptocurrency
async function fetchCryptoPrices() {
    try {
        const cryptoContainer = document.getElementById('cryptoContainer');
        if (!cryptoContainer) return;

        cryptoContainer.innerHTML = '<div class="loading">Loading prices...</div>';

        const symbols = CRYPTO_SYMBOLS.join(',');
        const response = await fetch(`${CRYPTO_API_URL}?ids=${symbols}&vs_currencies=usd&include_24hr_change=true`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayCryptoPrices(data);
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        const cryptoContainer = document.getElementById('cryptoContainer');
        if (cryptoContainer) {
            cryptoContainer.innerHTML = '<div class="error">Failed to load prices</div>';
        }
    }
}

// Fungsi untuk menampilkan harga cryptocurrency
function displayCryptoPrices(data) {
    const cryptoContainer = document.getElementById('cryptoContainer');
    if (!cryptoContainer) return;

    cryptoContainer.innerHTML = '';

    CRYPTO_SYMBOLS.forEach(symbol => {
        if (data[symbol]) {
            const cryptoItem = document.createElement('div');
            cryptoItem.className = 'crypto-item';

            const price = data[symbol].usd;
            const change24h = data[symbol].usd_24h_change;
            const displayName = CRYPTO_DISPLAY_NAMES[symbol];

            const changeClass = change24h >= 0 ? 'price-up' : 'price-down';
            const changeSign = change24h >= 0 ? '+' : '';

            cryptoItem.innerHTML = `
        <div class="crypto-symbol">${displayName}</div>
        <div class="crypto-price">$${price.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: price < 1 ? 6 : 2 
        })}</div>
        <div class="crypto-change ${changeClass}">
          ${changeSign}${change24h.toFixed(2)}%
        </div>
      `;

            cryptoContainer.appendChild(cryptoItem);
        }
    });
}

// Update jam digital setiap detik
setInterval(updateDigitalClock, 1000);
// Update harga crypto setiap 30 detik
setInterval(fetchCryptoPrices, 30000);
// Update segera saat halaman dimuat
updateDigitalClock();

// Fungsi untuk menampilkan tab yang dipilih
function showTab(tabName) {
    // Sembunyikan semua tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    // Hapus kelas active dari semua tombol tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Tampilkan tab yang dipilih
    const targetTab = tabName === 'active' ? 'activeNotes' : 'historyNotes';
    const tabContent = document.getElementById(targetTab);
    if (tabContent) {
        tabContent.classList.remove('hidden');
        tabContent.classList.add('active');
    }

    // Tambahkan kelas active ke tombol tab yang sesuai
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
}

// Fungsi untuk menampilkan semua catatan ke dalam container
function displayNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

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
    if (!container) return;

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
    const deletedInfo = isHistory && note.deletedAt ?
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
      <span>Dibuat: ${formattedDate} (${timeAgo})</span>
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
  const activeTimeElements = document.querySelectorAll('#notesContainer .creation-time span');
  activeTimeElements.forEach((el, index) => {
    if (index < notes.length) {
      const createdDate = new Date(notes[index].createdAt);
      const timeAgo = formatTimeAgo(createdDate);

      // Ambil teks asli dan ganti bagian timeAgo
      const text = el.textContent;
      const parts = text.split(' (');
      if (parts.length === 2) {
        el.textContent = `${parts} (${timeAgo})`;
      }
    }
  });

  // Update untuk catatan history
  const historyTimeElements = document.querySelectorAll('#historyContainer .creation-time span');
  historyTimeElements.forEach((el, index) => {
    if (index < historyNotes.length) {
      const createdDate = new Date(historyNotes[index].createdAt);
      const timeAgo = formatTimeAgo(createdDate);

      // Ambil teks asli dan ganti bagian timeAgo
      const text = el.textContent;
      const parts = text.split(' (');
      if (parts.length === 2) {
        el.textContent = `${parts} (${timeAgo})`;
      }
    }
  });
}

// Fungsi untuk mempersiapkan pembaruan catatan
window.prepareUpdateNote = function(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  // Isi form dengan data catatan
  const noteIdEl = document.getElementById('noteId');
  const titleEl = document.getElementById('title');
  const contentEl = document.getElementById('content');
  const boldTextEl = document.getElementById('boldText');
  const italicTextEl = document.getElementById('italicText');
  const fontColorEl = document.getElementById('fontColor');
  const reminderEl = document.getElementById('reminder');
  
  if (noteIdEl) noteIdEl.value = note.id;
  if (titleEl) titleEl.value = note.title;
  if (contentEl) contentEl.value = note.content;
  if (boldTextEl) boldTextEl.checked = note.isBold;
  if (italicTextEl) italicTextEl.checked = note.isItalic;
  if (fontColorEl) fontColorEl.value = note.fontColor || '#000000';

  if (note.reminder && reminderEl) {
    const date = new Date(note.reminder);
    const formattedDate = date.toISOString().slice(0, 16); // Format untuk input datetime-local
    reminderEl.value = formattedDate;
  } else if (reminderEl) {
    reminderEl.value = "";
  }

  // Ubah teks tombol submit
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  if (submitBtn) submitBtn.textContent = "Update Catatan";
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  // Tampilkan form jika belum ditampilkan
  const noteForm = document.getElementById('noteForm');
  const toggleBtn = document.getElementById('toggleFormBtn');
  if (noteForm && noteForm.classList.contains('hidden') && toggleBtn) {
    toggleBtn.click();
  }

  // Scroll ke form
  if (noteForm) {
    noteForm.scrollIntoView({ behavior: 'smooth' });
  }
};

// Fungsi untuk membatalkan pembaruan catatan
function setupCancelButton() {
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetForm();
    });
  }
}

// Fungsi untuk mereset form
function resetForm() {
  const noteForm = document.getElementById('noteForm');
  const noteIdEl = document.getElementById('noteId');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  if (noteForm) noteForm.reset();
  if (noteIdEl) noteIdEl.value = "";
  if (submitBtn) submitBtn.textContent = "Tambah Catatan";
  if (cancelBtn) cancelBtn.classList.add('hidden');
}

// Setup form submission
function setupFormSubmission() {
  const noteForm = document.getElementById("noteForm");
  if (!noteForm) return;

  noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const noteIdEl = document.getElementById('noteId');
    const titleEl = document.getElementById("title");
    const contentEl = document.getElementById("content");
    const reminderEl = document.getElementById("reminder");
    const boldTextEl = document.getElementById("boldText");
    const italicTextEl = document.getElementById("italicText");
    const fontColorEl = document.getElementById("fontColor");

    if (!titleEl || !contentEl) return;

    const noteId = noteIdEl ? noteIdEl.value : '';
    const title = titleEl.value.trim();
    const content = contentEl.value;
    const reminder = reminderEl && reminderEl.value ? new Date(reminderEl.value).getTime() : null;
    const isBold = boldTextEl ? boldTextEl.checked : false;
    const isItalic = italicTextEl ? italicTextEl.checked : false;
    const fontColor = fontColorEl ? fontColorEl.value : '#000000';
    const createdAt = noteId ? notes.find(n => n.id == noteId)?.createdAt || Date.now() : Date.now();

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
    safeMessagePass(() => {
      saveNotes();
      displayNotes();
      resetForm();
      
      // Sembunyikan form setelah operasi selesai
      const noteForm = document.getElementById('noteForm');
      const toggleBtn = document.getElementById('toggleFormBtn');
      if (noteForm) noteForm.classList.add('hidden');
      if (toggleBtn) {
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
      }
    });
  });
}

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
    safeMessagePass(() => {
      saveNotes();
      displayNotes();
      displayHistoryNotes();
    });
  }
};

// Fungsi untuk menghapus catatan secara permanen dari history
window.deletePermanently = function(noteId) {
  historyNotes = historyNotes.filter(note => note.id !== noteId);
  safeMessagePass(() => {
    saveNotes();
    displayHistoryNotes();
  });
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
    safeMessagePass(() => {
      saveNotes();
      displayNotes();
      displayHistoryNotes();
    });
  }
};

// Fungsi untuk menyimpan catatan aktif dan history ke localStorage
function saveNotes() {
  try {
    localStorage.setItem("activeNotes", JSON.stringify(notes));
    localStorage.setItem("historyNotes", JSON.stringify(historyNotes));
  } catch (error) {
    console.error('Error saving notes to localStorage:', error);
  }
}

// Fungsi untuk memuat catatan dari localStorage
function loadNotes() {
  try {
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
  } catch (error) {
    console.error('Error loading notes from localStorage:', error);
    notes = [];
    historyNotes = [];
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
    safeMessagePass(() => {
      if (confirm(`Pengingat:
Judul: ${note.title}
Isi: ${note.content}`)) {
        alert("Anda telah teringat!");
      }

      // Setelah pengingat ditampilkan, pindahkan catatan ke history
      deleteNote(note.id);
    });
  }, delay);

  timers[note.id] = timerId;
}

// Fungsi untuk memeriksa pengingat yang sudah lewat saat aplikasi dimulai
function checkExpiredReminders() {
  const now = Date.now();
  let hasExpired = false;

  // Periksa catatan aktif
  const expiredNotes = notes.filter(note => note.reminder && note.reminder <= now);
  
  expiredNotes.forEach(note => {
    hasExpired = true;
    // Hampiri pengguna tentang pengingat yang sudah lewat
    alert(`Pengingat untuk catatan "${note.title}" sudah lewat pada ${new Date(note.reminder).toLocaleString()}`);

    // Pindahkan catatan ke history
    deleteNote(note.id);
  });

  // Jika ada pengingat yang sudah lewat, perbarui tampilan
  if (hasExpired) {
    safeMessagePass(() => {
      displayNotes();
      displayHistoryNotes();
    });
  }
}

// Fungsi untuk toggle tema gelap/terang
function toggleTheme() {
  document.body.classList.toggle('dark-theme');

  // Simpan preferensi tema ke localStorage
  const isDark = document.body.classList.contains('dark-theme');
  try {
    localStorage.setItem('darkTheme', isDark);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }

  // Ubah ikon tema
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    if (isDark) {
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    } else {
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
  }
}

// Setup refresh crypto button
function setupCryptoRefresh() {
  const refreshBtn = document.getElementById('refreshCrypto');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchCryptoPrices();
    });
  }
}

// Ketika halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
  // Muat tema yang disimpan
  try {
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme === 'true') {
      document.body.classList.add('dark-theme');
      const themeIcon = document.getElementById('themeIcon');
      if (themeIcon) {
        themeIcon.innerHTML = `
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
      }
    } else {
      const themeIcon = document.getElementById('themeIcon');
      if (themeIcon) {
        themeIcon.innerHTML = `
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></lineSe>
        `;
      }
    }
  } catch (error) {
    console.error('Error loading theme preference:', error);
  }

  // Setup event listeners
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Setup event listener untuk tombol tab
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      if (tabName) {
        showTab(tabName);
      }
    });
  });

  // Setup semua fungsi
  safeMessagePass(() => {
    loadNotes();
    displayNotes();
    displayHistoryNotes();
    setupFormSubmission();
    setupCancelButton();
    setupKeyboardShortcuts();
    setupToggleForm();
    setupCryptoRefresh();
    checkExpiredReminders();
    fetchCryptoPrices(); // Load crypto prices immediately
  });

  // Mulai interval untuk memeriksa pengingat yang sudah lewat setiap menit
  setInterval(() => {
    safeMessagePass(checkExpiredReminders);
  }, 60000); // Periksa setiap 1 menit
});

// Fungsi untuk mengatur event listener keyboard shortcuts
function setupKeyboardShortcuts() {
  const contentEl = document.getElementById('content');
  const boldTextEl = document.getElementById('boldText');
  const italicTextEl = document.getElementById('italicText');

  if (contentEl && boldTextEl && italicTextEl) {
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

  // Event listener untuk checkbox styling
  if (boldTextEl) {
    boldTextEl.addEventListener('change', applyTextStyling);
  }
  if (italicTextEl) {
    italicTextEl.addEventListener('change', applyTextStyling);
  }
}

// Fungsi untuk mengatur event listener tombol toggle form
function setupToggleForm() {
  const toggleBtn = document.getElementById('toggleFormBtn');
  const noteForm = document.getElementById('noteForm');

  if (toggleBtn && noteForm) {
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span>Sembunyikan Form</span>
        `;
      }
    });
  }
}

// Fungsi untuk menerapkan styling teks pada textarea
function applyTextStyling() {
  const contentEl = document.getElementById('content');
  const boldTextEl = document.getElementById('boldText');
  const italicTextEl = document.getElementById('italicText');

  if (contentEl && boldTextEl && italicTextEl) {
    let style = "";

    if (boldTextEl.checked) style += "font-weight: bold;";
    if (italicTextEl.checked) style += "font-style: italic;";

    contentEl.style.cssText = style;
  }
}
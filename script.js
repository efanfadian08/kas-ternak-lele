// Default Master Categories
const CATEGORIES = {
    pemasukan: ['Kas Mingguan', 'Denda Transfer', 'Sumbangan Online', 'Lain-lain'],
    pengeluaran: ['Alat Tulis & Fotokopi', 'Acara Kelas', 'Lomba', 'Kebersihan', 'Lain-lain']
};

// State Aplikasi
let transactions = [];
let students = [];
let tempCompressedImage = null; // Menyimpan temporary base64 image yang sudah dikompres
let isAdmin = false; // Flag Mode Admin (Default: false / Client)
const ADMIN_PIN = "0208"; // PIN Admin Default

// --- MANAJEMEN STORAGE ---
function loadDataFromStorage() {
    const savedTrans = localStorage.getItem('kas_transactions');
    const savedStudents = localStorage.getItem('kas_students');

    if (savedTrans) {
        transactions = JSON.parse(savedTrans);
    } else {
        transactions = [];
        saveTransactions();
    }

    if (savedStudents) {
        students = JSON.parse(savedStudents);
    } else {
        students = [
            { id: '1', nama: 'Efan Fadian', paid: true },
            { id: '2', nama: 'Budi Santoso', paid: false },
            { id: '3', nama: 'Citra Dewi', paid: true },
            { id: '4', nama: 'Dewi Lestari', paid: false }
        ];
        saveStudents();
    }
}

function saveTransactions() {
    localStorage.setItem('kas_transactions', JSON.stringify(transactions));
}

function saveStudents() {
    localStorage.setItem('kas_students', JSON.stringify(students));
}

function getFormattedDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

function updateCategoryOptions() {
    const checkedRadio = document.querySelector('input[name="jenis"]:checked');
    if (!checkedRadio) return;
    const jenis = checkedRadio.value;
    const selectKategori = document.getElementById('inputKategori');
    if (!selectKategori) return;
    
    selectKategori.innerHTML = '';
    CATEGORIES[jenis].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        selectKategori.appendChild(opt);
    });
}

// --- AUTENTIKASI ADMIN & PERMISSION CONTROLLER ---
window.toggleAdminMode = function() {
    if (isAdmin) {
        // Keluar dari mode Admin ke Client
        isAdmin = false;
        showToast('Anda kembali ke Mode Client (Mahasiswa)', 'info');
        updateAdminUI();
        renderAll();
    } else {
        // Buka Modal PIN
        const modal = document.getElementById('adminAuthModal');
        const pinInput = document.getElementById('adminPinInput');
        
        if (pinInput) pinInput.value = '';
        
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                if (pinInput) pinInput.focus();
            }, 100);
        }
    }
};

window.closeAdminModal = function() {
    const modal = document.getElementById('adminAuthModal');
    if (modal) modal.classList.add('hidden');
};

window.verifyAdminPin = function() {
    const pinInput = document.getElementById('adminPinInput');
    if (!pinInput) return;
    
    const enteredPin = pinInput.value.trim();
    if (enteredPin === ADMIN_PIN) {
        isAdmin = true;
        closeAdminModal();
        showToast('Login Admin Berhasil! Mode Admin Aktif.', 'success');
        updateAdminUI();
        renderAll();
    } else {
        showToast('PIN Admin salah!', 'error');
        pinInput.value = '';
        pinInput.focus();
    }
};

function updateAdminUI() {
    const authText = document.getElementById('adminAuthText');
    const authBtn = document.getElementById('adminAuthBtn');
    const btnReset = document.getElementById('btnResetData');
    const btnExport = document.getElementById('btnExportExcel');
    const btnImport = document.getElementById('btnImportExcel');
    const btnCopy = document.getElementById('btnCopyTable');
    const btnAddStudent = document.getElementById('btnAddStudent');

    if (isAdmin) {
        if (authText) authText.innerText = 'Mode: Admin (Aktif)';
        if (authBtn) authBtn.className = 'bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm active:scale-95 border border-amber-400 cursor-pointer z-10';
        
        if (btnReset) btnReset.classList.remove('hidden');
        if (btnExport) btnExport.classList.remove('hidden');
        if (btnImport) btnImport.classList.remove('hidden');
        if (btnCopy) btnCopy.classList.remove('hidden');
        if (btnAddStudent) btnAddStudent.classList.remove('hidden');
    } else {
        if (authText) authText.innerText = 'Mode: Client (Mahasiswa)';
        if (authBtn) authBtn.className = 'bg-indigo-800 hover:bg-indigo-900 text-white px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm active:scale-95 border border-indigo-500 cursor-pointer z-10';

        if (btnReset) btnReset.classList.add('hidden');
        if (btnExport) btnExport.classList.add('hidden');
        if (btnImport) btnImport.classList.add('hidden');
        if (btnCopy) btnCopy.classList.add('hidden');
        if (btnAddStudent) btnAddStudent.classList.add('hidden');
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- HANDLER PRATINJAU & KOMPRESI GAMBAR ---
window.handleImagePreview = function(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('formImagePreviewContainer');
    const previewImg = document.getElementById('formImagePreview');

    if (!file) {
        tempCompressedImage = null;
        previewContainer.classList.add('hidden');
        return;
    }

    // Kompresi Gambar Menggunakan Canvas
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Resize maks lebar 800px untuk hemat storage
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Re-encode ke JPEG kualitas 0.7
            tempCompressedImage = canvas.toDataURL('image/jpeg', 0.7);

            // Tampilkan Pratinjau di Form
            previewImg.src = tempCompressedImage;
            previewContainer.classList.remove('hidden');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// --- RENDER LOGIC ---
function renderAll() {
    renderSummaryCards();
    renderTransactions();
    renderStudents();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderSummaryCards() {
    let totalMasuk = 0;
    let countMasuk = 0;
    let totalKeluar = 0;
    let countKeluar = 0;

    transactions.forEach(t => {
        if (t.jenis === 'pemasukan') {
            totalMasuk += Number(t.jumlah);
            countMasuk++;
        } else {
            totalKeluar += Number(t.jumlah);
            countKeluar++;
        }
    });

    const saldoAkhir = totalMasuk - totalKeluar;

    document.getElementById('statTotalSaldo').innerText = formatRupiah(saldoAkhir);
    document.getElementById('statPemasukan').innerText = formatRupiah(totalMasuk);
    document.getElementById('statJumlahPemasukan').innerText = `${countMasuk} Transfer Masuk`;
    document.getElementById('statPengeluaran').innerText = formatRupiah(totalKeluar);
    document.getElementById('statJumlahPengeluaran').innerText = `${countKeluar} Transfer Keluar`;
}

function renderTransactions() {
    const tbody = document.getElementById('transactionTableBody');
    const emptyState = document.getElementById('emptyState');
    const search = document.getElementById('searchQuery').value.toLowerCase();
    const filterJenis = document.getElementById('filterJenis').value;

    tbody.innerHTML = '';

    const filtered = transactions.filter(t => {
        const matchSearch = t.keterangan.toLowerCase().includes(search) || 
                            t.kategori.toLowerCase().includes(search) ||
                            (t.namaPengirim && t.namaPengirim.toLowerCase().includes(search)) ||
                            (t.metode && t.metode.toLowerCase().includes(search)) ||
                            t.tanggal.includes(search);
        const matchJenis = filterJenis === 'semua' || t.jenis === filterJenis;
        return matchSearch && matchJenis;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        filtered.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition';

            const isMasuk = t.jenis === 'pemasukan';
            const photoThumbnail = t.buktiFoto 
                ? `<button type="button" onclick="openImageModal('${t.buktiFoto}')" class="group relative inline-block overflow-hidden rounded-lg border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-500 transition">
                     <img src="${t.buktiFoto}" alt="Bukti" class="w-10 h-10 object-cover group-hover:scale-105 transition">
                   </button>` 
                : `<span class="text-[10px] text-rose-500 font-bold">Tanpa Bukti</span>`;

            // Tombol hapus hanya muncul untuk Admin
            const deleteActionBtn = isAdmin 
                ? `<button type="button" onclick="deleteTransaction('${t.id}')" class="p-1 text-slate-400 hover:text-rose-600 transition" title="Hapus">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                   </button>`
                : `<span class="text-[10px] text-slate-400 italic">Terkuci</span>`;

            tr.innerHTML = `
                <td class="py-3 px-3 text-slate-600 whitespace-nowrap">${formatTanggalIndo(t.tanggal)}</td>
                <td class="py-3 px-3 whitespace-nowrap">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mr-1">
                        ${t.metode || 'Transfer'}
                    </span>
                    <span class="text-slate-800 font-semibold">${t.namaPengirim || '-'}</span>
                </td>
                <td class="py-3 px-3">
                    <div class="font-medium text-slate-800">${t.keterangan}</div>
                    <div class="text-[10px] text-slate-400">${t.kategori}</div>
                </td>
                <td class="py-3 px-3 text-center whitespace-nowrap">${photoThumbnail}</td>
                <td class="py-3 px-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-600'} whitespace-nowrap">
                    ${isMasuk ? '+' : '-'} ${formatRupiah(t.jumlah)}
                </td>
                <td class="py-3 px-3 text-center">
                    ${deleteActionBtn}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function renderStudents() {
    const container = document.getElementById('studentListContainer');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-2">Belum ada data siswa.</p>`;
        return;
    }

    students.forEach(s => {
        const item = document.createElement('div');
        item.className = `flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
            s.paid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`;

        // Checkbox toggle & Hapus hanya bisa oleh Admin
        const checkboxEl = isAdmin 
            ? `<input type="checkbox" ${s.paid ? 'checked' : ''} onchange="toggleStudentPaid('${s.id}')" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer">`
            : `<input type="checkbox" ${s.paid ? 'checked' : ''} disabled class="rounded border-slate-300 text-slate-300 w-4 h-4 cursor-not-allowed">`;

        const deleteStudentBtn = isAdmin 
            ? `<button type="button" onclick="deleteStudent('${s.id}')" class="text-slate-300 hover:text-rose-500 transition">
                    <i data-lucide="x-circle" class="w-4 h-4"></i>
               </button>`
            : '';

        item.innerHTML = `
            <label class="flex items-center gap-2 ${isAdmin ? 'cursor-pointer' : 'cursor-default'} flex-1">
                ${checkboxEl}
                <span class="font-medium ${s.paid ? 'line-through text-slate-400' : 'text-slate-700'}">${s.nama}</span>
            </label>
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }">
                    ${s.paid ? 'Lunas' : 'Belum'}
                </span>
                ${deleteStudentBtn}
            </div>
        `;
        container.appendChild(item);
    });
}

// --- ADD TRANSACTION HANDLER ---
window.handleAddTransaction = async function(e) {
    e.preventDefault();
    const tanggal = document.getElementById('inputTanggal').value;
    const jenis = document.querySelector('input[name="jenis"]:checked').value;
    const metode = document.getElementById('inputMetode').value;
    const kategori = document.getElementById('inputKategori').value;
    const namaPengirim = document.getElementById('inputNamaPengirim').value;
    const keterangan = document.getElementById('inputKeterangan').value;
    const jumlah = parseFloat(document.getElementById('inputJumlah').value);

    // Cek Bukti Transfer Wajib
    if (!tempCompressedImage) {
        showToast('WAJIB mengunggah bukti foto transfer!', 'error');
        return;
    }

    const newTrans = {
        id: Date.now().toString(),
        tanggal,
        jenis,
        metode,
        kategori,
        namaPengirim,
        keterangan,
        jumlah,
        buktiFoto: tempCompressedImage
    };

    transactions.push(newTrans);
    saveTransactions();
    renderAll();

    // Reset Input Form
    document.getElementById('inputNamaPengirim').value = '';
    document.getElementById('inputKeterangan').value = '';
    document.getElementById('inputJumlah').value = '';
    document.getElementById('inputBuktiFoto').value = '';
    document.getElementById('formImagePreviewContainer').classList.add('hidden');
    tempCompressedImage = null;

    showToast('Transaksi transfer berhasil dicatat!', 'success');
};

// --- EKSPOR EXCEL ---
window.exportToExcel = function() {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat mengekspor data Excel!', 'error');
        return;
    }

    if (transactions.length === 0) {
        showToast('Tidak ada data transaksi untuk diekspor', 'error');
        return;
    }

    let totalMasuk = 0;
    let totalKeluar = 0;
    transactions.forEach(t => {
        if (t.jenis === 'pemasukan') totalMasuk += t.jumlah;
        else totalKeluar += t.jumlah;
    });

    const transData = transactions.map((t, idx) => ({
        'No': idx + 1,
        'Tanggal': t.tanggal,
        'Jenis': t.jenis.toUpperCase(),
        'Metode Pembayaran': t.metode || 'Transfer',
        'Nama Pengirim/Rekening': t.namaPengirim || '-',
        'Kategori': t.kategori,
        'Keterangan': t.keterangan,
        'Status Bukti Foto': t.buktiFoto ? 'ADA (TERVERIFIKASI)' : 'TIDAK ADA',
        'Jumlah (Rp)': t.jumlah
    }));

    const summaryData = [
        { 'Keterangan': 'Total Pemasukan Transfer', 'Nilai (Rp)': totalMasuk },
        { 'Keterangan': 'Total Pengeluaran Transfer', 'Nilai (Rp)': totalKeluar },
        { 'Keterangan': 'Saldo Akhir Kas', 'Nilai (Rp)': totalMasuk - totalKeluar }
    ];

    const wb = XLSX.utils.book_new();
    const wsTransactions = XLSX.utils.json_to_sheet(transData);
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(wb, wsTransactions, "Riwayat Transfer");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Rekap Kas");

    XLSX.writeFile(wb, `Kas_Kelas_Transfer_${getFormattedDate()}.xlsx`);
    showToast('Berhasil mengunduh laporan Excel!', 'success');
};

// IMPOR DARI EXCEL
window.importFromExcel = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const importedJson = XLSX.utils.sheet_to_json(worksheet);

            if (importedJson.length === 0) {
                showToast('File Excel kosong atau format tidak sesuai', 'error');
                return;
            }

            let addedCount = 0;

            importedJson.forEach(row => {
                const tanggal = row['Tanggal'] || row['tanggal'] || getFormattedDate();
                const jenisInput = (row['Jenis'] || row['jenis'] || 'pemasukan').toString().toLowerCase();
                const jenis = jenisInput.includes('keluar') || jenisInput.includes('pengeluaran') ? 'pengeluaran' : 'pemasukan';
                const metode = row['Metode Pembayaran'] || row['Metode'] || 'Transfer';
                const namaPengirim = row['Nama Pengirim/Rekening'] || row['Pengirim'] || '-';
                const kategori = row['Kategori'] || row['kategori'] || 'Lain-lain';
                const keterangan = row['Keterangan'] || row['keterangan'] || 'Impor Excel';
                const jumlah = parseFloat(row['Jumlah (Rp)'] || row['Jumlah'] || row['jumlah'] || 0);

                if (jumlah > 0) {
                    transactions.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                        tanggal,
                        jenis,
                        metode,
                        namaPengirim,
                        kategori,
                        keterangan,
                        jumlah,
                        buktiFoto: null
                    });
                    addedCount++;
                }
            });

            saveTransactions();
            renderAll();
            showToast(`Berhasil mengimpor ${addedCount} transaksi dari Excel!`, 'success');

        } catch (err) {
            console.error(err);
            showToast('Gagal membaca file Excel. Pastikan format file valid.', 'error');
        }

        document.getElementById('excelFileInput').value = '';
    };

    reader.readAsArrayBuffer(file);
};

// SALIN TABEL KE CLIPBOARD
window.copyTableToClipboard = function() {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat menyalin data tabel!', 'error');
        return;
    }

    if (transactions.length === 0) {
        showToast('Tidak ada data transaksi untuk disalin', 'error');
        return;
    }

    let tsvContent = "Tanggal\tJenis\tMetode\tPengirim\tKategori\tKeterangan\tJumlah (Rp)\n";

    transactions.forEach(t => {
        tsvContent += `${t.tanggal}\t${t.jenis.toUpperCase()}\t${t.metode || 'Transfer'}\t${t.namaPengirim || '-'}\t${t.kategori}\t${t.keterangan}\t${t.jumlah}\n`;
    });

    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = tsvContent;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    
    try {
        document.execCommand('copy');
        showToast('Data berhasil disalin! Tinggal Paste (Ctrl+V) di Excel / Google Sheets', 'success');
    } catch (err) {
        showToast('Gagal menyalin data', 'error');
    }

    document.body.removeChild(tempTextarea);
};

// Modal Preview Foto Handlers
window.openImageModal = function(imgSrc) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('modalPreviewImage');
    if (img) img.src = imgSrc;
    if (modal) modal.classList.remove('hidden');
};

window.closeImageModal = function() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) modal.classList.add('hidden');
};

window.deleteTransaction = function(id) {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat menghapus transaksi!', 'error');
        return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderAll();
        showToast('Transaksi berhasil dihapus', 'info');
    }
};

window.confirmResetData = function() {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat mereset data!', 'error');
        return;
    }

    if (confirm('PERHATIAN: Apakah Anda yakin ingin menghapus SEMUA data transaksi? Data tidak bisa dikembalikan kecuali Anda memiliki cadangan Excel.')) {
        transactions = [];
        saveTransactions();
        renderAll();
        showToast('Semua data transaksi telah direset', 'info');
    }
};

// --- SISWA LOGIC ---
window.toggleStudentPaid = function(id) {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat mengubah status kas siswa!', 'error');
        return;
    }

    const student = students.find(s => s.id === id);
    if (student) {
        student.paid = !student.paid;
        saveStudents();
        renderStudents();
    }
};

window.openAddStudentModal = function() {
    const modal = document.getElementById('addStudentModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeAddStudentModal = function() {
    const modal = document.getElementById('addStudentModal');
    if (modal) modal.classList.add('hidden');
    const nameInput = document.getElementById('newStudentName');
    if (nameInput) nameInput.value = '';
};

window.saveNewStudent = function() {
    const nameInput = document.getElementById('newStudentName');
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (name) {
        students.push({
            id: Date.now().toString(),
            nama: name,
            paid: false
        });
        saveStudents();
        renderStudents();
        closeAddStudentModal();
        showToast('Siswa berhasil ditambahkan', 'success');
    }
};

window.deleteStudent = function(id) {
    if (!isAdmin) {
        showToast('Hanya Admin yang dapat menghapus siswa!', 'error');
        return;
    }
    students = students.filter(s => s.id !== id);
    saveStudents();
    renderStudents();
};

// --- HELPER FORMATTING & TOAST ---
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

function formatTanggalIndo(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');

    let bgColor = 'bg-slate-800 text-white';
    if (type === 'success') bgColor = 'bg-emerald-600 text-white';
    if (type === 'error') bgColor = 'bg-rose-600 text-white';

    toast.className = `${bgColor} px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', function() {
    const inputTanggal = document.getElementById('inputTanggal');
    if (inputTanggal) inputTanggal.valueAsDate = new Date();
    
    loadDataFromStorage();
    updateCategoryOptions();
    updateAdminUI(); // Inisialisasi tampilan awal
    renderAll();
    
    // Support enter key pada input PIN modal admin
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
        pinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyAdminPin();
            }
        });
    }
});

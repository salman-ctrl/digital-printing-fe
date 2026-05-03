import Swal from 'sweetalert2';

// Alert Sukses
export const showSuccess = (title, text) => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonColor: '#3b82f6', // Blue-500
        timer: 2000,
        timerProgressBar: true
    });
};

// Alert Error
export const showError = (title, text) => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#ef4444', // Red-500
    });
};

// Alert Konfirmasi (untuk hapus atau aksi berbahaya)
export const showConfirm = async (title, text, confirmText = 'Ya, Lanjutkan') => {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: 'Batal'
    });

    return result.isConfirmed;
};

// Alert Loading (untuk proses async)
export const showLoading = (title = 'Sedang memproses...') => {
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

export const closeAlert = () => {
    Swal.close();
};
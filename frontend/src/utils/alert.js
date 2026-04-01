import Swal from 'sweetalert2';

const baseConfig = {
    customClass: {
        popup: '!rounded-2xl !shadow-2xl !border !border-gray-100',
        title: '!text-lg !font-bold !text-gray-900',
        htmlContainer: '!text-sm !text-gray-500',
        confirmButton: '!rounded-xl !px-6 !py-2.5 !text-sm !font-semibold !shadow-none',
        cancelButton: '!rounded-xl !px-6 !py-2.5 !text-sm !font-semibold !shadow-none !bg-white !text-gray-600 !border !border-gray-200',
    },
    buttonsStyling: false,
    showClass: { popup: 'animate__animated animate__fadeIn animate__faster' },
    hideClass: { popup: 'animate__animated animate__fadeOut animate__faster' },
};

/**
 * Show a success toast (auto-closes)
 */
export function alertSuccess(title, text) {
    return Swal.fire({
        ...baseConfig,
        icon: 'success',
        title,
        text,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        customClass: {
            popup: '!rounded-xl !shadow-lg !border !border-emerald-100 !bg-white',
            title: '!text-sm !font-semibold !text-gray-900 !m-0',
            htmlContainer: '!text-xs !text-gray-500 !m-0',
        },
    });
}

/**
 * Show an error toast (auto-closes)
 */
export function alertError(title, text) {
    return Swal.fire({
        ...baseConfig,
        icon: 'error',
        title,
        text: text || 'Something went wrong. Please try again.',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        customClass: {
            popup: '!rounded-xl !shadow-lg !border !border-red-100 !bg-white',
            title: '!text-sm !font-semibold !text-gray-900 !m-0',
            htmlContainer: '!text-xs !text-gray-500 !m-0',
        },
    });
}

/**
 * Show a delete confirmation dialog
 * Returns true if confirmed, false otherwise
 */
export async function alertConfirmDelete(itemName) {
    const result = await Swal.fire({
        ...baseConfig,
        icon: 'warning',
        iconColor: '#ef4444',
        title: 'Delete ' + (itemName || 'item') + '?',
        html: `Are you sure you want to delete <strong>${itemName || 'this item'}</strong>?<br/><span class="text-xs text-gray-400">This action cannot be undone.</span>`,
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef4444',
        reverseButtons: true,
    });
    return result.isConfirmed;
}

/**
 * Show a generic confirmation dialog
 */
export async function alertConfirm(title, text, confirmText = 'Confirm') {
    const result = await Swal.fire({
        ...baseConfig,
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#111827',
        reverseButtons: true,
    });
    return result.isConfirmed;
}

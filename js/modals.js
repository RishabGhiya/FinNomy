/**
 * FinNomy Global Modals Controller (js/modals.js)
 * Handles Connect Us, Become a Partner, Privacy Policy, and Terms & Conditions modals
 * with full validation, service selection ranking, and Google Apps Script submissions.
 */

// --- Global Modal Window Functions ---
window.openConnectModal = function (preselectedService = null) {
    const modal = document.getElementById('connectModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const headerWrapper = modal.querySelector('.modal-header-wrapper');
        const scrollContent = modal.querySelector('.modal-scroll-content');
        const successScreen = document.getElementById('successScreen');

        if (headerWrapper) headerWrapper.style.display = 'block';
        if (scrollContent) scrollContent.style.display = 'block';
        if (successScreen) successScreen.style.display = 'none';

        if (preselectedService) {
            const serviceSelect = document.getElementById('inputService');
            if (serviceSelect) {
                Array.from(serviceSelect.options).forEach(opt => {
                    if (opt.value === preselectedService || opt.text === preselectedService) {
                        serviceSelect.value = opt.value;
                        serviceSelect.classList.add('visited');
                        serviceSelect.dispatchEvent(new Event('change'));
                    }
                });
            }
        }
    }
};

window.closeConnectModal = function () {
    const modal = document.getElementById('connectModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.openPartnerModal = function () {
    const modal = document.getElementById('partnerModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const headerWrapper = modal.querySelector('.modal-header-wrapper');
        const partnerForm = document.getElementById('partnerFormContent');
        const partnerSuccess = document.getElementById('partnerSuccessScreen');

        if (headerWrapper) headerWrapper.style.display = 'block';
        if (partnerForm) partnerForm.style.display = 'block';
        if (partnerSuccess) partnerSuccess.style.display = 'none';
    }
};

window.closePartnerModal = function () {
    const modal = document.getElementById('partnerModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.openPrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closePrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.openTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Global Backdrop Click & Keyboard Listeners
window.addEventListener('click', function (event) {
    const connectModal = document.getElementById('connectModalOverlay');
    const partnerModal = document.getElementById('partnerModalOverlay');
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');

    if (event.target === connectModal) window.closeConnectModal();
    if (event.target === partnerModal) window.closePartnerModal();
    if (event.target === privacyModal) window.closePrivacyModal();
    if (event.target === termsModal) window.closeTermsModal();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        window.closeConnectModal();
        window.closePartnerModal();
        window.closePrivacyModal();
        window.closeTermsModal();
    }
});

// --- Modal Form Validation & Submission Logic ---
function initFinNomyModals() {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztbbWZMcmYxBelEOnD2mPmE7zC8ZcN-vqas2B9-HLUG1Btp7k-yn-EFBZ8fJu0DYXV/exec';

    // 1. CLIENT CONNECT FORM
    const inputName = document.getElementById('inputName');
    const btnSubmit = document.getElementById('btnSubmit');

    if (inputName && btnSubmit) {
        const requiredIds = ['inputName', 'inputEmail', 'inputMobile', 'inputService', 'inputDescription', 'inputConsent'];

        function validateClientInput(id) {
            const el = document.getElementById(id);
            if (!el) return false;
            const errorMsg = el.nextElementSibling || (el.parentElement ? el.parentElement.nextElementSibling : null);
            let isValid = false;

            if (el.type === 'checkbox') {
                isValid = el.checked;
            } else if (el.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(el.value.trim());
            } else if (el.id === 'inputMobile') {
                isValid = /^\d{10}$/.test(el.value.trim());
            } else {
                isValid = el.value.trim() !== '';
            }

            if (el.classList.contains('visited')) {
                if (!isValid) {
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.style.display = 'block';
                        el.style.borderColor = '#d9534f';
                    }
                } else {
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.style.display = 'none';
                        el.style.borderColor = '#ddd';
                    }
                }
            }
            return isValid;
        }

        function checkClientFormValidity() {
            let allValid = true;
            requiredIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) {
                    allValid = false;
                    return;
                }
                let valid = false;
                if (el.type === 'checkbox') valid = el.checked;
                else if (el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
                else if (el.id === 'inputMobile') valid = /^\d{10}$/.test(el.value.trim());
                else valid = el.value.trim() !== '';

                if (!valid) allValid = false;
            });

            btnSubmit.disabled = !allValid;
            return allValid;
        }

        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('blur', () => {
                el.classList.add('visited');
                validateClientInput(id);
                checkClientFormValidity();
            });

            el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
                if (el.classList.contains('visited')) validateClientInput(id);
                checkClientFormValidity();
            });
        });

        btnSubmit.addEventListener('click', function (e) {
            e.preventDefault();
            if (checkClientFormValidity()) {
                const formData = {
                    name: document.getElementById('inputName').value.trim(),
                    company: document.getElementById('inputCompany') ? document.getElementById('inputCompany').value.trim() : '',
                    email: document.getElementById('inputEmail').value.trim(),
                    mobile: document.getElementById('inputMobile').value.trim(),
                    social: document.querySelector('#connectModalOverlay input[placeholder*="LinkedIn"]') ? document.querySelector('#connectModalOverlay input[placeholder*="LinkedIn"]').value.trim() : '',
                    website: document.querySelector('#connectModalOverlay input[placeholder*="https"]') ? document.querySelector('#connectModalOverlay input[placeholder*="https"]').value.trim() : '',
                    service: document.getElementById('inputService').value,
                    description: document.getElementById('inputDescription').value.trim(),
                    formType: 'Client Connect'
                };

                const originalBtnText = btnSubmit.textContent;
                btnSubmit.textContent = "Sending...";
                btnSubmit.disabled = true;

                fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(formData)
                })
                .then(() => {
                    const nameDisplay = document.getElementById('user-name-display');
                    if (nameDisplay) nameDisplay.textContent = formData.name;
                    const scrollContent = document.querySelector('#connectModalOverlay .modal-scroll-content');
                    if (scrollContent) scrollContent.style.display = 'none';
                    const successScreen = document.getElementById('successScreen');
                    if (successScreen) successScreen.style.display = 'flex';
                })
                .catch(error => {
                    console.error("Submission Error:", error);
                    btnSubmit.textContent = "Error! Try Again";
                    setTimeout(() => {
                        btnSubmit.textContent = originalBtnText;
                        btnSubmit.disabled = false;
                    }, 3000);
                });
            }
        });
    }

    // 2. PARTNER APPLICATION FORM
    const btnPartnerSubmit = document.getElementById('btnPartnerSubmit');
    const professionSelect = document.getElementById('partnerProfession');
    const otherInput = document.getElementById('partnerOtherInput');

    if (btnPartnerSubmit && professionSelect) {
        const partnerRequiredIds = ['partnerName', 'partnerCompany', 'partnerEmail', 'partnerMobile', 'partnerProfession', 'partnerIntro', 'partnerConsent'];
        const serviceCheckboxes = document.querySelectorAll('#partnerModalOverlay .service-checkbox-item input[type="checkbox"]');
        const serviceErrorMsg = document.getElementById('serviceErrorMsg');
        let selectedServices = [];

        professionSelect.addEventListener('change', function () {
            if (this.value === 'Other') {
                if (otherInput) {
                    otherInput.disabled = false;
                    otherInput.focus();
                }
            } else if (otherInput) {
                otherInput.disabled = true;
                otherInput.value = '';
                otherInput.classList.remove('visited');
                if (otherInput.nextElementSibling) otherInput.nextElementSibling.style.display = 'none';
                otherInput.style.borderColor = '#ddd';
            }
            checkPartnerFormValidity();
        });

        function validatePartnerInput(id) {
            const el = document.getElementById(id);
            if (!el) return false;
            const errorMsg = el.nextElementSibling || (el.parentElement ? el.parentElement.nextElementSibling : null);
            let isValid = false;

            if (el.type === 'checkbox') {
                isValid = el.checked;
            } else if (el.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(el.value.trim());
            } else if (el.id === 'partnerMobile') {
                isValid = /^\d{10}$/.test(el.value.trim());
            } else {
                isValid = el.value.trim() !== '';
            }

            if (el.classList.contains('visited')) {
                if (!isValid) {
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        if (el.id === 'partnerOtherInput' && professionSelect.value !== 'Other') {
                            errorMsg.style.display = 'none';
                            el.style.borderColor = '#ddd';
                        } else {
                            errorMsg.style.display = 'block';
                            el.style.borderColor = '#d9534f';
                        }
                    }
                } else {
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.style.display = 'none';
                        el.style.borderColor = '#ddd';
                    }
                }
            }
            return isValid;
        }

        function checkPartnerFormValidity() {
            let allValid = true;

            partnerRequiredIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) {
                    allValid = false;
                    return;
                }
                let valid = false;
                if (el.type === 'checkbox') valid = el.checked;
                else if (el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
                else if (el.id === 'partnerMobile') valid = /^\d{10}$/.test(el.value.trim());
                else valid = el.value.trim() !== '';

                if (!valid) allValid = false;
            });

            if (selectedServices.length === 0) allValid = false;
            if (professionSelect.value === 'Other' && otherInput && otherInput.value.trim() === '') {
                allValid = false;
            }

            btnPartnerSubmit.disabled = !allValid;
            return allValid;
        }

        function updateBadges() {
            document.querySelectorAll('#partnerModalOverlay .rank-badge').forEach(b => {
                b.innerText = '';
                b.style.display = 'none';
            });

            selectedServices.forEach((serviceVal, index) => {
                const cb = Array.from(serviceCheckboxes).find(c => c.value === serviceVal);
                if (cb) {
                    const badge = cb.parentElement.querySelector('.rank-badge');
                    if (badge) {
                        badge.innerText = index + 1;
                        badge.style.display = 'flex';
                    }
                }
            });

            serviceCheckboxes.forEach(cb => {
                if (!cb.checked) {
                    if (selectedServices.length >= 3) {
                        cb.parentElement.style.opacity = '0.5';
                        cb.parentElement.style.cursor = 'not-allowed';
                        cb.disabled = true;
                    } else {
                        cb.parentElement.style.opacity = '1';
                        cb.parentElement.style.cursor = 'pointer';
                        cb.disabled = false;
                    }
                }
            });
        }

        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const val = this.value;
                if (this.checked) {
                    if (selectedServices.length < 3) {
                        selectedServices.push(val);
                        updateBadges();
                    } else {
                        this.checked = false;
                    }
                } else {
                    selectedServices = selectedServices.filter(item => item !== val);
                    updateBadges();
                }

                if (selectedServices.length > 0) {
                    if (serviceErrorMsg) serviceErrorMsg.style.display = 'none';
                    const container = document.getElementById('services-checkbox-container');
                    if (container) container.style.borderColor = '#ddd';
                }
                checkPartnerFormValidity();
            });
        });

        partnerRequiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('blur', () => {
                el.classList.add('visited');
                validatePartnerInput(id);
                checkPartnerFormValidity();
            });

            el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
                if (el.classList.contains('visited')) validatePartnerInput(id);
                checkPartnerFormValidity();
            });
        });

        if (otherInput) {
            otherInput.addEventListener('blur', () => {
                otherInput.classList.add('visited');
                validatePartnerInput('partnerOtherInput');
                checkPartnerFormValidity();
            });
            otherInput.addEventListener('input', () => {
                if (otherInput.classList.contains('visited')) validatePartnerInput('partnerOtherInput');
                checkPartnerFormValidity();
            });
        }

        btnPartnerSubmit.addEventListener('click', function (e) {
            e.preventDefault();
            if (checkPartnerFormValidity()) {
                const formData = {
                    name: document.getElementById('partnerName').value.trim(),
                    company: document.getElementById('partnerCompany').value.trim(),
                    email: document.getElementById('partnerEmail').value.trim(),
                    mobile: document.getElementById('partnerMobile').value.trim(),
                    social: document.getElementById('partnerSocial') ? document.getElementById('partnerSocial').value.trim() : '',
                    website: document.getElementById('partnerWebsite') ? document.getElementById('partnerWebsite').value.trim() : '',
                    profession: professionSelect.value === 'Other' && otherInput ? 'Other: ' + otherInput.value.trim() : professionSelect.value,
                    service1: selectedServices[0] || '',
                    service2: selectedServices[1] || '',
                    service3: selectedServices[2] || '',
                    description: document.getElementById('partnerIntro').value.trim(),
                    formType: 'Partner Application'
                };

                const originalBtnText = btnPartnerSubmit.textContent;
                btnPartnerSubmit.textContent = "Sending...";
                btnPartnerSubmit.disabled = true;

                fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(formData)
                })
                .then(() => {
                    const nameDisplay = document.getElementById('partner-name-display');
                    if (nameDisplay) nameDisplay.textContent = formData.name;
                    const partnerFormContent = document.getElementById('partnerFormContent');
                    if (partnerFormContent) partnerFormContent.style.display = 'none';
                    const partnerSuccessScreen = document.getElementById('partnerSuccessScreen');
                    if (partnerSuccessScreen) partnerSuccessScreen.style.display = 'flex';
                })
                .catch(error => {
                    console.error("Submission Error:", error);
                    btnPartnerSubmit.textContent = "Error! Try Again";
                    setTimeout(() => {
                        btnPartnerSubmit.textContent = originalBtnText;
                        btnPartnerSubmit.disabled = false;
                    }, 3000);
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinNomyModals);
} else {
    initFinNomyModals();
}

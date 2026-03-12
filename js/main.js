document.addEventListener('DOMContentLoaded', () => {

    // --- Global Number Input Formatter (Indian Commas) ---
    const numberInputs = document.querySelectorAll('.sip-number-input, input[type="number"]');
    const origDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    numberInputs.forEach(input => {
        // Change type to text to support comma rendering, but keep numeric keyboard
        input.type = 'text';
        input.inputMode = 'numeric';

        // Format while typing
        input.addEventListener('input', function (e) {
            let caretPos = this.selectionStart;
            let valLength = this.value.length;

            let raw = this.value.replace(/[^0-9.]/g, '');
            if (raw !== '') {
                let parts = raw.split('.');
                let intPart = parseInt(parts[0], 10);
                let formatted = isNaN(intPart) ? '' : intPart.toLocaleString('en-IN');
                if (parts.length > 1) formatted += '.' + parts[1];
                this.value = formatted;
            } else {
                this.value = '';
            }

            // Adjust caret (best effort for right-aligned inputs)
            let newLength = this.value.length;
            let newCaret = caretPos + (newLength - valLength);
            if (newCaret >= 0) this.setSelectionRange(newCaret, newCaret);
        });

        // Intercept JS getters/setters so mathematical calculations don't break
        Object.defineProperty(input, 'value', {
            get: function () {
                let currentStr = origDescriptor.get.call(this);
                return currentStr.replace(/,/g, ''); // Return raw number string
            },
            set: function (val) {
                let raw = String(val).replace(/,/g, '');
                let parsed = parseFloat(raw);
                if (!isNaN(parsed)) {
                    // Format as Indian Rupee style string
                    let formatted = parsed.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    origDescriptor.set.call(this, formatted);
                } else {
                    origDescriptor.set.call(this, val);
                }
            }
        });

        // Trigger initial formatting
        let initialVal = parseFloat(origDescriptor.get.call(input).replace(/,/g, ''));
        if (!isNaN(initialVal)) {
            input.value = initialVal; // Uses our new setter
        }
    });
    // -----------------------------------------------------

    // Mobile Menu Logic
    const hamburger = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = navLinks.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);

            if (!isClickInsideMenu && !isClickOnHamburger && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    }

    // 1. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.text-content, .visual-content');
    animateElements.forEach(el => observer.observe(el));


    // 2. Back to Top Button Logic
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        // Back to Top Button Logic
        if (backToTopBtn) {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }

        // Navbar Scroll Effect
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // 3. Navbar Active State on Scroll (Optional but nice)
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');



    // Guard Scroll Observer: Only run if sections exist (Mainly Homepage) and IT IS THE HOME PAGE
    // Logic: We want section-wise highlight on Home, but static Page-wise highlight on others.
    const isCurrentPageHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';

    if (sections.length > 0 && isCurrentPageHome) {

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    // Special case: Don't remove active if we are just scrolling near top (keep Home active)
                    // But typically Scroll Spy dominates.

                    navItems.forEach(link => {
                        // Check if this link points to the section
                        if (link.getAttribute('href') === `#${id}`) {
                            // Remove active from all others ONLY if we found a new active match
                            navItems.forEach(l => l.classList.remove('active'));
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.5 }); // 50% section visibility

        sections.forEach(section => navObserver.observe(section));
    }

    // 4. Toast Notification Logic
    // 4. Toast Notification Logic
    const Toast = {
        element: null,
        overlay: null,
        timeout: null,

        init() {
            // Create Overlay
            if (!document.querySelector('.toast-backdrop')) {
                this.overlay = document.createElement('div');
                this.overlay.className = 'toast-backdrop';
                document.body.appendChild(this.overlay);
            } else {
                this.overlay = document.querySelector('.toast-backdrop');
            }

            // Create Toast Container
            if (!document.querySelector('.toast-container')) {
                this.element = document.createElement('div');
                this.element.className = 'toast-container';
                document.body.appendChild(this.element);
            } else {
                this.element = document.querySelector('.toast-container');
            }

            // Allow closing by clicking overlay
            this.overlay.addEventListener('click', () => {
                this.hide();
            });
        },

        show(message) {
            if (!this.element || !this.overlay) this.init();

            this.element.textContent = message;

            // Show both
            this.overlay.classList.add('show');
            this.element.classList.add('show');

            if (this.timeout) clearTimeout(this.timeout);

            this.timeout = setTimeout(() => {
                this.hide();
            }, 3000);
        },

        hide() {
            if (this.element) this.element.classList.remove('show');
            if (this.overlay) this.overlay.classList.remove('show');
        }
    };

    // Attach listeners to "Coming Soon" buttons
    // Attach listeners to "Coming Soon" buttons
    const comingSoonBtns = document.querySelectorAll('.coming-soon-cta');
    comingSoonBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.closest('section');
            let msg = "Growth requires patience – we're working behind the scenes."; // Default fallback

            // Determine message based on section context
            if (section) {
                const id = section.id;
                if (id === 'cards') {
                    msg = "Our advanced Card Selection tools are coming soon to help you pick the best rewards.";
                } else if (id === 'services') {
                    msg = "We're carefully shaping our services to bring you financial clarity.";
                } else if (id === 'calculators') {
                    msg = "Smart calculations take careful design. Coming soon.";
                } else if (id === 'insights') {
                    msg = "Clarity begins with understanding. Insights are on the way.";
                }
            }
            Toast.show(msg);
        });
    });

    // 5. Dynamic Navigation Logic
    // 5. Dynamic Navigation & "Coming Soon" Logic
    const manageNavigation = () => {
        const path = window.location.pathname;
        const pageName = path.split("/").pop();
        const isHomePage = pageName === "" || pageName === "index.html" || pageName === "/";

        // Selectors for all nav/footer links
        const links = {
            home: document.querySelectorAll('.nav-link-home, .footer-link-home'),
            about: document.querySelectorAll('.nav-link-about, .footer-link-about'),
            services: document.querySelectorAll('.nav-link-services, .footer-link-services'),
            calculators: document.querySelectorAll('.nav-link-calculators, .footer-link-calculators'),
            insights: document.querySelectorAll('.nav-link-insights, .footer-link-insights'),
            connect: document.querySelectorAll('.nav-link-connect')
        };

        // Helper: Attach Toast to links
        const attachToast = (nodeList, message) => {
            nodeList.forEach(link => {
                link.setAttribute('href', 'javascript:void(0)');
                // Remove old listeners to prevent duplicates (cloning is a cheat way, but manual management is better)
                // Here we just add, assuming idempotency isn't strict or this runs once.
                link.onclick = (e) => {
                    e.preventDefault();
                    Toast.show(message);
                };
            });
        };

        if (isHomePage) {
            // HOME PAGE BEHAVIOR
            // 1. Scroll-to-section for Home/About/Services/Calc/Insights
            links.home.forEach(l => {
                l.setAttribute('href', '#home');
                if (!window.location.hash || window.location.hash === '#home') l.classList.add('active');
            });
            links.about.forEach(l => l.setAttribute('href', '#about'));
            links.services.forEach(l => l.setAttribute('href', '#services'));
            links.calculators.forEach(l => l.setAttribute('href', '#calculators'));
            links.insights.forEach(l => l.setAttribute('href', '#insights'));

            // Connect Us stays as link to connect_us.html
            links.connect.forEach(l => l.classList.remove('active'));

        } else {
            // INNER PAGE BEHAVIOR (e.g. About, Connect Us)

            // 1. Home -> Link to index.html
            links.home.forEach(l => {
                l.setAttribute('href', 'index.html');
                l.classList.remove('active');
            });

            // 2. About -> Link to about.html (or stay active if on about)
            links.about.forEach(l => {
                l.setAttribute('href', 'about.html');
                if (pageName === 'about.html') l.classList.add('active');
                else l.classList.remove('active');
            });

            // 3. Connect Us -> Active if on connect_us.html
            links.connect.forEach(l => {
                if (pageName === 'connect_us.html') l.classList.add('active');
                else l.classList.remove('active');
            });

            // 4. Services, Insights -> Trigger Toast with Specific Messages
            // Calculators -> Link to the live calculators page
            links.calculators.forEach(l => l.setAttribute('href', 'calculators.html'));
            attachToast(links.services, "We're carefully shaping our services to bring you financial clarity.");
            attachToast(links.insights, "Clarity begins with understanding. Insights are on the way.");
        }
    };

    // Run Navigation Logic
    manageNavigation();

});


// --- GLOBAL MODAL FUNCTIONS (Must be accessible via HTML onclick) ---

// Helper Short Format (Global)
const shortFmt = (n) => {
    if (n >= 10000000) return '\u20B9' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return '\u20B9' + (n / 100000).toFixed(1) + 'L';
    return '\u20B9' + (n / 1000).toFixed(0) + 'k';
};

window.openConnectModal = function (preselectedService = null) {
    const modal = document.getElementById('connectModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        // Reset to form view if opened again
        const headerWrapper = document.querySelector('#connectModalOverlay .modal-header-wrapper') || document.querySelector('.modal-header-wrapper');
        const scrollContent = document.querySelector('#connectModalOverlay .modal-scroll-content') || document.querySelector('.modal-scroll-content');

        if (headerWrapper) headerWrapper.style.display = 'block';
        if (scrollContent) scrollContent.style.display = 'block';
        if (document.getElementById('successScreen')) document.getElementById('successScreen').style.display = 'none';

        // Pre-select service if passed
        if (preselectedService) {
            const serviceSelect = document.getElementById('inputService');
            if (serviceSelect) {
                // Check if option exists before setting
                Array.from(serviceSelect.options).forEach(opt => {
                    if (opt.value === preselectedService || opt.text === preselectedService) {
                        serviceSelect.value = opt.value;
                        // Trigger change/input so validation logic runs manually just in case
                        serviceSelect.classList.add('visited');
                        serviceSelect.dispatchEvent(new Event('change'));
                    }
                });
            }
        }
    }
}

window.closeConnectModal = function () {
    const modal = document.getElementById('connectModalOverlay');
    if (modal) modal.style.display = 'none';
}

window.openPartnerModal = function () {
    const modal = document.getElementById('partnerModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        // Reset to form view
        const headerWrapper = document.querySelector('#partnerModalOverlay .modal-header-wrapper');
        if (headerWrapper) headerWrapper.style.display = 'block';
        if (document.getElementById('partnerFormContent')) document.getElementById('partnerFormContent').style.display = 'block';
        if (document.getElementById('partnerSuccessScreen')) document.getElementById('partnerSuccessScreen').style.display = 'none';
    }
}

window.closePartnerModal = function () {
    const modal = document.getElementById('partnerModalOverlay');
    if (modal) modal.style.display = 'none';
}

// Global Click for Closing Modals
window.onclick = function (event) {
    const connectModal = document.getElementById('connectModalOverlay');
    const partnerModal = document.getElementById('partnerModalOverlay');
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');

    if (event.target == connectModal) window.closeConnectModal();
    if (event.target == partnerModal) window.closePartnerModal();
    if (event.target == privacyModal) window.closePrivacyModal();
    if (event.target == termsModal) window.closeTermsModal();
}


// --- DOM DEPENDENT MODAL LOGIC (Validation, Submissions) ---
document.addEventListener('DOMContentLoaded', function () {

    // Safety Check: Only run if these forms exist on the current page
    const inputName = document.getElementById('inputName');
    if (!inputName) return; // Exit if not on a page with the forms

    // --- CLIENT CONNECT FORM LOGIC ---
    const requiredIds = ['inputName', 'inputEmail', 'inputMobile', 'inputService', 'inputDescription', 'inputConsent'];
    const btnSubmit = document.getElementById('btnSubmit');

    function validateInput(id) {
        const el = document.getElementById(id);
        const errorMsg = el.nextElementSibling || el.parentElement.nextElementSibling;
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

        // Show/Hide Error
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

    function checkFormValidity() {
        let allValid = true;
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            let valid = false;
            if (el.type === 'checkbox') valid = el.checked;
            else if (el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
            else if (el.id === 'inputMobile') valid = /^\d{10}$/.test(el.value.trim());
            else valid = el.value.trim() !== '';

            if (!valid) allValid = false;
        });

        if (btnSubmit) btnSubmit.disabled = !allValid;
        return allValid;
    }

    requiredIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('blur', () => {
            el.classList.add('visited');
            validateInput(id);
            checkFormValidity();
        });

        el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
            if (el.classList.contains('visited')) validateInput(id);
            checkFormValidity();
        });
    });

    // Client Submit
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function () {
            if (checkFormValidity()) {
                const formData = {
                    name: document.getElementById('inputName').value,
                    company: document.getElementById('inputCompany').value,
                    email: document.getElementById('inputEmail').value,
                    mobile: document.getElementById('inputMobile').value,
                    social: document.querySelector('input[placeholder*="LinkedIn"]')?.value || '',
                    website: document.querySelector('input[placeholder*="https"]').value || '',
                    service: document.getElementById('inputService').value,
                    description: document.getElementById('inputDescription').value
                };

                // Apps Script URL
                const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztbbWZMcmYxBelEOnD2mPmE7zC8ZcN-vqas2B9-HLUG1Btp7k-yn-EFBZ8fJu0DYXV/exec';

                const originalBtnText = btnSubmit.textContent;
                btnSubmit.textContent = "Sending...";
                btnSubmit.disabled = true;

                fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(formData)
                })
                    .then(response => {
                        document.getElementById('user-name-display').textContent = formData.name;
                        // Try to hide scroll content in both potential locations (about vs connect)
                        const scrollContent = document.querySelector('#connectModalOverlay .modal-scroll-content') || document.querySelector('.modal-scroll-content');
                        if (scrollContent) scrollContent.style.display = 'none';
                        if (document.getElementById('successScreen')) document.getElementById('successScreen').style.display = 'flex';
                    })
                    .catch(error => {
                        console.error('Error!', error.message);
                        console.error("Submission Error:", error);
                        if (btn) {
                            btn.textContent = "Error! Try Again";
                            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
                        }
                        btnSubmit.textContent = originalBtnText;
                        btnSubmit.disabled = false;
                    });
            }
        });
    }


    // --- PARTNER FORM LOGIC ---
    const partnerRequiredIds = ['partnerName', 'partnerCompany', 'partnerEmail', 'partnerMobile', 'partnerProfession', 'partnerIntro', 'partnerConsent'];
    const btnPartnerSubmit = document.getElementById('btnPartnerSubmit');
    const professionSelect = document.getElementById('partnerProfession');
    const otherInput = document.getElementById('partnerOtherInput');

    if (!professionSelect) return;

    // Toggle "Others" Input
    professionSelect.addEventListener('change', function () {
        if (this.value === 'Other') {
            otherInput.disabled = false;
            otherInput.focus();
        } else {
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
        const errorMsg = el.nextElementSibling || el.parentElement.nextElementSibling;
        let isValid = false;

        if (el.type === 'checkbox') {
            isValid = el.checked;
        } else if (el.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(el.value.trim());
        } else if (el.id === 'partnerMobile') {
            isValid = /^\d{10}$/.test(el.value.trim());
        } else if (el.tagName === 'SELECT' && el.multiple) {
            isValid = el.selectedOptions.length > 0;
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
            let valid = false;
            if (el.type === 'checkbox') valid = el.checked;
            else if (el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
            else if (el.id === 'partnerMobile') valid = /^\d{10}$/.test(el.value.trim());
            else valid = el.value.trim() !== '';

            if (!valid) allValid = false;
        });

        if (selectedServices.length === 0) allValid = false;
        if (professionSelect.value === 'Other') {
            if (otherInput.value.trim() === '') allValid = false;
        }

        if (btnPartnerSubmit) btnPartnerSubmit.disabled = !allValid;
        return allValid;
    }

    // --- Ranked Checkbox Logic ---
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox-item input[type="checkbox"]');
    const serviceErrorMsg = document.getElementById('serviceErrorMsg');
    let selectedServices = [];

    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const val = this.value;
            const badge = this.parentElement.querySelector('.rank-badge');

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
                if (document.getElementById('services-checkbox-container')) document.getElementById('services-checkbox-container').style.borderColor = '#ddd';
            }
            checkPartnerFormValidity();
        });
    });

    function updateBadges() {
        document.querySelectorAll('.rank-badge').forEach(b => {
            b.innerText = '';
            b.style.display = 'none';
        });

        selectedServices.forEach((serviceVal, index) => {
            const cb = Array.from(serviceCheckboxes).find(c => c.value === serviceVal);
            if (cb) {
                const badge = cb.parentElement.querySelector('.rank-badge');
                badge.innerText = index + 1;
                badge.style.display = 'flex';
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

    // Validations Listeners
    partnerRequiredIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('blur', () => { el.classList.add('visited'); validatePartnerInput(id); checkPartnerFormValidity(); });
        el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
            if (el.classList.contains('visited')) validatePartnerInput(id);
            checkPartnerFormValidity();
        });
    });

    if (otherInput) {
        otherInput.addEventListener('blur', () => { otherInput.classList.add('visited'); validatePartnerInput('partnerOtherInput'); checkPartnerFormValidity(); });
        otherInput.addEventListener('input', () => { if (otherInput.classList.contains('visited')) validatePartnerInput('partnerOtherInput'); checkPartnerFormValidity(); });
    }

    // Partner Submit Logic
    if (btnPartnerSubmit) {
        btnPartnerSubmit.addEventListener('click', function () {
            if (checkPartnerFormValidity()) {
                const formData = {
                    name: document.getElementById('partnerName').value,
                    company: document.getElementById('partnerCompany').value,
                    email: document.getElementById('partnerEmail').value,
                    mobile: document.getElementById('partnerMobile').value,
                    social: document.getElementById('partnerSocial').value,
                    website: document.getElementById('partnerWebsite').value,
                    profession: professionSelect.value === 'Other' ? 'Other: ' + otherInput.value : professionSelect.value,
                    service1: selectedServices[0] || '',
                    service2: selectedServices[1] || '',
                    service3: selectedServices[2] || '',
                    description: document.getElementById('partnerIntro').value,
                    formType: 'Partner'
                };

                const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztbbWZMcmYxBelEOnD2mPmE7zC8ZcN-vqas2B9-HLUG1Btp7k-yn-EFBZ8fJu0DYXV/exec';

                const originalBtnText = btnPartnerSubmit.textContent;
                btnPartnerSubmit.textContent = "Sending...";
                btnPartnerSubmit.disabled = true;

                fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(formData)
                })
                    .then(response => {
                        document.getElementById('partner-name-display').textContent = formData.name;
                        if (document.getElementById('partnerFormContent')) document.getElementById('partnerFormContent').style.display = 'none';
                        if (document.getElementById('partnerSuccessScreen')) document.getElementById('partnerSuccessScreen').style.display = 'flex';
                    })
                    .catch(error => {
                        console.error('Error!', error.message);
                        console.error("Submission Error:", error);
                        if (btn) {
                            btn.textContent = "Error! Try Again";
                            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
                        }
                        btnPartnerSubmit.textContent = originalBtnText;
                        btnPartnerSubmit.disabled = false;
                    });
            }
        });
    }

    // 4. Navbar Fade on Footer Intersection
    // ----------------------------------------
    const mainNavbar = document.querySelector('.navbar'); // Assuming .navbar is your main nav class
    const mainFooter = document.querySelector('footer');

    if (mainNavbar && mainFooter) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    mainNavbar.classList.add('navbar-fade-out');
                } else {
                    mainNavbar.classList.remove('navbar-fade-out');
                }
            });
        }, {
            threshold: 0.25 // Trigger when 25% of footer is visible
        });

        footerObserver.observe(mainFooter);
    }

});

// --- SIP CALCULATOR LOGIC (Global Functions) ---
// --- SIP CALCULATOR LOGIC (Global Functions) ---
let sipInvestment = 5000;
let sipRate = 12;
let sipYears = 10;
let sipStepUp = 10;
let sipInflation = 6;
let isSipStepUp = false;
let isSipInflation = false;

// Goal vs Reality Variables
let isSipGoalReality = false;
let sipCurrentPortfolio = 500000;
let sipExistingSip = 5000;

// 1. Random SIP Facts
const sipFacts = [
    "A small start is better than no start. SIPs help you begin with as low as \u20B9500.",
    "Did you know? Compounding over 30 years can grow even small amounts into massive wealth.",
    "Discipline > Luck. Regular SIPs beat trying to 'time the market' every single time.",
    "Inflation eats your savings. Investing in Equity through SIPs helps you beat it.",
    "Consistency is Key. Even during market drops, your SIP buys more units (Rupee Cost Averaging).",
    "Rupee Cost Averaging: You buy more units when prices are low and fewer when high.",
    "Power of Delay: Waiting just 5 years to start an SIP can halve your final corpus!",
    "Flexibility: You can pause, stop, or increase your SIP anytime without penalties.",
    "Goal-Based Investing: Tag your SIPs to specific goals like a Car, House, or Retirement.",
    "15x15x15 Rule: \u20B915k/mo for 15 years at 15% can make you a Crorepati.",
    "Diversification: SIPs in Mutual Funds give you exposure to top Indian companies.",
    "Investing \u20B95,000/mo for 20 years @ 12% grows to ~\u20B950 Lakhs.",
    "Magic of Compounding: Your interest earns interest. Start as early as possible!",
    "Tax Efficiency: ELSS Mutual Funds (SIPs) can help you save tax under Section 80C.",
    "Emotional Control: Automated SIPs keep you from making panic decisions during volatility.",
    "SIPs are flexible—you can increase or decrease the amount as needed.",
    "The magic of compounding starts showing visible results after 8-10 years.",
    "Starting 5 years early can double your retirement corpus.",
    "Don't interrupt the compounding process unnecessarily.",
    "Market volatility is a friend of SIP investors, not an enemy.",
    "Equity has historically beaten inflation and gold over long periods.",
    "SIP allows you to align investments with specific financial goals.",
    "Automated deductions ensure you don't skip investing.",
    "Diversification reduces risk. Mutual funds offer instant diversification.",
    "It's never too late to start, but starting early is a huge advantage.",
    "Saving is what is left after spending? No. Spend what is left after investing!",
    "Financial freedom is not about earning more, it's about investing right.",
    "Your money should work harder than you do.",
    "Inflation eats your savings; Investing beats inflation.",
    "SIPs are great for goal-based planning like education or retirement.",
    "Top-up your SIPs with any lump sum bonus you receive.",
    "Review your portfolio once a year, not every day.",
    "Patience is the key to successful SIP investing.",
    "Don't stop SIPs when the market crashes; that's the best time to buy!",
    "Mutual Funds Sahi Hai.",
    "Small drops of water make a mighty ocean.",
    "An investment in knowledge pays the best interest. - Benjamin Franklin",
    "Risk comes from not knowing what you are doing. - Warren Buffett"
];

function displayRandomFact() {
    const factEl = document.getElementById('sipFactText');
    if (factEl) {
        const randomFact = sipFacts[Math.floor(Math.random() * sipFacts.length)];
        factEl.innerText = randomFact;
    }
}

window.openSipCalculator = function () {
    const modal = document.getElementById('sipModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        displayRandomFact(); // New: Show Random Fact
        calculateSIP();
    }
}

window.closeSipModal = function () {
    const modal = document.getElementById('sipModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.calculateSIP = function () {
    // 1. Goal vs Reality Branch
    if (typeof isSipGoalReality !== 'undefined' && isSipGoalReality) {
        calculateSipGapAnalysis();
        return;
    }

    // 2. Dispatcher for Super Advance Mode
    if (typeof isSipSuperAdvance !== 'undefined' && isSipSuperAdvance) {
        calculateSipReverse();
        return;
    }

    // Inputs (Updated IDs for Number Inputs)
    const inputInvestment = document.getElementById('inputInvestment');
    if (!inputInvestment) return; // Exit if not on calc page

    const inputRate = document.getElementById('inputRate');
    const inputYears = document.getElementById('inputYears');
    const inputStepUp = document.getElementById('inputStepUp');

    // Results DOM
    const resNormal = document.getElementById('resNormalState');
    const resEgg = document.getElementById('resEasterEgg');
    const donut = document.getElementById('sipDonut');

    // Update Display Texts
    // Update Display Texts / Inputs
    // We only update the inputs if they are NOT the active element to prevent typing interference
    // But typically Scroll Spy dominates.

    // NOTE: In this new "Type & Slide" model, we do NOT blindly overwrite inputs in calculateSIP
    // because it might interrupt typing.
    // Instead, the listener calling this function has already updated the global variables.
    // So we just use global vars to compute.
    // OPTIONAL: Update the *other* paired element if needed?
    // Better strategy: The Listener does the Sync, then calls calculateSIP to render results.

    // Layout and Label management
    const chartContainer = document.querySelector('.chart-container');
    const rowInflation = document.getElementById('rowInflation');
    const rowMonthlySip = document.getElementById('rowMonthlySip');
    const lblInv = document.getElementById('lblInv');
    const lblGain = document.getElementById('lblGain');
    const lblTotal = document.getElementById('lblTotal');
    const resTotalValueBottom = document.getElementById('resTotalValueBottom');
    const resInflationVal = document.getElementById('resInflationVal');
    const donutLabel = document.querySelector('#sipDonut .donut-label');

    if (chartContainer) {
        if (isSipStepUp || isSipInflation) {
            chartContainer.classList.add('side-by-side');
        } else {
            chartContainer.classList.remove('side-by-side');
        }
    }

    if (rowInflation) rowInflation.style.display = 'none';
    if (rowMonthlySip) rowMonthlySip.style.display = 'none';

    if (lblInv) lblInv.innerHTML = '<span class="dot grey"></span> Invested Amount';
    if (lblGain) lblGain.innerHTML = '<span class="dot green"></span> Est. Returns';
    if (lblTotal) lblTotal.innerText = "Total Value";
    // donutLabel.innerText is now handled dynamically near the result update for better sync

    if (donut) {
        donut.style.display = 'flex';
    }

    const resRealityStats = document.getElementById('resRealityCheckStats');
    const resStats = document.querySelector('.res-stats');
    if (resRealityStats) resRealityStats.style.display = 'none';
    if (resStats) resStats.style.display = 'block';

    // Easter Egg Logic (Updated Limit > 1 Lakh)
    // Calculation Logic
    let monthlyRate = sipRate / 12 / 100;
    let months = sipYears * 12;

    // --- 1. Standard SIP Calculation (Nominal) ---
    let stdTotalInvested = sipInvestment * months;
    let stdCurrentVal = sipInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    // --- 2. Step Up SIP Calculation (Nominal) ---
    let stepTotalInvested = 0;
    let stepCurrentVal = 0;

    if (isSipStepUp) {
        let currentInvestment = sipInvestment;
        for (let y = 1; y <= sipYears; y++) {
            for (let m = 1; m <= 12; m++) {
                stepTotalInvested += currentInvestment;
                stepCurrentVal = (stepCurrentVal + currentInvestment) * (1 + monthlyRate);
            }
            currentInvestment = currentInvestment * (1 + sipStepUp / 100);
        }
    } else {
        stepTotalInvested = stdTotalInvested;
        stepCurrentVal = stdCurrentVal;
    }

    // --- 3. Inflation Adjustment (Discounting Method) ---
    // Formula: Real Value = Nominal Value / (1 + Inflation)^Years
    const inflationFactor = Math.pow(1 + sipInflation / 100, sipYears);
    let stdRealVal = stdCurrentVal / inflationFactor;
    let stepRealVal = stepCurrentVal / inflationFactor;

    // 4. Determine Active Values (Primary Display) ---
    let finalInvested = isSipStepUp ? stepTotalInvested : stdTotalInvested;
    let finalCurrentVal = isSipStepUp ? stepCurrentVal : stdCurrentVal;
    let finalRealVal = isSipStepUp ? stepRealVal : stdRealVal;
    let finalWealthGained = finalCurrentVal - finalInvested;
    let inflationAdj = finalCurrentVal - finalRealVal;

    // Rounding
    finalInvested = Math.round(finalInvested);
    finalCurrentVal = Math.round(finalCurrentVal);
    finalRealVal = Math.round(finalRealVal);
    stdCurrentVal = Math.round(stdCurrentVal);
    stepCurrentVal = Math.round(stepCurrentVal);
    stdRealVal = Math.round(stdRealVal);
    stepRealVal = Math.round(stepRealVal);

    // Helper formatter
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    const shortFmt = (n) => {
        if (n >= 10000000) return '\u20B9' + (n / 10000000).toFixed(1) + 'Cr';
        if (n >= 100000) return '\u20B9' + (n / 100000).toFixed(1) + 'L';
        return '\u20B9' + (n / 1000).toFixed(0) + 'k';
    };

    // 4. High Value Logic (> 1 Lakh)
    const hvForm = document.getElementById('sipHighValueForm');
    const leadForm = document.getElementById('leadCapture-SIP');

    if (sipInvestment > 100000) {
        if (resNormal) resNormal.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        if (leadForm) leadForm.style.display = 'none';
        return;
    } else {
        if (resNormal) resNormal.style.display = 'block'; // Use block for vertical stacking
        if (hvForm) hvForm.style.display = 'none';
        if (leadForm) leadForm.style.display = 'block';
    }

    // Update Results
    if (document.getElementById('resInvested')) document.getElementById('resInvested').innerText = fmt(finalInvested);
    if (document.getElementById('resGained')) document.getElementById('resGained').innerText = fmt(finalWealthGained);

    // Total Value (Center of Donut)
    if (document.getElementById('resTotalValue')) {
        document.getElementById('resTotalValue').innerText = isSipInflation ? fmt(finalRealVal) : fmt(finalCurrentVal);
    }
    if (donutLabel) {
        donutLabel.innerText = isSipInflation ? "Total Real Value" : "Expected Total Value";
    }

    // Dynamic Total Row (Bottom)
    if (isSipInflation) {
        if (rowInflation) rowInflation.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationAdj);
        if (lblTotal) lblTotal.innerText = "Total Real Value";
        if (resTotalValueBottom) resTotalValueBottom.innerText = fmt(finalRealVal);
    } else {
        if (rowInflation) rowInflation.style.display = 'none';
        if (lblTotal) lblTotal.innerText = "Expected Total Value";
        if (resTotalValueBottom) resTotalValueBottom.innerText = fmt(finalCurrentVal);
    }
    if (donut) {
        if (isSipInflation && finalCurrentVal > 0) {
            let degPrincipal = (finalInvested / finalCurrentVal) * 360;
            let degReal = (finalRealVal / finalCurrentVal) * 360;

            if (isNaN(degPrincipal)) degPrincipal = 0;
            if (isNaN(degReal)) degReal = degPrincipal;

            // Grey (Principal) -> Green (Real Gains) -> Orange (Inflation)
            donut.style.background = `conic-gradient(#E5E7EB 0deg ${degPrincipal}deg, #00B37E ${degPrincipal}deg ${degReal}deg, #F59E0B ${degReal}deg 360deg)`;
        } else {
            let investedPct = finalCurrentVal > 0 ? (finalInvested / finalCurrentVal) * 100 : 0;
            let deg = (investedPct / 100) * 360;
            if (isNaN(deg)) deg = 0;
            // Standard: Grey for Invested (#E5E7EB), Green for Gains (#00B37E)
            donut.style.background = `conic-gradient(#E5E7EB 0deg ${deg}deg, #00B37E ${deg}deg 360deg)`;
        }
    }

    // Growth Comparison Bar Chart Logic
    const comparisonChart = document.getElementById('sipComparisonChart');
    if (comparisonChart) {
        // DOM Elements
        const barStd = document.getElementById('barStandard'); const valStd = document.getElementById('barValStandard');
        const colStd = barStd ? barStd.parentElement : null;

        const barStep = document.getElementById('barStepUp'); const valStep = document.getElementById('barValStepUp');
        const colStep = barStep ? barStep.parentElement : null;

        const colStdReal = document.getElementById('colStdReal');
        const colStepReal = document.getElementById('colStepReal');
        const barStdReal = document.getElementById('barStdReal');
        const barStepReal = document.getElementById('barStepReal');
        const valStdReal = document.getElementById('barValStdReal');
        const valStepReal = document.getElementById('barValStepReal');

        // Logic Switch

        let showChart = false;

        // Scenario A: Step Up ONLY
        if (isSipStepUp && !isSipInflation) {
            showChart = true;
            colStd.style.display = 'flex';
            colStep.style.display = 'flex';
            if (barStdReal) colStdReal.style.display = 'none';
            if (barStepReal) colStepReal.style.display = 'none';

            // Labels
            if (colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Standard";
            if (colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Step-up";

            // Values
            let max = stepCurrentVal;
            if (max === 0) max = 1;

            if (document.getElementById('barStandard')) document.getElementById('barStandard').style.height = ((stdCurrentVal / max) * 100) + '%';
            if (document.getElementById('barStepUp')) document.getElementById('barStepUp').style.height = '100%';

            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stepCurrentVal);
        }

        // Scenario B: Inflation ONLY
        else if (!isSipStepUp && isSipInflation) {
            showChart = true;
            colStd.style.display = 'flex';
            colStep.style.display = 'flex';
            if (barStdReal) colStdReal.style.display = 'none';
            if (barStepReal) colStepReal.style.display = 'none';

            // Labels
            if (colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Nominal";
            if (colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Real Value";

            // Values
            let max = stdCurrentVal;
            if (max === 0) max = 1;

            if (document.getElementById('barStandard')) document.getElementById('barStandard').style.height = '100%';
            if (document.getElementById('barStepUp')) document.getElementById('barStepUp').style.height = ((stdRealVal / max) * 100) + '%';

            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stdRealVal);
        }

        // Scenario C: BOTH
        else if (isSipStepUp && isSipInflation) {
            showChart = true;
            colStd.style.display = 'flex';
            colStep.style.display = 'flex';
            if (barStdReal) colStdReal.style.display = 'flex';
            if (barStepReal) colStepReal.style.display = 'flex';

            // Labels
            if (colStd.querySelector('.bar-label')) colStd.querySelector('.bar-label').innerText = "Std (N)";
            if (colStep.querySelector('.bar-label')) colStep.querySelector('.bar-label').innerText = "Step (N)";

            // Values
            let max = stepCurrentVal;
            if (max === 0) max = 1;

            if (document.getElementById('barStandard')) document.getElementById('barStandard').style.height = ((stdCurrentVal / max) * 100) + '%';
            if (document.getElementById('barStepUp')) document.getElementById('barStepUp').style.height = '100%';

            if (document.getElementById('barStdReal')) document.getElementById('barStdReal').style.height = ((stdRealVal / max) * 100) + '%';
            if (document.getElementById('barStepReal')) document.getElementById('barStepReal').style.height = ((stepRealVal / max) * 100) + '%';

            if (document.getElementById('barValStdReal')) document.getElementById('barValStdReal').innerText = shortFmt(stdRealVal);
            if (document.getElementById('barValStepReal')) document.getElementById('barValStepReal').innerText = shortFmt(stepRealVal);

            if (valStd) valStd.innerText = shortFmt(stdCurrentVal);
            if (valStep) valStep.innerText = shortFmt(stepCurrentVal);
        }

        else {
            showChart = false;
        }

        comparisonChart.style.display = showChart ? 'flex' : 'none';
        comparisonChart.style.gap = (isSipStepUp && isSipInflation) ? '5px' : '30px';
    }

}

// Global Click to Close SIP Modal
window.addEventListener('click', function (event) {
    const sipModal = document.getElementById('sipModalOverlay');
    if (event.target == sipModal) window.closeSipModal();
});

// --- Modal Functions (Global) ---


window.closeSipModal = function () {
    const modal = document.getElementById('sipModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore bg scroll
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

// Initialize Listeners
document.addEventListener('DOMContentLoaded', () => {
    const rangeInv = document.getElementById('rangeInvestment');
    const rangeRate = document.getElementById('rangeRate');
    const rangeYears = document.getElementById('rangeYears');
    const rangeStepUp = document.getElementById('rangeStepUp');
    const checkStepUp = document.getElementById('checkStepUp');
    const stepUpControl = document.getElementById('stepUpControl');

    // New Inflation Elements
    const rangeInflation = document.getElementById('rangeInflation');
    const inputInflation = document.getElementById('inputInflation');
    const checkInflation = document.getElementById('checkInflation');
    const inflationControl = document.getElementById('inflationControl');

    if (rangeInv) {
        // --- Synchronization Logic ---

        // Investment: Range <-> Input
        const inputInvestment = document.getElementById('inputInvestment');
        // Range Listener
        rangeInv.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sipInvestment = val;
            if (inputInvestment) inputInvestment.value = val; // Sync Text Input
            calculateSIP();
        });
        // Input Listener
        if (inputInvestment) {
            inputInvestment.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 0;
                sipInvestment = val;
                rangeInv.value = val; // Sync Slider
                // Limit Logic handling triggers automatically in calculateSIP based on sipInvestment value
                calculateSIP();
            });
        }

        // Rate: Range <-> Input
        const inputRate = document.getElementById('inputRate');
        rangeRate.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            sipRate = val;
            if (inputRate) inputRate.value = val;
            calculateSIP();
        });
        if (inputRate) {
            inputRate.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                if (isNaN(val)) val = 0;
                sipRate = val;
                rangeRate.value = val;
                calculateSIP();
            });
        }

        // Years: Range <-> Input
        const inputYears = document.getElementById('inputYears');
        rangeYears.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sipYears = val;
            if (inputYears) inputYears.value = val;
            calculateSIP();
        });
        if (inputYears) {
            inputYears.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 0;
                sipYears = val;
                rangeYears.value = val;
                calculateSIP();
            });
        }

        // Step Up: Range <-> Input
        const inputStepUp = document.getElementById('inputStepUp');
        rangeStepUp.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sipStepUp = val;
            if (inputStepUp) inputStepUp.value = val;
            calculateSIP();
        });
        if (inputStepUp) {
            inputStepUp.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = 0;
                sipStepUp = val;
                rangeStepUp.value = val;
                calculateSIP();
            });
        }

        // Advanced Toggle
        checkStepUp.addEventListener('change', (e) => {
            isSipStepUp = e.target.checked;
            if (stepUpControl) stepUpControl.style.display = isSipStepUp ? 'block' : 'none';
            calculateSIP();
        });

        // Inflation Logic
        if (checkInflation) {
            checkInflation.addEventListener('change', (e) => {
                isSipInflation = e.target.checked;
                if (inflationControl) inflationControl.style.display = e.target.checked ? 'block' : 'none';
                calculateSIP();
            });
        }

        if (rangeInflation) {
            rangeInflation.addEventListener('input', (e) => {
                sipInflation = parseFloat(e.target.value);
                if (inputInflation) inputInflation.value = sipInflation;
                calculateSIP();
            });
        }

        if (inputInflation) {
            inputInflation.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                if (val > 15) val = 15; if (val < 0) val = 0;
                sipInflation = val;
                if (rangeInflation) rangeInflation.value = val;
                calculateSIP();
            });
        }
    }

    // --- Standard High Value Form Factory ---
    window.setupHighValueForm = function (prefix, serviceValue) {
        const els = {
            name: document.getElementById(prefix + 'HvName'),
            company: document.getElementById(prefix + 'HvCompany'),
            email: document.getElementById(prefix + 'HvEmail'),
            mobile: document.getElementById(prefix + 'HvMobile'),
            social: document.getElementById(prefix + 'HvSocial'),
            website: document.getElementById(prefix + 'HvWebsite'),
            desc: document.getElementById(prefix + 'HvDesc'),
            privacy: document.getElementById(prefix + 'HvPrivacy'),
            service: document.getElementById(prefix + 'HvService'),
            btn: document.getElementById('btn' + prefix.charAt(0).toUpperCase() + prefix.slice(1) + 'HvSubmit'),
            success: document.getElementById(prefix + 'HvSuccess')
        };

        // Special case for SIP ID which is btnHvSubmit in HTML
        if (prefix === 'sip' && !els.btn) {
            els.btn = document.getElementById('btnHvSubmit');
        }

        if (!els.name || !els.btn) return;

        if (els.service) els.service.value = serviceValue;

        const validate = () => {
            const isNameValid = els.name.value.trim().length > 0;
            const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(els.email.value.trim());
            const isMobileValid = /^\d{10}$/.test(els.mobile.value.trim());
            const isDescValid = els.desc.value.trim().length > 0;
            const isPrivacyChecked = els.privacy.checked;

            const updateFieldStatus = (el, isValid) => {
                if (!el.classList.contains('visited')) return;
                const group = el.closest('.lc-form-group') || el.parentElement;
                const errorSpan = group.querySelector('.lc-error');
                if (!isValid) {
                    if (errorSpan) errorSpan.style.display = 'block';
                    el.style.borderColor = '#dc2626';
                } else {
                    if (errorSpan) errorSpan.style.display = 'none';
                    el.style.borderColor = '#e5e7eb';
                }
            };

            updateFieldStatus(els.name, isNameValid);
            updateFieldStatus(els.email, isEmailValid);
            updateFieldStatus(els.mobile, isMobileValid);
            updateFieldStatus(els.desc, isDescValid);

            if (els.privacy.classList.contains('visited')) {
                const label = els.privacy.nextElementSibling;
                if (label) label.style.color = isPrivacyChecked ? '#6b7280' : '#dc2626';
            }

            const allValid = isNameValid && isEmailValid && isMobileValid && isDescValid && isPrivacyChecked;
            els.btn.disabled = !allValid;
            els.btn.style.opacity = allValid ? '1' : '0.6';
            els.btn.style.cursor = allValid ? 'pointer' : 'not-allowed';
        };

        [els.name, els.email, els.mobile, els.desc, els.privacy].forEach(el => {
            el.addEventListener('blur', () => { el.classList.add('visited'); validate(); });
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', validate);
        });

        els.btn.onclick = () => {
            if (els.btn.disabled) return;
            const originalText = els.btn.textContent;
            els.btn.textContent = "Sending...";
            els.btn.disabled = true;

            const formData = {
                name: els.name.value,
                company: els.company ? els.company.value : '',
                email: els.email.value,
                mobile: els.mobile.value,
                social: els.social ? els.social.value : '',
                website: els.website ? els.website.value : '',
                description: els.desc.value,
                service: serviceValue,
                formType: 'HighValueConsultation'
            };

            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztbbWZMcmYxBelEOnD2mPmE7zC8ZcN-vqas2B9-HLUG1Btp7k-yn-EFBZ8fJu0DYXV/exec';

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(formData)
            })
                .then(() => {
                    if (els.success) {
                        els.success.style.display = 'flex';
                        setTimeout(() => { if (els.success) els.success.style.display = 'none'; }, 5000);
                    }
                    [els.name, els.email, els.mobile, els.desc].forEach(el => {
                        el.value = '';
                        el.classList.remove('visited');
                        el.style.borderColor = '#e5e7eb';
                    });
                    els.privacy.checked = false;
                    els.privacy.classList.remove('visited');
                    if (els.company) els.company.value = '';
                    if (els.social) els.social.value = '';
                    if (els.website) els.website.value = '';
                    validate();
                    els.btn.textContent = "Request Sent!";
                    setTimeout(() => { els.btn.textContent = originalText; }, 3000);
                })
                .catch(err => {
                    console.error(err);
                    els.btn.textContent = "Error!";
                    setTimeout(() => { els.btn.textContent = originalText; els.btn.disabled = false; }, 3000);
                });
        };
    };

    // Initialize High Value Forms
    setupHighValueForm('sip', 'Planning for Systematic Investment Plan');
    setupHighValueForm('swp', 'Planning for Systematic Withdrawal Plan');
    setupHighValueForm('fhs', 'Wealth Profiling Details');
    setupHighValueForm('cfm', 'Wealth Management Consultation');
    setupHighValueForm('mgse', 'Priority Strategy Consultation');
    setupHighValueForm('loan', 'High Value Debt Consultation');
    setupHighValueForm('ret', 'Retirement Consultation');
});

// ==========================================
// SWP Calculator Logic
// ==========================================

let swpInvestment = 2000000;
let swpWithdrawal = 15000;
let swpRate = 10;
let swpYears = 20;
let swpStepUp = 5;
let swpInflation = 6;
let isSwpStepUp = false;
let isSwpInflation = false;

// SWP Super Advance Mode (Dual Cashflow Goal Seek)
let isSwpSuperAdvance = false;
let swpAdvTime = 10;
let swpAdvGoal = 10000000;
let swpAdvWithdrawal = 1200000;
let swpAdvSavings = 0;
let swpAdvReturn = 12;
let swpAdvInflation = 6;
let swpAdvStepUpSip = 10;
let swpAdvStepUpSwp = 5;
let isSwpAdvInflation = false;
let isSwpAdvStepUpSip = false;
let isSwpAdvStepUpSwp = false;

// Loan Prepayment Variables
let loanBalance = 5000000;
let loanRate = 9;
let loanTenureMonths = 120;
let loanExtraEmi = 2000;
let loanExtraEmiFreq = 'monthly';
let loanPrepayBenefit = 'tenure';
let loanPrepayCharge = 0;

window.openLoanModal = function () {
    const modal = document.getElementById('loanModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        calculateLoanPrepayment();
        randomizeLoanFact();
    }
}

window.openSwpModal = function () {
    const modal = document.getElementById('swpModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        randomizeSwpFact();
        calculateSWP();
    }
}

window.closeSwpModal = function () {
    const modal = document.getElementById('swpModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.closeLoanModal = function () {
    const modal = document.getElementById('loanModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Global Click Listener for All Modals
window.addEventListener('click', function (event) {
    const modalMap = [
        { id: 'connectModalOverlay', close: window.closeConnectModal },
        { id: 'partnerModalOverlay', close: window.closePartnerModal },
        { id: 'sipModalOverlay', close: window.closeSipModal },
        { id: 'swpModalOverlay', close: window.closeSwpModal },
        { id: 'loanModalOverlay', close: window.closeLoanModal },
        { id: 'retirementModalOverlay', close: window.closeRetirementModal },
        { id: 'fhsModalOverlay', close: typeof closeFhsModal === 'function' ? closeFhsModal : null },
        { id: 'cfmModalOverlay', close: typeof closeCfmModal === 'function' ? closeCfmModal : null },
        { id: 'mgseModalOverlay', close: typeof closeMgseModal === 'function' ? closeMgseModal : null },
        { id: 'privacyModalOverlay', close: window.closePrivacyModal },
        { id: 'termsModalOverlay', close: window.closeTermsModal }
    ];

    modalMap.forEach(m => {
        const modalEl = document.getElementById(m.id);
        if (modalEl && event.target === modalEl) {
            if (m.close) {
                m.close();
            } else {
                modalEl.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });
});

function calculateSWP() {
    // Dispatcher for Super Advance Mode
    if (isSwpSuperAdvance) {
        calculateSwpSuperAdvance();
        return;
    }

    // 1. Get Elements
    const resTotalWithdrawal = document.getElementById('swpResTotalWithdrawal');
    const resReturnsEarned = document.getElementById('swpResReturnsEarned');
    const resFinalBalanceBottom = document.getElementById('swpResFinalBalanceBottom');
    const resFinalBalanceTop = document.getElementById('swpResFinalBalanceTop');
    const donut = document.getElementById('swpDonut');
    const chartContainer = document.getElementById('swpChartContainer');
    const statsContainer = document.getElementById('swpStatsContainer');

    const normalState = document.getElementById('swpNormalState');
    const hvForm = document.getElementById('swpHighValueForm');
    const depletionWarning = document.getElementById('swpDepletionWarning');
    const depletionText = document.getElementById('swpDepletionText');
    const leadForm = document.getElementById('leadCapture-SWP');

    // 2. High Value Logic (> 50L Investment OR > 1L Withdrawal)
    if (swpInvestment > 5000000 || swpWithdrawal > 100000) {
        if (normalState) normalState.style.display = 'none';
        if (hvForm) hvForm.style.display = 'block';
        if (leadForm) leadForm.style.display = 'none';
        return; // Stop calculation
    } else {
        if (normalState) normalState.style.display = 'block';
        if (hvForm) hvForm.style.display = 'none';
        if (leadForm) leadForm.style.display = 'block';

        // Hide Super Advance results if we came back from it
        const advanceState = document.getElementById('swpSuperAdvanceState');
        if (advanceState) advanceState.style.display = 'none';

        // Ensure fact card is back
        const factCard = document.getElementById('swpFactCard');
        if (factCard) factCard.style.display = 'block';
    }

    // 3. Calculation Engine
    let balance = swpInvestment;
    let totalWithdrawn = 0;
    let months = swpYears * 12;
    let monthlyRate = swpRate / 1200;
    let currentWithdrawal = swpWithdrawal;
    let isDepleted = false;
    let depletedMonth = 0;

    // Standard Calculation (with Loop for Depletion Check)
    for (let m = 1; m <= months; m++) {
        // Interest Accrual
        let interest = balance * monthlyRate;
        balance += interest;

        // Withdrawal
        if (balance >= currentWithdrawal) {
            balance -= currentWithdrawal;
            totalWithdrawn += currentWithdrawal;
        } else {
            totalWithdrawn += balance;
            balance = 0;
            isDepleted = true;
            depletedMonth = m;
            break;
        }

        // Annual Adjustments (Step Up OR Inflation)
        // If both on, they are cumulative (Step Up is user choice, Inflation is market adjustment)
        if (m % 12 === 0) {
            if (isSwpStepUp) {
                currentWithdrawal = currentWithdrawal * (1 + swpStepUp / 100);
            }
        }
    }

    // 4. Handle Depletion Warning
    if (isDepleted) {
        if (depletionWarning) {
            depletionWarning.style.display = 'block';
            let yrs = Math.floor(depletedMonth / 12);
            let remM = depletedMonth % 12;
            if (depletionText) {
                let msg = `Your investment will run out in <strong>${yrs} Years ${remM} Months</strong>.`;
                if (isSwpInflation) msg += `<br><span style="font-size: 0.8rem; font-weight: 400;">(Real value of corpus will be lower due to inflation)</span>`;
                depletionText.innerHTML = msg;
            }
        }
        if (chartContainer) chartContainer.style.display = 'none';
        if (statsContainer) statsContainer.style.display = 'none';
        return;
    } else {
        if (depletionWarning) depletionWarning.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'flex';
        if (statsContainer) statsContainer.style.display = 'block';
    }

    // 5. Success State Metrics
    let returnsEarned = balance + totalWithdrawn - swpInvestment;

    let realFinalBalance = balance;
    let inflationImpact = 0;

    if (isSwpInflation) {
        let inflationFactor = Math.pow(1 + swpInflation / 100, swpYears);
        realFinalBalance = balance / inflationFactor;
        inflationImpact = balance - realFinalBalance;
    }

    // Rounding
    balance = Math.round(balance);
    totalWithdrawn = Math.round(totalWithdrawn);
    returnsEarned = Math.round(returnsEarned);
    realFinalBalance = Math.round(realFinalBalance);
    inflationImpact = Math.round(inflationImpact);

    // 6. Update UI
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    if (resTotalWithdrawal) resTotalWithdrawal.innerText = fmt(totalWithdrawn);
    if (resReturnsEarned) resReturnsEarned.innerText = fmt(returnsEarned);

    // Dynamic Labels & Values
    const finalBalanceLabel = document.getElementById('swpFinalBalanceLabel');
    const donutLabel = document.getElementById('swpDonutLabel');
    const resInflationRow = document.getElementById('swpResInflationImpactRow');
    const resInflationVal = document.getElementById('swpResInflationImpact');

    if (isSwpInflation) {
        if (finalBalanceLabel) finalBalanceLabel.innerHTML = `<span class="dot" style="background: #00B37E;"></span> Total Real Value`;
        if (donutLabel) donutLabel.innerText = "Total Real Value";
        if (resFinalBalanceBottom) resFinalBalanceBottom.innerText = fmt(realFinalBalance);
        if (resFinalBalanceTop) resFinalBalanceTop.innerText = fmt(realFinalBalance);

        if (resInflationRow) resInflationRow.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationImpact);
    } else {
        if (finalBalanceLabel) finalBalanceLabel.innerHTML = `<span class="dot" style="background: #00B37E;"></span> Expected Final Balance`;
        if (donutLabel) donutLabel.innerText = "Expected Final Balance";
        if (resFinalBalanceBottom) resFinalBalanceBottom.innerText = fmt(balance);
        if (resFinalBalanceTop) resFinalBalanceTop.innerText = fmt(balance);

        if (resInflationRow) resInflationRow.style.display = 'none';
    }

    // 7. Update Donut Chart
    if (donut) {
        let total = totalWithdrawn + balance;
        if (total === 0) total = 1;

        if (isSwpInflation) {
            // 3 segments: Withdrawn (Grey), Real Balance (Green), Inflation Impact (Orange)
            let withdrawnPct = (totalWithdrawn / total) * 100;
            let realBalancePct = (realFinalBalance / total) * 100;
            let impactPct = (inflationImpact / total) * 100;

            let deg1 = (realBalancePct / 100) * 360;
            let deg2 = deg1 + (impactPct / 100) * 360;

            donut.style.background = `conic-gradient(
                #00B37E 0deg ${deg1}deg, 
                #F97316 ${deg1}deg ${deg2}deg, 
                #9CA3AF ${deg2}deg 360deg
            )`;
        } else {
            let balancePct = (balance / total) * 100;
            let deg = (balancePct / 100) * 360;
            donut.style.background = `conic-gradient(#00B37E 0deg ${deg}deg, #9CA3AF ${deg}deg 360deg)`;
        }
    }

    // 8. Update Comparision Bar Chart
    updateSwpBarChart(balance, totalWithdrawn, realFinalBalance);
}

function updateSwpBarChart(nominalBalance, totalWithdrawn, realFinalBalance) {
    const chart = document.getElementById('swpComparisonChart');
    if (!chart) return;

    chart.innerHTML = ''; // Clear previous

    /* 
       Scenario:
       A. Normal: No Chart or simple comparison? Request says:
          "Scenario A: ... Secondary Chart (Bar): If Inflation ON: Nominal vs Real. If Step Up ON: Fixed vs Step Up."
    */

    if (isSwpInflation) {
        chart.style.display = 'flex';
        // Bar 1: Nominal
        // Bar 2: Real
        let max = Math.max(nominalBalance, realFinalBalance);
        if (max === 0) max = 1;

        const hNom = (nominalBalance / max) * 100;
        const hReal = (realFinalBalance / max) * 100;

        chart.innerHTML = `
            <div class="bar-column">
                <div class="bar-value">${shortFmt(nominalBalance)}</div>
                <div class="bar" style="height: ${hNom}%; background: #00B37E;"></div>
                <span class="bar-label">Nominal</span>
            </div>
            <div class="bar-column">
                <div class="bar-value">${shortFmt(realFinalBalance)}</div>
                <div class="bar" style="height: ${hReal}%; background: #60A5FA;"></div>
                <span class="bar-label">Real Value</span>
            </div>
        `;
    }
    else if (isSwpStepUp) {
        // To show Fixed vs Step Up, we need to calculate Fixed scenario values.
        // Let's do a quick recalc for fixed scenario
        let fixedBal = calculateSwpFixedScenario(swpInvestment, swpWithdrawal, swpRate, swpYears);

        // Actually request says: "If Step-up is ON: Show Fixed Withdrawal Total vs Step-up Withdrawal Total"
        // Wait, "Fixed Withdrawal Total" vs "Step-up Withdrawal Total"
        // OK, I tracked totalWithdrawn. I need fixedTotalWithdrawn.
        let fixedTotalVar = swpWithdrawal * swpYears * 12; // Simple approx if balance suffices?
        // Better to run accurate simulation
        let fixedSim = simulateSwp(swpInvestment, swpWithdrawal, swpRate, swpYears, 0); // 0 step up

        chart.style.display = 'flex';

        let max = Math.max(fixedSim.totalWithdrawn, totalWithdrawn);

        const hFixed = (fixedSim.totalWithdrawn / max) * 100;
        const hStep = (totalWithdrawn / max) * 100;

        chart.innerHTML = `
            <div class="bar-column">
                <div class="bar-value">${shortFmt(fixedSim.totalWithdrawn)}</div>
                <div class="bar" style="height: ${hFixed}%; background: #9CA3AF;"></div>
                <span class="bar-label">Fixed W/D</span>
            </div>
            <div class="bar-column">
                <div class="bar-value">${shortFmt(totalWithdrawn)}</div>
                <div class="bar" style="height: ${hStep}%; background: #00B37E;"></div>
                <span class="bar-label">Step-up W/D</span>
            </div>
        `;

    } else {
        chart.style.display = 'none';
    }
}

function calculateSwpSuperAdvance() {
    // 1. Threshold Check for High Value Consultation
    let hvGoal = swpAdvGoal > 50000000;
    let hvWithdrawal = swpAdvWithdrawal > 3000000;
    let hvSavings = swpAdvSavings > 10000000;

    if (hvGoal || hvWithdrawal || hvSavings) {
        updateSwpSuperAdvanceUI(null, true);
        return;
    }

    let months = swpAdvTime * 12;
    let monthlyRate = swpAdvReturn / 1200;

    // Helper function to simulate reaching goal
    function simulateCashflow(startingSip) {
        let balance = swpAdvSavings;
        let currentSip = startingSip;
        let currentWithdrawal = swpAdvWithdrawal;

        let totalInvested = swpAdvSavings;
        let totalWithdrawn = 0;

        for (let m = 1; m <= months; m++) {
            // Apply SIP at start of month
            balance += currentSip;
            totalInvested += currentSip;

            // Accrue interest
            balance += (balance * monthlyRate);

            // Annual adjustments (Withdrawal and Step-ups)
            if (m % 12 === 0) {
                // Determine withdrawal amount (applied end of year)
                if (balance >= currentWithdrawal) {
                    balance -= currentWithdrawal;
                    totalWithdrawn += currentWithdrawal;
                } else {
                    totalWithdrawn += balance;
                    balance = 0;
                }

                // Increase SWP for next year (Compound Growth)
                let infRate = isSwpAdvInflation ? swpAdvInflation : 0;
                let stepRate = isSwpAdvStepUpSwp ? swpAdvStepUpSwp : 0;
                let swpGrowth = (((1 + (stepRate / 100)) * (1 + (infRate / 100))) - 1);

                currentWithdrawal = currentWithdrawal * (1 + swpGrowth);

                // Increase SIP for next year
                if (isSwpAdvStepUpSip) {
                    currentSip = currentSip * (1 + (swpAdvStepUpSip / 100));
                }
            }
        }
        return { finalBalance: balance, totalInvested, totalWithdrawn, startingSip };
    }

    // 1. Calculate the inflated Target Goal if Inflation is ON
    let targetGoal = swpAdvGoal;
    if (isSwpAdvInflation) {
        let inflationFactor = Math.pow(1 + (swpAdvInflation / 100), swpAdvTime);
        targetGoal = swpAdvGoal * inflationFactor;
    }

    // Binary Search / Goal Seek
    let low = 0;
    let high = targetGoal * 2; // Arbitrary high upper bound
    // If high is too low, we expand it
    if (simulateCashflow(high).finalBalance < targetGoal) {
        high = targetGoal * 10;
    }

    let requiredSip = 0;
    let bestResult = null;
    let tolerance = 1; // within 1 rupee

    // Avoid infinite loops
    let iterations = 0;
    let maxIterations = 100;

    // Check if target goal is reachable with 0 SIP
    let zeroSipResult = simulateCashflow(0);
    if (zeroSipResult.finalBalance >= targetGoal) {
        bestResult = zeroSipResult;
        requiredSip = 0;
    } else {
        while (low <= high && iterations < maxIterations) {
            let mid = (low + high) / 2;
            let result = simulateCashflow(mid);
            bestResult = result;

            if (Math.abs(result.finalBalance - targetGoal) <= tolerance) {
                requiredSip = mid;
                break;
            } else if (result.finalBalance < targetGoal) {
                low = mid + 1; // Need more SIP
            } else {
                high = mid - 1; // Need less SIP
                requiredSip = mid;
            }
            iterations++;
        }
    }

    // Round values
    requiredSip = Math.ceil(requiredSip);
    if (bestResult) {
        // Redo simulation exact with rounded SIP just to get final clean numbers
        bestResult = simulateCashflow(requiredSip);
    }

    updateSwpSuperAdvanceUI({
        requiredSip: requiredSip,
        totalInvested: bestResult ? bestResult.totalInvested : 0,
        totalWithdrawn: bestResult ? bestResult.totalWithdrawn : 0,
        finalCorpus: bestResult ? bestResult.finalBalance : 0,
        targetGoal: targetGoal // Pass inflated goal to UI
    });
}

function updateSwpSuperAdvanceUI(data, isHv) {
    const normalState = document.getElementById('swpNormalState');
    const advanceState = document.getElementById('swpSuperAdvanceState');
    const hvForm = document.getElementById('swpHighValueForm');
    const factCard = document.getElementById('swpFactCard');

    const resRequiredSip = document.getElementById('resSwpAdvRequiredSip');
    const resTotalInvested = document.getElementById('resSwpAdvTotalInvested');
    const resTotalWithdrawn = document.getElementById('resSwpAdvTotalWithdrawn');
    const resFinalCorpus = document.getElementById('resSwpAdvFinalCorpus');
    const resSummaryText = document.getElementById('resSwpAdvSummaryText');

    const hvTitle = document.getElementById('swpHvTitle');
    const hvMsg = document.getElementById('swpHvMsg');
    const hvIcon = document.getElementById('swpHvIcon');
    const hvService = document.getElementById('swpHvService');

    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    // Initial Hide All
    if (normalState) normalState.style.display = 'none';
    if (advanceState) advanceState.style.display = 'none';
    if (hvForm) hvForm.style.display = 'none';
    if (factCard) factCard.style.display = 'block';

    if (isHv) {
        if (hvForm) {
            hvForm.style.display = 'block';
            if (factCard) factCard.style.display = 'none';

            // High Value Content logic
            if (hvTitle) hvTitle.innerText = "High Value Goal Seek 🚀";
            if (hvMsg) hvMsg.innerText = "Achieving aggressive targets with complex cashflows requires personalized portfolio modeling. Connect with our financial experts for a bespoke strategy.";
            if (hvIcon) {
                hvIcon.innerText = "🎯";
                hvIcon.style.background = "#EFF6FF";
                hvIcon.style.color = "#3B82F6";
            }
            if (hvService) hvService.value = "Advanced SWP & Goal Planning";
        }
    } else if (data) {
        if (advanceState) advanceState.style.display = 'block';
        if (resRequiredSip) resRequiredSip.innerText = fmt(data.requiredSip);
        if (resTotalInvested) resTotalInvested.innerText = fmt(data.totalInvested);
        if (resTotalWithdrawn) resTotalWithdrawn.innerText = fmt(data.totalWithdrawn);
        if (resFinalCorpus) resFinalCorpus.innerText = Math.round(data.finalCorpus) < Math.round(data.targetGoal) ? "Goal Failed" : fmt(data.finalCorpus);

        if (resSummaryText) {
            resSummaryText.innerHTML = `Starting with <strong>${fmt(swpAdvSavings)}</strong> today, and investing a monthly SIP of <strong>${fmt(data.requiredSip)}</strong> (growing every year by ${isSwpAdvStepUpSip ? swpAdvStepUpSip : 0}%), you will be able to withdraw a starting annual amount of <strong>${fmt(swpAdvWithdrawal)}</strong> while still reaching your final target of <strong>${fmt(data.targetGoal)}</strong> after ${swpAdvTime} years.`;
        }
    }
}

function simulateSwp(inv, wd, rate, years, stepUp) {
    let bal = inv;
    let totWd = 0;
    let months = years * 12;
    let r = rate / 1200;
    let curWd = wd;

    for (let m = 1; m <= months; m++) {
        bal += bal * r;
        if (bal >= curWd) {
            bal -= curWd;
            totWd += curWd;
        } else {
            totWd += bal;
            bal = 0;
            break;
        }
        if (stepUp > 0 && m % 12 === 0) curWd *= (1 + stepUp / 100);
    }
    return { balance: bal, totalWithdrawn: totWd };
}



// SWP Facts
const swpFacts = [
    "SWP stands for Systematic Withdrawal Plan.",
    "SWP allows you to withdraw a fixed amount regularly from your investments.",
    "SWP is the opposite of SIP (Systematic Investment Plan).",
    "SWP is ideal for retirees looking for a regular income stream.",
    "You can choose monthly, quarterly, or annual withdrawals in SWP.",
    "SWP helps in managing cash flow needs effectively.",
    "SWP capital withdrawals are not subject to TDS for equity funds (check latest tax rules).",
    "SWP provides rupee cost averaging in reverse.",
    "When markets are high, fewer units are redeemed to generate the fixed amount.",
    "When markets are low, more units are redeemed.",
    "SWP can be set up on any mutual fund scheme.",
    "It is a great tool for pension planning.",
    "You can step-up your SWP amount annually to beat inflation.",
    "SWP allows you to enjoy the benefits of compounding on the unwithdrawn corpus.",
    "Sequence of returns risk is a crucial factor in SWP success.",
    "Withdrawing too much too early can deplete your corpus faster.",
    "A safe withdrawal rate is often considered to be around 4-6%.",
    "SWP works best with low-volatility funds for short-term needs.",
    "Equity funds are suitable for long-term SWP horizons (10+ years).",
    "Hybrid funds are popular for SWP due to stability.",
    "SWP ensures liquidity without breaking the entire investment.",
    "You can use SWP to pay for EMIs or insurance premiums.",
    "SWP amounts are credited directly to your bank account.",
    "The NAV of the fund reduces by the extent of the withdrawal.",
    "SWP does not guarantee the preservation of capital if markets crash deeply.",
    "Regular withdrawals affect compounding, so plan the rate carefully.",
    "Inflation can erode the purchasing power of your fixed withdrawal.",
    "Step-up SWP is essential to maintain standard of living.",
    "SWP is flexible; you can skip a month if you don't need money.",
    "You can set up multiple SWPs from different funds.",
    "SWP income can be used to fund another SIP (STP - Systematic Transfer Plan).",
    "Exit loads may apply if you withdraw within the exit load period (usually 1 year).",
    "Always account for exit loads when planning near-term SWP.",
    "Short Term Capital Gains (STCG) tax applies if withdrawn within 1 year for equity.",
    "Long Term Capital Gains (LTCG) > \u20B91.25L is taxed at 12.5% for equity.",
    "Debt fund SWP gains are taxed as per your income slab.",
    "SWP gives you control over your tax liability compared to dividends.",
    "You can increase your SWP amount as your corpus grows.",
    "SWP allows for wealth transfer strategies.",
    "It is a preferred method for second income generation.",
    "SWP minimizes the behavioral risk of panic selling.",
    "Automated withdrawals remove emotional decision making.",
    "You can redeem the remaining balance as a lump sum anytime.",
    "SWP is a key component of financial freedom strategies.",
    "Consistent cash flow is the primary benefit of SWP."
];

function randomizeSwpFact() {
    const el = document.getElementById('swpFactText');
    if (el) {
        const random = swpFacts[Math.floor(Math.random() * swpFacts.length)];
        el.innerText = random;
    }
}


// Event Listeners for SWP
document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const iInv = document.getElementById('swpInputInvestment');
    const rInv = document.getElementById('swpRangeInvestment');
    const iWd = document.getElementById('swpInputWithdrawal');
    const rWd = document.getElementById('swpRangeWithdrawal');
    const iRate = document.getElementById('swpInputRate');
    const rRate = document.getElementById('swpRangeRate');
    const iYears = document.getElementById('swpInputYears');
    const rYears = document.getElementById('swpRangeYears');

    // Advanced
    const cStep = document.getElementById('swpCheckStepUp');
    const divStep = document.getElementById('swpStepUpControl');
    const iStep = document.getElementById('swpInputStepUp');
    const rStep = document.getElementById('swpRangeStepUp');

    const cInf = document.getElementById('swpCheckInflation');
    const divInf = document.getElementById('swpInflationControl');
    const iInf = document.getElementById('swpInputInflation');
    const rInf = document.getElementById('swpRangeInflation');

    // Sync Helper
    const sync = (input, range, vari, scale = 1) => {
        if (!input || !range) return;
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) val = 0;
            window[vari] = val;
            range.value = val;
            calculateSWP();
        });
        range.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            window[vari] = val;
            input.value = val;
            calculateSWP();
        });
    };

    // Manual Bindings (because 'vari' string needing window scope is a bit hacky, but works)

    if (iInv && rInv) {
        iInv.addEventListener('input', (e) => { swpInvestment = parseFloat(e.target.value) || 0; rInv.value = swpInvestment; calculateSWP(); });
        rInv.addEventListener('input', (e) => { swpInvestment = parseFloat(e.target.value) || 0; iInv.value = swpInvestment; calculateSWP(); });
    }

    if (iWd && rWd) {
        iWd.addEventListener('input', (e) => { swpWithdrawal = parseFloat(e.target.value) || 0; rWd.value = swpWithdrawal; calculateSWP(); });
        rWd.addEventListener('input', (e) => { swpWithdrawal = parseFloat(e.target.value) || 0; iWd.value = swpWithdrawal; calculateSWP(); });
    }

    if (iRate && rRate) {
        iRate.addEventListener('input', (e) => { swpRate = parseFloat(e.target.value) || 0; rRate.value = swpRate; calculateSWP(); });
        rRate.addEventListener('input', (e) => { swpRate = parseFloat(e.target.value) || 0; iRate.value = swpRate; calculateSWP(); });
    }

    if (iYears && rYears) {
        iYears.addEventListener('input', (e) => { swpYears = parseFloat(e.target.value) || 0; rYears.value = swpYears; calculateSWP(); });
        rYears.addEventListener('input', (e) => { swpYears = parseFloat(e.target.value) || 0; iYears.value = swpYears; calculateSWP(); });
    }

    if (iStep && rStep) {
        iStep.addEventListener('input', (e) => { swpStepUp = parseFloat(e.target.value) || 0; rStep.value = swpStepUp; calculateSWP(); });
        rStep.addEventListener('input', (e) => { swpStepUp = parseFloat(e.target.value) || 0; iStep.value = swpStepUp; calculateSWP(); });
    }

    if (iInf && rInf) {
        iInf.addEventListener('input', (e) => { swpInflation = parseFloat(e.target.value) || 0; rInf.value = swpInflation; calculateSWP(); });
        rInf.addEventListener('input', (e) => { swpInflation = parseFloat(e.target.value) || 0; iInf.value = swpInflation; calculateSWP(); });
    }

    // Toggles
    if (cStep) {
        cStep.addEventListener('change', (e) => {
            isSwpStepUp = e.target.checked;
            if (divStep) divStep.style.display = isSwpStepUp ? 'block' : 'none';
            calculateSWP();
        });
    }

    if (cInf) {
        cInf.addEventListener('change', (e) => {
            isSwpInflation = e.target.checked;
            if (divInf) divInf.style.display = isSwpInflation ? 'block' : 'none';
            calculateSWP();
        });
    }

    // SWP Super Advance Toggle
    const swpToggle = document.getElementById('checkSwpSuperAdvance');
    if (swpToggle) {
        swpToggle.addEventListener('change', (e) => {
            isSwpSuperAdvance = e.target.checked;
            window.toggleSwpMode();
        });
    }

    // Advance Inputs
    const iAdvTime = document.getElementById('swpAdvInputTime');
    const rAdvTime = document.getElementById('swpAdvRangeTime');
    const iAdvGoal = document.getElementById('swpAdvInputGoal');
    const rAdvGoal = document.getElementById('swpAdvRangeGoal');
    const iAdvWith = document.getElementById('swpAdvInputWithdrawal');
    const rAdvWith = document.getElementById('swpAdvRangeWithdrawal');
    const iAdvSav = document.getElementById('swpAdvInputSavings');
    const rAdvSav = document.getElementById('swpAdvRangeSavings');
    const iAdvRet = document.getElementById('swpAdvInputReturn');
    const rAdvRet = document.getElementById('swpAdvRangeReturn');

    if (iAdvTime && rAdvTime) { iAdvTime.addEventListener('input', (e) => { swpAdvTime = parseFloat(e.target.value) || 0; rAdvTime.value = swpAdvTime; calculateSWP(); }); rAdvTime.addEventListener('input', (e) => { swpAdvTime = parseFloat(e.target.value) || 0; iAdvTime.value = swpAdvTime; calculateSWP(); }); }
    if (iAdvGoal && rAdvGoal) { iAdvGoal.addEventListener('input', (e) => { swpAdvGoal = parseFloat(e.target.value) || 0; rAdvGoal.value = swpAdvGoal; calculateSWP(); }); rAdvGoal.addEventListener('input', (e) => { swpAdvGoal = parseFloat(e.target.value) || 0; iAdvGoal.value = swpAdvGoal; calculateSWP(); }); }
    if (iAdvWith && rAdvWith) { iAdvWith.addEventListener('input', (e) => { swpAdvWithdrawal = parseFloat(e.target.value) || 0; rAdvWith.value = swpAdvWithdrawal; calculateSWP(); }); rAdvWith.addEventListener('input', (e) => { swpAdvWithdrawal = parseFloat(e.target.value) || 0; iAdvWith.value = swpAdvWithdrawal; calculateSWP(); }); }
    if (iAdvSav && rAdvSav) { iAdvSav.addEventListener('input', (e) => { swpAdvSavings = parseFloat(e.target.value) || 0; rAdvSav.value = swpAdvSavings; calculateSWP(); }); rAdvSav.addEventListener('input', (e) => { swpAdvSavings = parseFloat(e.target.value) || 0; iAdvSav.value = swpAdvSavings; calculateSWP(); }); }
    if (iAdvRet && rAdvRet) { iAdvRet.addEventListener('input', (e) => { swpAdvReturn = parseFloat(e.target.value) || 0; rAdvRet.value = swpAdvReturn; calculateSWP(); }); rAdvRet.addEventListener('input', (e) => { swpAdvReturn = parseFloat(e.target.value) || 0; iAdvRet.value = swpAdvReturn; calculateSWP(); }); }

    // Advance Toggles & Modifiers
    const cAdvInf = document.getElementById('swpAdvCheckInflation');
    const dAdvInf = document.getElementById('swpAdvInflationControl');
    const iAdvInf = document.getElementById('swpAdvInputInflation');
    const rAdvInf = document.getElementById('swpAdvRangeInflation');
    if (cAdvInf) { cAdvInf.addEventListener('change', (e) => { isSwpAdvInflation = e.target.checked; if (dAdvInf) dAdvInf.style.display = isSwpAdvInflation ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvInf && rAdvInf) { iAdvInf.addEventListener('input', (e) => { swpAdvInflation = parseFloat(e.target.value) || 0; rAdvInf.value = swpAdvInflation; calculateSWP(); }); rAdvInf.addEventListener('input', (e) => { swpAdvInflation = parseFloat(e.target.value) || 0; iAdvInf.value = swpAdvInflation; calculateSWP(); }); }

    const cAdvStepSip = document.getElementById('swpAdvCheckStepUpSip');
    const dAdvStepSip = document.getElementById('swpAdvStepUpSipControl');
    const iAdvStepSip = document.getElementById('swpAdvInputStepUpSip');
    const rAdvStepSip = document.getElementById('swpAdvRangeStepUpSip');
    if (cAdvStepSip) { cAdvStepSip.addEventListener('change', (e) => { isSwpAdvStepUpSip = e.target.checked; if (dAdvStepSip) dAdvStepSip.style.display = isSwpAdvStepUpSip ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvStepSip && rAdvStepSip) { iAdvStepSip.addEventListener('input', (e) => { swpAdvStepUpSip = parseFloat(e.target.value) || 0; rAdvStepSip.value = swpAdvStepUpSip; calculateSWP(); }); rAdvStepSip.addEventListener('input', (e) => { swpAdvStepUpSip = parseFloat(e.target.value) || 0; iAdvStepSip.value = swpAdvStepUpSip; calculateSWP(); }); }

    const cAdvStepSwp = document.getElementById('swpAdvCheckStepUpSwp');
    const dAdvStepSwp = document.getElementById('swpAdvStepUpSwpControl');
    const iAdvStepSwp = document.getElementById('swpAdvInputStepUpSwp');
    const rAdvStepSwp = document.getElementById('swpAdvRangeStepUpSwp');
    if (cAdvStepSwp) { cAdvStepSwp.addEventListener('change', (e) => { isSwpAdvStepUpSwp = e.target.checked; if (dAdvStepSwp) dAdvStepSwp.style.display = isSwpAdvStepUpSwp ? 'block' : 'none'; calculateSWP(); }); }
    if (iAdvStepSwp && rAdvStepSwp) { iAdvStepSwp.addEventListener('input', (e) => { swpAdvStepUpSwp = parseFloat(e.target.value) || 0; rAdvStepSwp.value = swpAdvStepUpSwp; calculateSWP(); }); rAdvStepSwp.addEventListener('input', (e) => { swpAdvStepUpSwp = parseFloat(e.target.value) || 0; iAdvStepSwp.value = swpAdvStepUpSwp; calculateSWP(); }); }
});

// Loan Prepayment Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const iBal = document.getElementById('loanInputBalance');
    const rBal = document.getElementById('loanRangeBalance');
    const iRate = document.getElementById('loanInputRate');
    const rRate = document.getElementById('loanRangeRate');
    const iTenure = document.getElementById('loanInputTenure');
    const rTenure = document.getElementById('loanRangeTenure');
    const iExtra = document.getElementById('loanInputExtraEmi');
    const rExtra = document.getElementById('loanRangeExtraEmi');

    const sFreq = document.getElementById('loanExtraEmiFreq');
    const sBenefit = document.getElementById('loanPrepayBenefit');

    const iCharge = document.getElementById('loanInputPrepayCharge');
    const rCharge = document.getElementById('loanRangePrepayCharge');

    if (iBal && rBal) {
        iBal.addEventListener('input', (e) => { loanBalance = parseFloat(e.target.value) || 0; rBal.value = loanBalance; calculateLoanPrepayment(); });
        rBal.addEventListener('input', (e) => { loanBalance = parseFloat(e.target.value) || 0; iBal.value = loanBalance; calculateLoanPrepayment(); });
    }
    if (iRate && rRate) {
        iRate.addEventListener('input', (e) => { loanRate = parseFloat(e.target.value) || 0; rRate.value = loanRate; calculateLoanPrepayment(); });
        rRate.addEventListener('input', (e) => { loanRate = parseFloat(e.target.value) || 0; iRate.value = loanRate; calculateLoanPrepayment(); });
    }
    if (iTenure && rTenure) {
        iTenure.addEventListener('input', (e) => { loanTenureMonths = parseFloat(e.target.value) || 0; rTenure.value = loanTenureMonths; calculateLoanPrepayment(); });
        rTenure.addEventListener('input', (e) => { loanTenureMonths = parseFloat(e.target.value) || 0; iTenure.value = loanTenureMonths; calculateLoanPrepayment(); });
    }
    if (iExtra && rExtra) {
        iExtra.addEventListener('input', (e) => { loanExtraEmi = parseFloat(e.target.value) || 0; rExtra.value = loanExtraEmi; calculateLoanPrepayment(); });
        rExtra.addEventListener('input', (e) => { loanExtraEmi = parseFloat(e.target.value) || 0; iExtra.value = loanExtraEmi; calculateLoanPrepayment(); });
    }
    if (iCharge && rCharge) {
        iCharge.addEventListener('input', (e) => { loanPrepayCharge = parseFloat(e.target.value) || 0; rCharge.value = loanPrepayCharge; calculateLoanPrepayment(); });
        rCharge.addEventListener('input', (e) => { loanPrepayCharge = parseFloat(e.target.value) || 0; iCharge.value = loanPrepayCharge; calculateLoanPrepayment(); });
    }
    if (sFreq) {
        sFreq.addEventListener('change', (e) => {
            loanExtraEmiFreq = e.target.value;
            const maxLabel = document.getElementById('loanExtraMaxLabel');
            if (loanExtraEmiFreq === 'monthly') {
                rExtra.max = 10000;
                if (maxLabel) maxLabel.innerText = '\u20B910K';
            } else {
                rExtra.max = 120000;
                if (maxLabel) maxLabel.innerText = '\u20B91.2L';
            }
            calculateLoanPrepayment();
        });
    }
    if (sBenefit) {
        sBenefit.addEventListener('change', (e) => { loanPrepayBenefit = e.target.value; calculateLoanPrepayment(); });
    }

    // High Value Form Validation & Submit
    const hvPrivacy = document.getElementById('loanHvPrivacy');
    const hvSubmit = document.getElementById('btnLoanHvSubmit');
    if (hvPrivacy && hvSubmit) {
        hvPrivacy.addEventListener('change', (e) => {
            hvSubmit.disabled = !e.target.checked;
            hvSubmit.style.opacity = e.target.checked ? '1' : '0.6';
            hvSubmit.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
        });
    }
});

window.toggleSwpMode = function () {
    const grpNormal = document.getElementById('grpSwpNormalInputs');
    const grpAdvance = document.getElementById('grpSwpAdvanceInputs');
    const advSettings = document.getElementById('swpNormalAdvancedSettings');

    if (isSwpSuperAdvance) {
        if (grpNormal) grpNormal.style.display = 'none';
        if (grpAdvance) grpAdvance.style.display = 'block';
        if (advSettings) advSettings.style.display = 'none';
    } else {
        if (grpNormal) grpNormal.style.display = 'block';
        if (grpAdvance) grpAdvance.style.display = 'none';
        if (advSettings) advSettings.style.display = 'block';
    }
    calculateSWP();
}

// ==========================================
// SIP Super Advance Mode Logic
// ==========================================

let isSipSuperAdvance = false;
let sipGoalAmount = 10000000; // 1 Crore Default

// Initialize Super Advance Logic
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('checkSuperAdvance');
    const grpNormal = document.getElementById('grpMonthlyInvestment');
    const grpAdvance = document.getElementById('grpGoalAmount');

    // Inputs
    const iGoal = document.getElementById('inputGoalAmount');
    const rGoal = document.getElementById('rangeGoalAmount');

    if (toggle) {
        toggle.addEventListener('change', (e) => {
            isSipSuperAdvance = e.target.checked;

            // Goal vs Reality Toggle Group visibility
            const goalRealityToggleGrp = document.getElementById('goalRealityToggleGroup');
            if (goalRealityToggleGrp) {
                goalRealityToggleGrp.style.display = isSipSuperAdvance ? 'block' : 'none';
            }

            // Revert Goal vs Reality if Super Advance is turned off
            if (!isSipSuperAdvance) {
                isSipGoalReality = false;
                const checkReality = document.getElementById('sipCheckGoalReality');
                if (checkReality) checkReality.checked = false;
                toggleSipGoalRealityMode();
            }

            toggleSipMode();
        });
    }

    // Goal vs Reality Toggle Listener
    const checkReality = document.getElementById('sipCheckGoalReality');
    if (checkReality) {
        checkReality.addEventListener('change', (e) => {
            isSipGoalReality = e.target.checked;
            toggleSipGoalRealityMode();
            calculateSIP();
        });
    }

    // Sync Goal vs Reality Inputs
    const iCP = document.getElementById('inputCurrentPortfolio');
    const rCP = document.getElementById('rangeCurrentPortfolio');
    const iES = document.getElementById('inputExistingSip');
    const rES = document.getElementById('rangeExistingSip');

    if (iCP && rCP) {
        iCP.addEventListener('input', (e) => { sipCurrentPortfolio = parseFloat(e.target.value) || 0; rCP.value = sipCurrentPortfolio; calculateSIP(); });
        rCP.addEventListener('input', (e) => { sipCurrentPortfolio = parseFloat(e.target.value) || 0; iCP.value = sipCurrentPortfolio; calculateSIP(); });
    }
    if (iES && rES) {
        iES.addEventListener('input', (e) => { sipExistingSip = parseFloat(e.target.value) || 0; rES.value = sipExistingSip; calculateSIP(); });
        rES.addEventListener('input', (e) => { sipExistingSip = parseFloat(e.target.value) || 0; iES.value = sipExistingSip; calculateSIP(); });
    }

    // Sync Goal Inputs
    if (iGoal && rGoal) {
        iGoal.addEventListener('input', (e) => {
            sipGoalAmount = parseFloat(e.target.value) || 0;
            rGoal.value = sipGoalAmount;
            calculateSIP();
        });
        rGoal.addEventListener('input', (e) => {
            sipGoalAmount = parseFloat(e.target.value) || 0;
            iGoal.value = sipGoalAmount;
            calculateSIP();
        });
    }
});

window.toggleSipGoalRealityMode = function () {
    const grpGoal = document.getElementById('grpGoalAmount');
    const grpReality = document.getElementById('grpGoalRealityInputs');
    const grpMonthly = document.getElementById('grpMonthlyInvestment');
    const timeLabel = document.querySelector('#inputYears').closest('.sip-control-group').querySelector('label');
    const rYears = document.getElementById('rangeYears');

    if (isSipGoalReality) {
        if (grpGoal) grpGoal.style.display = 'block';
        if (grpReality) grpReality.style.display = 'block';
        if (grpMonthly) grpMonthly.style.display = 'none';
        if (timeLabel) timeLabel.innerText = "Time Left";
        if (rYears) rYears.max = 30; // 1 to 30 years as per request
    } else {
        // Return to normal Super Advance or Normal mode
        if (isSipSuperAdvance) {
            if (grpGoal) grpGoal.style.display = 'block';
            if (grpReality) grpReality.style.display = 'none';
            if (grpMonthly) grpMonthly.style.display = 'none';
        } else {
            if (grpGoal) grpGoal.style.display = 'none';
            if (grpReality) grpReality.style.display = 'none';
            if (grpMonthly) grpMonthly.style.display = 'block';
        }
        if (timeLabel) timeLabel.innerText = "Time Period";
        if (rYears) rYears.max = 40; // Restore default
    }
}

function toggleSipMode() {
    const grpNormal = document.getElementById('grpMonthlyInvestment');
    const grpAdvance = document.getElementById('grpGoalAmount');

    if (isSipSuperAdvance) {
        if (grpNormal) grpNormal.style.display = 'none';
        if (grpAdvance) grpAdvance.style.display = 'block'; // Use block to match CSS
    } else {
        if (grpNormal) grpNormal.style.display = 'block';
        if (grpAdvance) grpAdvance.style.display = 'none';
    }
    calculateSIP();
}

function calculateSipReverse() {
    // 1. High Value Check (> 2 Crores)
    const hvForm = document.getElementById('sipHighValueForm');
    const resNormal = document.getElementById('resNormalState');
    const hvService = document.getElementById('hvService');

    // Check Limit
    if (sipGoalAmount > 20000000) {
        // Show Consultation Form
        if (resNormal) resNormal.style.display = 'none';
        if (hvForm) {
            hvForm.style.display = 'block';
            if (hvService) hvService.value = "Planning for High Value Financial Goal";
        }
        return;
    } else {
        if (resNormal) resNormal.style.display = 'block'; // Restore normal 
        if (hvForm) hvForm.style.display = 'none';
        if (hvService) hvService.value = "Planning for Systematic Investment Plan";
    }

    // 2. Logic: Reverse Calculate SIP
    // Inputs: sipGoalAmount, sipRate, sipYears, sipStepUp, sipInflation
    // isSipStepUp, isSipInflation check.

    let targetGoal = sipGoalAmount;
    let r = sipRate / 1200; // Monthly Rate
    let months = sipYears * 12;

    // A. Inflation Adjustment
    // Request: "Scenario 3: With Inflation... Inflate the Goal first"
    if (isSipInflation) {
        // Target = Goal * (1+inf)^Years
        // Assuming Inflation is Annual
        let infFactor = Math.pow(1 + sipInflation / 100, sipYears);
        targetGoal = sipGoalAmount * infFactor;
    }

    // B. Calculate Initial SIP
    let requiredSIP = 0;

    if (isSipStepUp) {
        // Growing Annuity Future Value
        // N = months, r = monthly return rate
        // s = % Step up is ANNUAL usually.
        // Complex formula if Step-up is Annual but Compounding is Monthly.
        // Let's use Iteration or an approximation.
        // Iteration is safer and more robust for "Annual Step-up".

        // Let's guess SIP?
        // Or Factor logic:
        // Final Value of 1 SIP Unit starting at 1, stepping up annually.
        // Factor = Simulate(Principal=1)
        // RequiredSIP = TargetGoal / Factor

        let unitSim = simulateSipUnit(1, r, months, sipStepUp);
        requiredSIP = targetGoal / unitSim;

    } else {
        // Standard Formula
        // FV = P * [ ((1+r)^n - 1) / r ] * (1+r)  (Assuming Aidvance/Beginning of month payment?)
        // Standard SIP calculators usually assume payment at START of month? 
        // Our 'stdCurrentVal' usage: P * (( (1+r)^n - 1 )/r ) * (1+r) -> Yes, Payment at beginning.

        let factor = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
        requiredSIP = targetGoal / factor;
    }

    // 3. Update UI for Reverse Results
    updateSuperAdvanceUI(requiredSIP, targetGoal, months);
}

function simulateSipUnit(initialP, monthlyRate, months, stepUpPct) {
    let bal = 0;
    let currentP = initialP;

    for (let m = 1; m <= months; m++) {
        // Invest at start
        bal += currentP;
        // Interest at end of month
        bal += bal * monthlyRate;

        // Annual Step Up
        if (m % 12 === 0) {
            currentP = currentP * (1 + stepUpPct / 100);
        }
    }
    return bal; // This is the FV of 1 unit scheme
}

function updateSuperAdvanceUI(reqSip, targetGoal, months) {
    const resTotalValue = document.getElementById('resTotalValue');
    const resTotalValueBottom = document.getElementById('resTotalValueBottom');

    const resInvested = document.getElementById('resInvested');
    const resGained = document.getElementById('resGained');

    const donutLabel = document.querySelector('#sipDonut .donut-label');
    const donut = document.getElementById('sipDonut');
    const chartContainer = document.querySelector('.chart-container');

    const rowInflation = document.getElementById('rowInflation');
    const resInflationVal = document.getElementById('resInflationVal');
    const rowMonthlySip = document.getElementById('rowMonthlySip');
    const resMonthlySipVal = document.getElementById('resMonthlySipVal');

    const lblInv = document.getElementById('lblInv');
    const lblGain = document.getElementById('lblGain');
    const lblTotal = document.getElementById('lblTotal');
    const comparisonChart = document.getElementById('sipComparisonChart');

    // Hide comparison chart in Super Advance
    if (comparisonChart) comparisonChart.style.display = 'none';

    const resRealityStats = document.getElementById('resRealityCheckStats');
    const resStats = document.querySelector('.res-stats');
    if (resRealityStats) resRealityStats.style.display = 'none';
    if (resStats) resStats.style.display = 'block';

    // Helper
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    // Initial Principal Calculation
    let totalPrincipal = calculatetotalPrincipal(reqSip, months, isSipStepUp ? sipStepUp : 0);
    // Wealth Gained = Goal - Principal
    let wealthGained = targetGoal - totalPrincipal;
    // Inflation Amount = TargetGoal - InputGoal
    let inflationAmount = targetGoal - sipGoalAmount;

    // Layout: Super Advance always Centered (as per request)
    if (chartContainer) chartContainer.classList.remove('side-by-side');

    // 1. Hero Number (Top)
    if (donutLabel) donutLabel.innerText = "Required Monthly SIP";
    if (resTotalValue) resTotalValue.innerText = fmt(reqSip) + "/mo";

    // 2. Secondary Metrics
    // Amount Invested (Replaced Desired Goal Amount)
    if (lblInv) lblInv.innerHTML = '<span class="dot grey"></span> Amount Invested';
    if (resInvested) resInvested.innerText = fmt(totalPrincipal);

    // Est. Returns
    if (lblGain) lblGain.innerHTML = '<span class="dot green"></span> Est. Returns';
    if (resGained) resGained.innerText = fmt(wealthGained);

    // Inflation Adjustment
    if (isSipInflation) {
        if (rowInflation) rowInflation.style.display = 'flex';
        if (resInflationVal) resInflationVal.innerText = fmt(inflationAmount);
    } else {
        if (rowInflation) rowInflation.style.display = 'none';
    }

    // Monthly SIP in stats (Removed due to duplication with Hero Number)
    if (rowMonthlySip) rowMonthlySip.style.display = 'none';

    // Total Goal Value
    const totalRow = resTotalValueBottom ? resTotalValueBottom.closest('.stat-row') : null;
    if (isSipInflation) {
        if (totalRow) totalRow.style.display = 'flex';
        if (lblTotal) lblTotal.innerText = "Future Target Value";
        if (resTotalValueBottom) {
            resTotalValueBottom.innerText = fmt(targetGoal);
        }
    } else {
        if (totalRow) totalRow.style.display = 'none';
    }

    // UI Adjustments
    if (donut) {
        donut.style.display = 'flex';

        if (isSipInflation && targetGoal > 0) {
            let degPrincipal = (totalPrincipal / targetGoal) * 360;
            let degReal = (sipGoalAmount / targetGoal) * 360;

            if (isNaN(degPrincipal)) degPrincipal = 0;
            if (isNaN(degReal)) degReal = degPrincipal;

            // Grey (Principal) -> Green (Real Gains) -> Orange (Inflation)
            donut.style.background = `conic-gradient(#E5E7EB 0deg ${degPrincipal}deg, #00B37E ${degPrincipal}deg ${degReal}deg, #F59E0B ${degReal}deg 360deg)`;
        } else {
            // Wealth Gained = Green (#00B37E), Principal = Grey (#E5E7EB)
            let principalRatio = targetGoal > 0 ? (totalPrincipal / targetGoal) : 1;
            if (principalRatio > 1) principalRatio = 1;
            let deg = principalRatio * 360;
            if (isNaN(deg)) deg = 360;
            donut.style.background = `conic-gradient(#E5E7EB 0deg ${deg}deg, #00B37E ${deg}deg 360deg)`;
        }
    }
}

function calculateSipGapAnalysis() {
    let r = sipRate / 1200;
    let months = sipYears * 12;
    let inf = isSipInflation ? (sipInflation / 100) : 0;

    // 1. Goal (Step B)
    let targetGoal = sipGoalAmount;
    if (isSipInflation) {
        targetGoal = sipGoalAmount * Math.pow(1 + (sipInflation / 100), sipYears);
    }

    // 2. Reality (Step A)
    // Use Nominal Rate for simulation to match the (potentially) Inflated Goal
    let nominalRate = sipRate / 100;
    let nominalMonthlyRate = nominalRate / 12;

    // Simulate Reality
    let realityFV = 0;
    let currentP = sipExistingSip;
    let portfolioBal = sipCurrentPortfolio;

    // Portfolio compounding (Nominal)
    realityFV = portfolioBal * Math.pow(1 + nominalMonthlyRate, months);

    // SIP compounding (Nominal)
    let sipFV = 0;
    for (let m = 1; m <= months; m++) {
        sipFV = (sipFV + currentP) * (1 + nominalMonthlyRate);
        if (isSipStepUp && m % 12 === 0) {
            currentP *= (1 + sipStepUp / 100);
        }
    }
    realityFV += sipFV;

    // 3. Shortfall (Step C)
    let shortfall = Math.max(0, targetGoal - realityFV);

    // 4. Extra SIP Needed
    let extraSipNeeded = 0;
    if (shortfall > 0) {
        if (isSipStepUp) {
            let unitSim = simulateSipUnit(1, nominalMonthlyRate, months, sipStepUp);
            extraSipNeeded = shortfall / unitSim;
        } else {
            let factor = ((Math.pow(1 + nominalMonthlyRate, months) - 1) / nominalMonthlyRate) * (1 + nominalMonthlyRate);
            extraSipNeeded = shortfall / factor;
        }
    }

    updateSipGapAnalysisUI(realityFV, targetGoal, shortfall, extraSipNeeded);
}

function updateSipGapAnalysisUI(realityFV, targetGoal, shortfall, extraSip) {
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const resExtra = document.getElementById('resExtraSipNeeded');
    const resProjected = document.getElementById('resProjectedCorpus');
    const resTarget = document.getElementById('resTargetGoal');
    const resShort = document.getElementById('resShortfall');
    const donut = document.getElementById('sipDonut');
    const donutLabel = document.querySelector('#sipDonut .donut-label');
    const resTotal = document.getElementById('resTotalValue');

    const resNormalStats = document.querySelector('.res-stats');
    const resRealityStats = document.getElementById('resRealityCheckStats');

    // UI Toggle
    if (resNormalStats) resNormalStats.style.display = 'none';
    if (resRealityStats) resRealityStats.style.display = 'block';

    // Values
    if (resExtra) resExtra.innerText = fmt(extraSip);
    if (resProjected) resProjected.innerText = fmt(realityFV);
    if (resTarget) resTarget.innerText = fmt(targetGoal);
    if (resShort) resShort.innerText = fmt(shortfall);
    if (resTotal) resTotal.innerText = fmt(extraSip);
    if (donutLabel) donutLabel.innerText = "Extra SIP Needed";

    // Conditional "On Track" Message
    const gapMsg = document.getElementById('resGapMsg');
    const gapContainer = document.getElementById('resGapMsgContainer');
    const gapLabel = document.getElementById('resGapStatusLabel');

    if (extraSip <= 0) {
        if (gapMsg) gapMsg.innerText = "You're right on track, you just need to maintain consistency and meet your expected returns.";
        if (gapContainer) {
            gapContainer.style.background = "#F0FDF4"; // Success Green
            gapContainer.style.borderColor = "#DCFCE7";
        }
        if (gapLabel) {
            gapLabel.innerText = "Investment Status";
            gapLabel.style.color = "#166534";
        }
        if (resExtra) resExtra.style.color = "#15803D";
    } else {
        if (gapMsg) gapMsg.innerText = "Increase your SIP by this amount to bridge the gap.";
        if (gapContainer) {
            gapContainer.style.background = "#FFF4F2"; // Warning Red
            gapContainer.style.borderColor = "#FFD1C9";
        }
        if (gapLabel) {
            gapLabel.innerText = "Extra SIP Needed Today";
            gapLabel.style.color = "#C0392B";
        }
        if (resExtra) resExtra.style.color = "#E74C3C";
    }

    // Donut
    if (donut) {
        donut.style.display = 'flex';
        // Segment 1: Reality (Green)
        // Segment 2: Shortfall (Orange/Red)
        let total = realityFV + shortfall;
        if (total === 0) total = 1;
        let deg = (realityFV / total) * 360;
        donut.style.background = `conic-gradient(#00B37E 0deg ${deg}deg, #F59E0B ${deg}deg 360deg)`;
    }
}

function calculatetotalPrincipal(startSip, months, stepUp) {
    let total = 0;
    let current = startSip;
    for (let m = 1; m <= months; m++) {
        total += current;
        if (m % 12 === 0 && stepUp > 0) {
            current *= (1 + stepUp / 100);
        }
    }
    return total;
}

// ==========================================
// Loan Prepayment Logic
// ==========================================

function calculateLoanPrepayment() {
    const hvForm = document.getElementById('loanHighValueForm');
    try {
        const resState = document.getElementById('loanResultsState');
        const factCard = document.getElementById('loanFactCard');

        // --- 1. Gather Inputs ---
        const startBalance = parseFloat(document.getElementById('loanInputBalance').value) || 0;
        const rate = parseFloat(document.getElementById('loanInputRate').value) || 0;
        const tenureMonths = parseFloat(document.getElementById('loanInputTenure').value) || 0;
        const isSuperAdvance = document.getElementById('checkLoanSuperAdvance')?.checked || false;

        const loanBalance = startBalance;
        const loanRate = rate;
        const loanTenureMonths = tenureMonths;

        const surplus = parseFloat(document.getElementById('loanInputExtraEmi').value) || 0;
        const freq = document.getElementById('loanExtraEmiFreq').value;
        const benefitType = document.getElementById('loanPrepayBenefit').value;

        // --- 2. Threshold Check ---
        let isHighValue = loanBalance > 20000000;
        if (freq === 'monthly' && surplus > 10000) isHighValue = true;
        if (freq === 'yearly' && surplus > 120000) isHighValue = true;

        if (isHighValue) {
            if (resState) resState.style.display = 'none';
            if (hvForm) hvForm.style.display = 'block';
            if (factCard) factCard.style.display = 'none';
            const leadForm = document.getElementById('leadCapture-Loan');
            if (leadForm) leadForm.style.display = 'none';
            return;
        } else {
            if (resState) resState.style.display = 'block';
            if (hvForm) hvForm.style.display = 'none';
            if (factCard) factCard.style.display = 'flex';
            const leadForm = document.getElementById('leadCapture-Loan');
            if (leadForm) leadForm.style.display = 'block';
        }

        // --- 3. Calculation Logic ---
        const r = loanRate / 1200;
        const n = loanTenureMonths;

        let emi = 0;
        if (r > 0 && n > 0) {
            emi = loanBalance * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        } else if (n > 0) {
            emi = loanBalance / n;
        }
        if (isNaN(emi) || !isFinite(emi)) emi = 0;

        const regularTotalPayable = emi * n;
        const regularInterest = Math.max(0, regularTotalPayable - loanBalance);

        // Advanced Settings Inputs
        const isPenaltyOn = document.getElementById('loanTogglePenalty')?.checked || false;
        const penaltyRate = parseFloat(document.getElementById('loanInputPenalty')?.value) || 0;

        const isStepUpOn = document.getElementById('loanToggleStepUp')?.checked || false;
        const stepUpRate = parseFloat(document.getElementById('loanInputStepUp')?.value) || 0;

        // Prepayment Simulation
        let balance = loanBalance;
        let totalInterestPaid = 0;
        let totalCharges = 0;
        let monthsElapsed = 0;
        let currentEmi = emi;
        let firstReducedEmi = emi;
        let currentSurplus = surplus; // Restore missing var

        while (balance > 1 && monthsElapsed < 600) {
            monthsElapsed++;
            let interest = balance * r;
            totalInterestPaid += interest;

            let prepayment = 0;

            if (freq === 'monthly') {
                prepayment = currentSurplus;
            } else if (freq === 'yearly' && monthsElapsed % 12 === 0) {
                prepayment = currentSurplus;
            }

            // Penalty Calculation
            let charge = 0;
            if (isPenaltyOn && prepayment > 0) {
                charge = prepayment * (penaltyRate / 100);
                totalCharges += charge;
            }

            // Better Step Up Logic: Apply Step Up *AFTER* this year's prepayment is calculated
            if (isStepUpOn && monthsElapsed % 12 === 0) {
                currentSurplus = currentSurplus * (1 + stepUpRate / 100);
            }

            let principalComponent = currentEmi - interest;
            let totalPrincipalReduction = principalComponent + prepayment;

            if (totalPrincipalReduction > balance) {
                totalPrincipalReduction = balance;
            }
            balance -= totalPrincipalReduction;

            // --- REDUCE EMI LOGIC ---
            if (benefitType === 'emi' && balance > 0) {
                let remainingN = n - monthsElapsed;
                if (remainingN > 0) {
                    currentEmi = balance * r * Math.pow(1 + r, remainingN) / (Math.pow(1 + r, remainingN) - 1);
                    if (isNaN(currentEmi) || !isFinite(currentEmi)) currentEmi = balance;

                    // Capture the EMI after the first month's strategy
                    if (monthsElapsed === 1) firstReducedEmi = currentEmi;
                }
            }
        }

        const newTenure = monthsElapsed;
        const monthsSaved = Math.max(0, n - newTenure);
        const interestSaved = Math.max(0, regularInterest - totalInterestPaid);

        // Date Calculation
        const today = new Date();
        const oldEndDate = new Date(today.getFullYear(), today.getMonth() + n, 1);
        const newEndDate = new Date(today.getFullYear(), today.getMonth() + newTenure, 1);
        const dateFmt = { year: 'numeric', month: 'short' };

        updateLoanResultsUI({
            saved: interestSaved,
            monthsSaved: monthsSaved,
            principal: loanBalance,
            oldInterest: regularInterest,
            newInterest: totalInterestPaid,
            emi: emi,
            newEmi: benefitType === 'emi' ? firstReducedEmi : emi,
            oldTenure: n,
            newTenure: newTenure,
            charges: totalCharges,
            isPenaltyOn: isPenaltyOn,
            oldEndDateStr: oldEndDate.toLocaleDateString('en-IN', dateFmt),
            newEndDateStr: newEndDate.toLocaleDateString('en-IN', dateFmt),
            isSuperAdvance: isSuperAdvance
        });
    } catch (e) {
        console.error("Loan Error:", e.message);
        console.error(e);
    }
}

function updateLoanResultsUI(data) {
    const { saved, monthsSaved, principal, oldInterest, newInterest, emi, oldTenure, newTenure, charges, isPenaltyOn, oldEndDateStr, newEndDateStr } = data;

    const savedEl = document.getElementById('loanResInterestSaved');
    const chartContainer = document.getElementById('loanChartContainer');

    // DOM Elements for Metrics Table
    const elOldEMI = document.getElementById('loanResOldEMI');
    const elNewEMI = document.getElementById('loanResNewEMI');
    const elOldInt = document.getElementById('loanResOldInterest');
    const elNewInt = document.getElementById('loanResNewInterest');
    const elOldTen = document.getElementById('loanResOldTenure');
    const elNewTen = document.getElementById('loanResNewTenureVal');
    const elRowChgLbl = document.getElementById('loanRowChargesLabel');
    const elOldChg = document.getElementById('loanResOldCharges');
    const elNewChg = document.getElementById('loanResNewCharges');
    const elOldDate = document.getElementById('loanResOldEndDate');
    const elNewDate = document.getElementById('loanResNewEndDate');

    // Custom format with hardcoded Rupee symbol
    const fmt = (n) => "\u20B9" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
    const savedStr = fmt(Math.max(0, saved));

    if (savedEl) savedEl.innerText = savedStr;

    // Populate Metrics Table
    if (elOldEMI) elOldEMI.innerText = fmt(emi);
    if (elNewEMI) elNewEMI.innerText = fmt(data.newEmi || emi);
    if (elOldInt) elOldInt.innerText = fmt(oldInterest);
    if (elNewInt) elNewInt.innerText = fmt(newInterest);
    if (elOldTen) elOldTen.innerText = Math.round(oldTenure) + " Mo";
    if (elNewTen) elNewTen.innerText = Math.round(newTenure) + " Mo";

    // Toggle Charges Row
    const displayStyle = isPenaltyOn ? 'block' : 'none';
    if (elRowChgLbl) elRowChgLbl.style.display = displayStyle;
    if (elOldChg) {
        elOldChg.innerText = fmt(0);
        elOldChg.style.display = displayStyle;
    }
    if (elNewChg) {
        elNewChg.innerText = fmt(charges || 0);
        elNewChg.style.display = displayStyle;
    }

    if (elOldDate) elOldDate.innerText = oldEndDateStr || "-";
    if (elNewDate) elNewDate.innerText = newEndDateStr || "-";

    const superAdvRes = document.getElementById('loanResSuperAdvance');
    const hvForm = document.getElementById('loanHighValueForm');
    const factCard = document.getElementById('loanFactCard');

    if (data.isSuperAdvance) {
        if (chartContainer) chartContainer.style.display = 'none';
        if (document.getElementById('loanResultsState')) document.getElementById('loanResultsState').style.display = 'none';
        if (hvForm) hvForm.style.display = 'none';
        if (factCard) factCard.style.display = 'none';
        if (superAdvRes) superAdvRes.style.display = 'flex';
        return;
    } else {
        if (superAdvRes) superAdvRes.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'block';
        // loanResultsState and hvForm are already handled by threshold logic in calculateLoanPrepayment
    }

    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap;">
                <div style="text-align: center; flex: 1; min-width: 140px;">
                    <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 10px; font-weight: 600;">REGULAR PLAN</div>
                    <div class="donut-chart" id="loanDonutOld" style="width: 140px; height: 140px; margin: 0 auto;">
                        <div class="donut-hole" style="width: 100px; height: 100px;">
                            <span style="font-size: 0.65rem; color: #6b7280; font-weight: 600;">Total Cost</span>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; flex: 1; min-width: 140px;">
                    <div style="font-size: 0.75rem; color: #0B63D8; margin-bottom: 10px; font-weight: 600;">SMART PLAN</div>
                    <div class="donut-chart" id="loanDonutNew" style="width: 140px; height: 140px; margin: 0 auto;">
                        <div class="donut-hole" style="width: 100px; height: 100px;">
                            <span style="font-size: 0.65rem; color: #00B37E; font-weight: 700;">Optimized</span>
                        </div>
                    </div>
                </div>
            </div>`;

        updateLoanDonuts(principal, oldInterest, newInterest, 0);
    }
}

function updateLoanDonuts(principal, oldInterest, newInterest, charges) {
    const drawDonut = (id, p, i, c = 0) => {
        const el = document.getElementById(id);
        if (!el) return;

        let total = p + i + c;
        if (isNaN(total) || total <= 0) total = 1; // Prevent div by zero

        let pDeg = (p / total) * 360;
        let iDeg = pDeg + (i / total) * 360;

        if (isNaN(pDeg)) pDeg = 0;
        if (isNaN(iDeg)) iDeg = 0;

        // Colors: Principal (#0B63D8), Interest (#9CA3AF), Charges (#EF4444)
        el.style.background = `conic-gradient(#0B63D8 0deg ${pDeg}deg, #9CA3AF ${pDeg}deg ${iDeg}deg, #EF4444 ${iDeg}deg 360deg)`;
    };

    drawDonut('loanDonutOld', principal, oldInterest, 0);
    drawDonut('loanDonutNew', principal, newInterest, charges);
}

// Add Event Listeners for Loan Inputs
document.addEventListener('DOMContentLoaded', () => {
    // Existing listeners might handle basics, but we need to ensure NEW inputs trigger calculation
    const ids = [
        'loanInputBalance', 'loanRangeBalance',
        'loanInputRate', 'loanRangeRate',
        'loanInputTenure', 'loanRangeTenure',
        'loanInputExtraEmi', 'loanRangeExtraEmi',
        'loanExtraEmiFreq', 'loanPrepayBenefit',
        'loanInputInvReturn', 'loanRangeInvReturn',
        'loanInputStepUp', 'loanRangeStepUp',
        'loanInputPenalty', 'loanRangePenalty',
        'loanInputInflation', 'loanRangeInflation'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // 1. Sync Logic FIRST (so values update before calc calls)
            if (id.includes('Range')) {
                const inputId = id.replace('Range', 'Input');
                const input = document.getElementById(inputId);
                el.addEventListener('input', () => {
                    if (input) input.value = el.value;
                    // Trigger calc explicitly after sync? 
                    // No, the next listener handles it.
                    // But we rely on event order.
                });
            }
            if (id.includes('Input')) {
                const rangeId = id.replace('Input', 'Range');
                const range = document.getElementById(rangeId);
                el.addEventListener('input', () => {
                    if (range) range.value = el.value;
                });
            }

            // 2. Calculation Logic SECOND
            el.addEventListener('input', calculateLoanPrepayment);
            el.addEventListener('change', calculateLoanPrepayment);
        }
    });

    const checkLoanSuper = document.getElementById('checkLoanSuperAdvance');
    if (checkLoanSuper) {
        checkLoanSuper.addEventListener('change', calculateLoanPrepayment);
    }

    // Toggle Listeners
    // Note: Toggles have onchange="toggleThis()" in HTML, so we don't strictly need JS listeners here 
    // unless we want to clean up HTML. But keeping HTML onchange is fine for now.
});



// --- Privacy & Terms Modals ---
window.openPrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}
window.closePrivacyModal = function () {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}
window.openTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}
window.closeTermsModal = function () {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}



// --- Loan Advanced Settings Toggles (Global Scope) ---
window.toggleLoanAdvance = function () {
    const container = document.getElementById('loanAdvanceContainer');
    const icon = document.getElementById('loanAdvToggleIcon');
    if (container && icon) {
        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            container.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

window.toggleLoanAdvanceInput = function (groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.style.display = (group.style.display === 'none') ? 'block' : 'none';
        calculateLoanPrepayment();
    }
}

// Ensure listeners for new Inputs trigger calculation
document.addEventListener('DOMContentLoaded', () => {
    ['loanInputPenalty', 'loanRangePenalty', 'loanInputStepUp', 'loanRangeStepUp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateLoanPrepayment);
        }
    });
});




// --- Retirement Calculator Logic ---
window.openRetirementModal = function () {
    const modal = document.getElementById('retirementModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        // Click outside listener (if not already added)
        if (!modal.dataset.initClick) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) window.closeRetirementModal();
            });
            modal.dataset.initClick = "true";
        }
    }
    calculateRetirement();
}

window.closeRetirementModal = function () {
    const modal = document.getElementById('retirementModalOverlay');
    if (modal) modal.style.display = 'none';
}

function calculateRetirement() {
    const age = parseFloat(document.getElementById('retInputAge').value) || 30;
    const retAge = parseFloat(document.getElementById('retInputRetireAge').value) || 60;
    const expenses = parseFloat(document.getElementById('retInputExpenses').value) || 50000;
    const savings = parseFloat(document.getElementById('retInputSavings').value) || 0;
    const preROI = (parseFloat(document.getElementById('retInputPreROI').value) || 12) / 100;
    const postROI = (parseFloat(document.getElementById('retInputPostROI').value) || 8) / 100;
    const lifeExpectancy = parseFloat(document.getElementById('retInputLife').value) || 85;

    const isInflationOn = document.getElementById('retCheckInflation').checked;
    const inflation = isInflationOn ? (parseFloat(document.getElementById('retInputInflation').value) || 6) / 100 : 0;

    const hasStepUp = document.getElementById('retCheckStepUp').checked;
    const stepUpRate = (parseFloat(document.getElementById('retInputStepUp').value) || 10) / 100;

    const isSuperAdvance = document.getElementById('checkRetSuperAdvance').checked;

    // Validation
    if (retAge <= age) return;

    const yearsToRetire = retAge - age;
    const yearsInRetirement = lifeExpectancy - retAge;

    // Step 1: Inflate Expenses to Retirement Age
    const futureMonthlyExp = expenses * Math.pow(1 + inflation, yearsToRetire);

    // Step 2: Calculate Corpus needed (Annuity PV)
    // Formula: PV of Annuity = PMT * [(1 - (1+r)^-n) / r]
    // Monthly real rate = (((1 + postROI) / (1 + inflation)) - 1) / 12
    let realAnnualRate = ((1 + postROI) / (1 + inflation)) - 1;
    const r_monthly = realAnnualRate / 12;
    const n_months = yearsInRetirement * 12;

    let requiredCorpus = 0;
    if (r_monthly === 0) {
        requiredCorpus = futureMonthlyExp * n_months;
    } else {
        // Annuity Due: PV = PMT * [(1 - (1+r)^-n) / r] * (1+r)
        requiredCorpus = futureMonthlyExp * ((1 - Math.pow(1 + r_monthly, -n_months)) / r_monthly) * (1 + r_monthly);
    }

    // Step 3: Projection of Existing Savings
    const projectedSavings = savings * Math.pow(1 + preROI, yearsToRetire);

    // Step 4: Shortfall
    const gap = Math.max(0, requiredCorpus - projectedSavings);

    // Step 5: Required Monthly SIP
    // FV = P * [((1+r)^n - 1) / r] * (1+r)
    // If Step-up is ON, we use a more complex sum or average, but for now simple SIP goal.
    const r_pre_monthly = preROI / 12;
    const n_pre_months = yearsToRetire * 12;

    let requiredSIP = 0;
    if (gap > 0) {
        if (hasStepUp) {
            // Complex Step-up SIP Formula
            // We'll use an iterative approach or a simplified step-growth model
            let low = 0, high = gap;
            for (let i = 0; i < 20; i++) {
                let mid = (low + high) / 2;
                let fv = 0;
                let currentSip = mid;
                for (let y = 0; y < yearsToRetire; y++) {
                    for (let m = 0; m < 12; m++) {
                        fv = (fv + currentSip) * (1 + r_pre_monthly);
                    }
                    currentSip *= (1 + stepUpRate);
                }
                if (fv < gap) low = mid;
                else high = mid;
            }
            requiredSIP = low;
        } else {
            requiredSIP = gap * (r_pre_monthly / (Math.pow(1 + r_pre_monthly, n_pre_months) - 1)) / (1 + r_pre_monthly);
        }
    }

    updateRetirementUI({
        currentExp: expenses,
        futureExp: futureMonthlyExp,
        corpus: requiredCorpus,
        savings: projectedSavings,
        sip: requiredSIP,
        gap: gap,
        yearsToRetire: yearsToRetire,
        isSuperAdvance: isSuperAdvance
    });
}

function updateRetirementUI(data) {
    const fmt = (n) => "\u20B9" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
    const shortFmt = (n) => {
        if (n >= 10000000) return '\u20B9' + (n / 10000000).toFixed(2) + ' Cr';
        if (n >= 100000) return '\u20B9' + (n / 100000).toFixed(2) + ' L';
        return '\u20B9' + (n / 1000).toFixed(0) + ' k';
    };

    const hvForm = document.getElementById('retResHvForm');
    const normalRes = document.getElementById('retResNormalState');
    const superAdvRes = document.getElementById('retResSuperAdvance');

    // 1. Handle Super Advance Toggle
    if (data.isSuperAdvance) {
        if (hvForm) hvForm.style.display = 'none';
        if (normalRes) normalRes.style.display = 'none';
        if (superAdvRes) superAdvRes.style.display = 'flex';
        return; // Work finished for Super Advance
    } else {
        if (superAdvRes) superAdvRes.style.display = 'none';
    }

    // 2. High Value Lead Check
    if (data.currentExp > 100000 || data.corpus > 150000000) {
        if (hvForm) hvForm.style.display = 'block';
        if (normalRes) normalRes.style.display = 'none';
    } else {
        if (hvForm) hvForm.style.display = 'none';
        if (normalRes) normalRes.style.display = 'block';
    }

    // Update Text anyway (even if hidden for stats)
    if (document.getElementById('retResFutureExp')) document.getElementById('retResFutureExp').innerText = fmt(data.futureExp);
    if (document.getElementById('retResProjSavings')) document.getElementById('retResProjSavings').innerText = fmt(data.savings);
    if (document.getElementById('retResTotalCorpus')) document.getElementById('retResTotalCorpus').innerText = shortFmt(data.corpus);
    if (document.getElementById('retResRequiredSIP')) document.getElementById('retResRequiredSIP').innerText = fmt(data.sip);

    // Donut Update
    const donut = document.getElementById('retDonut');
    if (donut) {
        let existingPercent = (data.savings / data.corpus) * 100 || 0;
        if (existingPercent > 100) existingPercent = 100;
        // Amber for gap/total needed, Blue for existing
        donut.style.background = `conic-gradient(#0B63D8 0% ${existingPercent}%, #F59E0B ${existingPercent}% 100%)`;
    }

    // Analysis Text
    const expBase = parseFloat(document.getElementById('retInputExpenses').value) || 50000;
    if (document.getElementById('retGoalAnalysis')) {
        document.getElementById('retGoalAnalysis').innerHTML = `Your current expenses of <strong>${fmt(expBase)}</strong> will inflate to <strong>${fmt(data.futureExp)}/month</strong> in ${data.yearsToRetire} years. You need a corpus of <strong>${shortFmt(data.corpus)}</strong> to sustain this lifestyle.`;
    }
}

// Event Listeners for Retirement
document.addEventListener('DOMContentLoaded', () => {
    const ids = [
        'retInputAge', 'retRangeAge',
        'retInputRetireAge', 'retRangeRetireAge',
        'retInputExpenses', 'retRangeExpenses',
        'retInputSavings', 'retRangeSavings',
        'retInputPreROI', 'retRangePreROI',
        'retInputPostROI', 'retRangePostROI',
        'retInputLife', 'retRangeLife',
        'retInputInflation', 'retRangeInflation',
        'retInputStepUp', 'retRangeStepUp'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Type & Slide Sync
            if (id.includes('Range')) {
                const input = document.getElementById(id.replace('Range', 'Input'));
                el.addEventListener('input', () => { if (input) input.value = el.value; calculateRetirement(); });
            } else if (id.includes('Input')) {
                const range = document.getElementById(id.replace('Input', 'Range'));
                el.addEventListener('input', () => { if (range) range.value = el.value; calculateRetirement(); });
            }
        }
    });

    // Checkboxes
    ['retCheckStepUp', 'retCheckInflation', 'checkRetSuperAdvance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (id === 'retCheckStepUp') {
                    const ctrl = document.getElementById('retStepUpControl');
                    if (ctrl) ctrl.style.display = el.checked ? 'block' : 'none';
                }
                if (id === 'retCheckInflation') {
                    const ctrl = document.getElementById('retInflationControl');
                    if (ctrl) ctrl.style.display = el.checked ? 'block' : 'none';
                }
                calculateRetirement();
            });
        }
    });



});

// ==========================================
// FINANCIAL HEALTH SCORE (FHS) CALCULATOR
// ==========================================

let fhsGaugeChartInstance = null;
let fhsRadarChartInstance = null;
let isFhsInitialized = false;
let fhsInteractedInputs = new Set();

// Format Currency
const formatFhsCurrency = (val) => "\u20B9" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

function openFhsModal() {
    document.getElementById('fhsModalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!isFhsInitialized) {
        initFhsSync();
        isFhsInitialized = true;
    }
    calculateFHS();
}

function closeFhsModal() {
    document.getElementById('fhsModalOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function initFhsSync() {
    const inputs = [
        'Age', 'Income', 'Expenses', 'Emi', 'PassiveIncome',
        'Liquid', 'Invested', 'Equity', 'RealEstate', 'Debt',
        'HealthCover'
    ];

    inputs.forEach(id => {
        const inp = document.getElementById(`fhsInput${id}`);
        const rng = document.getElementById(`fhsRange${id}`);
        // Sync Range -> Input
        rng.addEventListener('input', (e) => {
            fhsInteractedInputs.add(id);
            inp.value = e.target.value;
            calculateFHS();
        });
        // Sync Input -> Range
        inp.addEventListener('input', (e) => {
            fhsInteractedInputs.add(id);
            rng.value = e.target.value || 0;
            calculateFHS();
        });
    });
}

function calculateFHS() {
    // 1. Get Values
    const age = parseFloat(document.getElementById('fhsInputAge').value) || 0;
    const income = parseFloat(document.getElementById('fhsInputIncome').value) || 0;
    const expenses = parseFloat(document.getElementById('fhsInputExpenses').value) || 0;
    const emi = parseFloat(document.getElementById('fhsInputEmi').value) || 0;
    const passiveIncome = parseFloat(document.getElementById('fhsInputPassiveIncome').value) || 0;
    const liquidAssets = parseFloat(document.getElementById('fhsInputLiquid').value) || 0;
    const investedAssets = parseFloat(document.getElementById('fhsInputInvested').value) || 0;
    const equityAssets = parseFloat(document.getElementById('fhsInputEquity').value) || 0;
    const realEstate = parseFloat(document.getElementById('fhsInputRealEstate').value) || 0;
    const debt = parseFloat(document.getElementById('fhsInputDebt').value) || 0;
    const healthCover = parseFloat(document.getElementById('fhsInputHealthCover').value) || 0;

    // --- High Value Form Threshold ---
    const isHighValue =
        income > 250000 ||
        expenses > 150000 ||
        passiveIncome > 150000 ||
        realEstate > 50000000 ||
        debt > 20000000;

    if (isHighValue) {
        document.querySelector('#fhsModalOverlay .sip-results').style.display = 'none';
        document.getElementById('fhsHighValueForm').style.display = 'block';
        const leadForm = document.getElementById('leadCapture-FHS');
        if (leadForm) leadForm.style.display = 'none';
        return; // Stop calculation
    } else {
        document.querySelector('#fhsModalOverlay .sip-results').style.display = 'flex';
        document.getElementById('fhsHighValueForm').style.display = 'none';
        const leadForm = document.getElementById('leadCapture-FHS');
        if (leadForm) leadForm.style.display = 'block';
    }
    // ---------------------------------

    let scores = [];
    let actions = [];

    const addScore = (id, name, score, logic, advice) => {
        scores.push({ id, name, score, fullMark: 100 });
        if (score <= 70) actions.push({ id, name, current: logic, advice });
    };

    // Pillar 1: Emergency Fund
    let efRatio = expenses > 0 ? liquidAssets / expenses : (liquidAssets > 0 ? 99 : 0);
    let efScore = 0;
    if (efRatio >= 6) efScore = 100;
    else if (efRatio >= 3) efScore = 70;
    else if (efRatio >= 1) efScore = 40;
    addScore('ef', 'Emergency Fund', efScore, `${efRatio.toFixed(1)} Months`, 'Build your emergency fund to cover at least 6 months of living expenses using Liquid Funds or FDs.');

    // Pillar 2: Savings Rate
    let savingsRate = income > 0 ? ((income - expenses - emi) / income) * 100 : 0;
    let srScore = 0;
    if (savingsRate >= 30) srScore = 100;
    else if (savingsRate >= 20) srScore = 70;
    else if (savingsRate >= 10) srScore = 40;
    addScore('sr', 'Savings Rate', srScore, `${savingsRate.toFixed(1)}%`, 'Try to save and invest at least 30% of your take-home income by reducing discretionary spending.');

    // Pillar 3: Debt-to-Income
    let dti = income > 0 ? (emi / income) * 100 : (emi > 0 ? 100 : 0);
    let dtiScore = 0;
    if (dti === 0 && emi === 0) dtiScore = 100;
    else if (dti <= 20) dtiScore = 70;
    else if (dti <= 40) dtiScore = 40;
    addScore('dti', 'Debt-to-Income', dtiScore, `${dti >= 100 ? '>100' : dti.toFixed(1)}%`, 'High EMI burden limits wealth creation. Focus on prepaying expensive debt to bring EMIs below 20% of income.');

    // Pillar 4: Solvency
    let solvency = debt > 0 ? (liquidAssets + investedAssets) / debt : 99;
    let solScore = 0;
    if (debt === 0 || solvency >= 2.0) solScore = 100;
    else if (solvency >= 1.5) solScore = 70;
    else if (solvency >= 1.0) solScore = 40;
    addScore('sol', 'Solvency', solScore, `${solvency === 99 ? 'Debt Free' : solvency.toFixed(2)}x`, 'Your liabilities are high compared to financial assets. Focus on debt reduction before aggressively accumulating non-liquid assets.');

    // Pillar 5 Removed: Life Cover

    // Pillar 6: Health Cover
    let hcScore = 0;
    if (healthCover >= 1000000) hcScore = 100;
    else if (healthCover >= 500000) hcScore = 70;
    else if (healthCover > 0) hcScore = 40;
    addScore('hc', 'Health Insurance', hcScore, `${formatFhsCurrency(healthCover)}`, 'Medical inflation is extremely high. Secure at least \u20B910 Lakhs of base health insurance coverage independent of your employer.');

    // Pillar 7: Productive Wealth
    let pwTotal = liquidAssets + investedAssets;
    let pwRatio = pwTotal > 0 ? (investedAssets / pwTotal) * 100 : 0;
    let pwScore = 0;
    if (pwRatio >= 60) pwScore = 100;
    else if (pwRatio >= 40) pwScore = 70;
    else if (pwRatio >= 20) pwScore = 40;
    addScore('pw', 'Productive Wealth', pwScore, `${pwRatio.toFixed(0)}%`, 'You hold too much cash. Deploy idle cash above your emergency fund into productive, return-generating investments.');

    // Pillar 8: Age-to-Wealth
    let actualNw = (liquidAssets + investedAssets + realEstate) - debt;
    let targetNw = (age * (income * 12)) / 10;
    let awRatio = targetNw > 0 ? actualNw / targetNw : (actualNw > 0 ? 1 : 0);
    let awScore = 0;
    if (awRatio >= 1.0) awScore = 100;
    else if (awRatio >= 0.5) awScore = 70;
    else if (awRatio >= 0.1) awScore = 40;
    addScore('aw', 'Age-to-Wealth', awScore, `${(awRatio * 100).toFixed(0)}% of Target`, 'Your current net worth is below the target for your age and income. You need to aggressively increase your savings rate and investment returns.');

    // Pillar 9: FIRE Ratio
    let fireRatio = expenses > 0 ? passiveIncome / expenses : (passiveIncome > 0 ? 1 : 0);
    let fireScore = 0;
    if (fireRatio >= 1.0) fireScore = 100;
    else if (fireRatio >= 0.5) fireScore = 70;
    else if (fireRatio >= 0.1) fireScore = 40;
    addScore('fire', 'F.I.R.E Ratio', fireScore, `${(fireRatio * 100).toFixed(0)}% of Expenses`, 'Focus on building dividend, interest, or rental income streams to cover your living expenses for true financial independence.');

    // Pillar 10: Age-Adjusted Equity
    let actualEq = investedAssets > 0 ? (Math.min(equityAssets, investedAssets) / investedAssets) * 100 : 0;
    let targetEq = Math.max(0, 100 - age); // Floor at 0
    let eqDiff = Math.abs(actualEq - targetEq);
    let eqScore = 0;
    if (eqDiff <= 10) eqScore = 100;
    else if (eqDiff <= 25) eqScore = 70;
    else if (eqDiff <= 40) eqScore = 40;
    addScore('eq', 'Asset Allocation', eqScore, `${actualEq.toFixed(0)}% (Target: ${targetEq}%)`, 'Your equity allocation deviates significantly from the "100-Age" rule. Rebalance your portfolio to align with your risk capacity.');

    // Pillar 11: Real Estate Concentration
    let reRatio = actualNw > 0 ? (realEstate / actualNw) * 100 : (realEstate > 0 ? 100 : 0);
    let reScore = 0;
    if (reRatio <= 50) reScore = 100;
    else if (reRatio <= 69) reScore = 70;
    else if (reRatio <= 85) reScore = 40;
    addScore('re', 'Real Estate Conc.', reScore, `${reRatio.toFixed(0)}%`, 'Your net worth is heavily blocked in illiquid physical real estate. Diversify into financial assets (equities/bonds).');

    // Pillar 12: Needs Ratio
    let needsRatio = income > 0 ? ((expenses + emi) / income) * 100 : 100;
    let nsScore = 0;
    if (needsRatio <= 50) nsScore = 100;
    else if (needsRatio <= 65) nsScore = 70;
    else if (needsRatio <= 80) nsScore = 40;
    addScore('ns', 'Needs Ratio', nsScore, `${needsRatio.toFixed(0)}%`, 'Your mandatory expenses (needs and EMIs) are consuming too much of your income. Look for lifestyle deflation opportunities.');

    // Extract Arrays for Chart.js
    const radarLabels = scores.map(s => s.name);
    const radarData = scores.map(s => s.score);

    const sum = radarData.reduce((a, b) => a + b, 0);
    const finalScore = Math.round(sum / 11); // Changed to 11 Pillars

    let badge = "CRITICAL";
    let color = "#EF4444"; // Red
    if (finalScore >= 80) { badge = "EXCELLENT"; color = "#10B981"; }
    else if (finalScore >= 60) { badge = "GOOD"; color = "#F59E0B"; }
    else if (finalScore >= 40) { badge = "NEEDS ATTENTION"; color = "#F97316"; }

    // Update UI DOM
    document.getElementById('fhsScoreDisplay').innerText = finalScore;
    document.getElementById('fhsScoreDisplay').style.color = color;

    const badgeEl = document.getElementById('fhsStatusBadge');
    badgeEl.innerText = badge;
    badgeEl.style.backgroundColor = color + '20';
    badgeEl.style.color = color;

    // Render Action Plan (Synthesized Conversational Summary)
    const actionContainer = document.getElementById('fhsActionPlanContainer');

    if (fhsInteractedInputs.size < 5) {
        let remaining = 5 - fhsInteractedInputs.size;
        actionContainer.innerHTML = `
            <div style="font-size: 0.95rem; color: #6b7280; line-height: 1.6; padding: 20px; text-align: center; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">
                <div style="font-size: 2rem; margin-bottom: 8px;">🎚️</div>
                <div style="font-weight: 500; color: #4b5563;">Personalizing your plan...</div>
                Adjust ${remaining} more slider${remaining > 1 ? 's' : ''} to reveal your customized financial action plan.
            </div>
        `;
    } else if (finalScore >= 90 && actions.length === 0) {
        actionContainer.innerHTML = `
            <div style="font-size: 0.95rem; color: #374151; line-height: 1.6; padding: 10px;">
                You are in an incredibly strong financial position. Your emergency reserves are fully funded, your savings rate is excellent, and your debt is completely under control. Your investments are growing efficiently with the right asset allocation for your age. The plan now is simply to stay the course, avoid lifestyle inflation, and let compounding do the heavy lifting over the next decade!
            </div>
        `;
    } else {
        // Build conversational summary based on weak pillars
        let summaryText = "<p style='margin-bottom: 12px; font-weight: 500;'>Here is what you need to focus on to improve your financial health:</p><ul style='margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 10px;'>";

        const weakIds = actions.map(a => a.id);

        // Immediate Risks
        if (weakIds.includes('ef') || weakIds.includes('hc')) {
            summaryText += "<li><strong style='color: #EF4444;'>Secure your foundation:</strong> You urgently need to build a cash emergency fund and ensure you have adequate health insurance coverage to protect against unexpected medical shocks.</li>";
        }

        // Debt Issues
        if (weakIds.includes('dti') || weakIds.includes('sol') || weakIds.includes('ns')) {
            summaryText += "<li><strong style='color: #F97316;'>Reduce your debt burden:</strong> Your mandatory expenses and EMIs are consuming too much of your income. Focus aggressively on prepaying high-interest debt to free up monthly cash flow.</li>";
        }

        // Wealth & Accumulation
        if (weakIds.includes('sr') || weakIds.includes('aw')) {
            summaryText += "<li><strong style='color: #F59E0B;'>Accelerate your wealth:</strong> Your accumulation is slightly behind schedule. Tighten your discretionary spending aiming to push your savings rate above 20-30% of your take-home pay.</li>";
        }

        // Asset Allocation
        if (weakIds.includes('pw') || weakIds.includes('eq') || weakIds.includes('re')) {
            summaryText += "<li><strong style='color: #3B82F6;'>Optimize capital allocation:</strong> Ensure you aren't holding too much idle cash or locking all your net worth into illiquid physical real estate. Channel funds into compounding assets like equities.</li>";
        }

        // Independence
        if (weakIds.includes('fire')) {
            summaryText += "<li><strong style='color: #8B5CF6;'>Build passive income:</strong> Ultimately, your goal is financial independence. Focus on building passive streams (like dividends or rental yields) until they can fully cover your baseline living expenses.</li>";
        }

        summaryText += "</ul>";

        actionContainer.innerHTML = `
            <div style="font-size: 0.95rem; color: #374151; line-height: 1.6; padding: 10px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${summaryText}
            </div>
        `;
    }

    // UPDATE CHARTS
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded yet.");
        return;
    }

    // 1. Gauge Chart (Doughnut Half)
    const gaugeCtx = document.getElementById('fhsGaugeChart').getContext('2d');
    if (fhsGaugeChartInstance) fhsGaugeChartInstance.destroy();
    fhsGaugeChartInstance = new Chart(gaugeCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [finalScore, 100 - finalScore],
                backgroundColor: [color, '#f3f4f6'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            cutout: '80%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { tooltip: { enabled: false }, legend: { display: false } }
        }
    });

    // 2. Radar Chart
    const radarCtx = document.getElementById('fhsRadarChart').getContext('2d');
    if (fhsRadarChartInstance) fhsRadarChartInstance.destroy();
    fhsRadarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'Score',
                data: radarData,
                backgroundColor: color + '40', // 40 hex opacity
                borderColor: color,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: '#e5e7eb' },
                    grid: { color: '#e5e7eb' },
                    pointLabels: { color: '#6b7280', font: { size: 9 } },
                    ticks: { display: false, min: 0, max: 100 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================
// COMMON FINANCIAL MISTAKES CALCULATOR LOGIC
// ==========================================

let isCfmInitialized = false;
let cfmInteractedInputs = new Set();
let isCfmRevealed = false;

function openCfmModal() {
    document.getElementById('cfmModalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!isCfmInitialized) {
        initCfmSync();
        isCfmInitialized = true;
    }
    calculateCFM();
}

function closeCfmModal() {
    document.getElementById('cfmModalOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function initCfmSync() {
    const inputs = [
        'Age', 'Income', 'IdleCash', 'DailySpend', 'Sip',
        'Gadget', 'Discount', 'Fee'
    ];

    inputs.forEach(id => {
        const inp = document.getElementById(`cfmInput${id}`);
        const rng = document.getElementById(`cfmRange${id}`);

        rng.addEventListener('input', (e) => {
            cfmInteractedInputs.add(id);
            inp.value = e.target.value;
            calculateCFM();
        });

        inp.addEventListener('input', (e) => {
            cfmInteractedInputs.add(id);
            rng.value = e.target.value || 0;
            calculateCFM();
        });
    });
}

function resetCfmToRegular() {
    document.getElementById('cfmResultsArea').style.display = 'flex';
    document.getElementById('cfmHighValueForm').style.display = 'none';
}

function calculateCFM() {
    // 1. Get Values
    const age = parseFloat(document.getElementById('cfmInputAge').value) || 0;
    const income = parseFloat(document.getElementById('cfmInputIncome').value) || 0;
    const idleCash = parseFloat(document.getElementById('cfmInputIdleCash').value) || 0;
    const dailySpend = parseFloat(document.getElementById('cfmInputDailySpend').value) || 0;
    const sip = parseFloat(document.getElementById('cfmInputSip').value) || 0;

    // Advance Options
    const gadget = parseFloat(document.getElementById('cfmInputGadget').value) || 0;
    const discount = parseFloat(document.getElementById('cfmInputDiscount').value) || 0;
    const fee = parseFloat(document.getElementById('cfmInputFee').value) || 0;

    // High Value Check
    const isHighValue =
        income > 200000 ||
        idleCash > 2000000 ||
        sip > 50000 ||
        gadget > 1000000;

    if (isHighValue) {
        document.querySelector('#cfmResultsArea').style.display = 'none';
        document.getElementById('cfmHighValueForm').style.display = 'block';
        const leadForm = document.getElementById('leadCapture-CFM');
        if (leadForm) leadForm.style.display = 'none';
        return;
    } else {
        document.getElementById('cfmResultsArea').style.display = 'flex';
        document.getElementById('cfmHighValueForm').style.display = 'none';
        const leadForm = document.getElementById('leadCapture-CFM');
        if (leadForm) leadForm.style.display = 'block';
    }

    // Mathematical Helpers
    const formatCurr = (val) => "\u20B9" + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

    // Pillar 1: Lazy Money Math (Inflation Decay)
    const lazyText = document.getElementById('cfmTextLazy');
    if (!cfmInteractedInputs.has('Income') && !cfmInteractedInputs.has('IdleCash')) {
        lazyText.innerHTML = `<span style="color: #f87171; font-style: italic;">Adjust <strong>Monthly Take-Home</strong> or <strong>Idle Cash</strong> slider to reveal.</span>`;
    } else {
        const protectedCash = income * 6;
        const lazyCash = Math.max(0, idleCash - protectedCash);
        const lazyFuture = lazyCash / Math.pow(1.06, 10);

        if (lazyCash === 0) {
            lazyText.innerHTML = `You are highly efficient! Your <strong>${formatCurr(idleCash)}</strong> is within the safe 6-month buffer zone.`;
        } else {
            const lazyFuture = lazyCash / Math.pow(1.06, 10);
            lazyText.innerHTML = `You have a 6-month buffer of <strong>${formatCurr(protectedCash)}</strong>, but your excess <strong>${formatCurr(lazyCash)}</strong> is shrinking. In 10 years, it will only buy <strong>${formatCurr(lazyFuture)}</strong> worth of goods.`;
        }
    }

    // Pillar 2: Daily Leak Math (10-Year Opportunity Cost)
    const leakText = document.getElementById('cfmTextLeak');
    if (!cfmInteractedInputs.has('DailySpend')) {
        leakText.innerHTML = `<span style="color: #fb923c; font-style: italic;">Adjust <strong>Daily Unessential Spend</strong> slider to reveal.</span>`;
    } else {
        const monthlyLeak = (dailySpend * 365) / 12;
        // FV of Monthly SIP over 10 years at 12%
        // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
        const r = 0.12 / 12;
        const n = 10 * 12;
        const leakWealthLost = monthlyLeak > 0 ? monthlyLeak * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : 0;

        if (dailySpend === 0) {
            leakText.innerHTML = `Zero unessential daily spend! Your discipline will compound massively over time.`;
        } else {
            leakText.innerHTML = `Your <strong>${formatCurr(dailySpend)}</strong>/day habit is a silent killer. Redirecting this to a SIP would yield <strong>${formatCurr(leakWealthLost)}</strong> in 10 years.`;
        }
    }

    // Pillar 3: Procrastination Cost
    const lateText = document.getElementById('cfmTextLate');
    if (!cfmInteractedInputs.has('Sip') || !cfmInteractedInputs.has('Age')) {
        lateText.innerHTML = `<span style="color: #f87171; font-style: italic;">Adjust <strong>Age</strong> and <strong>Monthly SIP Capacity</strong> sliders to reveal.</span>`;
    } else {
        // Compare SIP from Age to 60 vs (Age+1) to 60 at 12%
        const yearsLeftNow = Math.max(0, 60 - age);
        const yearsLeftLater = Math.max(0, 60 - (age + 1));
        const r = 0.12 / 12; // defined again in scope

        const fvNow = sip > 0 && yearsLeftNow > 0 ? sip * ((Math.pow(1 + r, yearsLeftNow * 12) - 1) / r) * (1 + r) : 0;
        const fvLater = sip > 0 && yearsLeftLater > 0 ? sip * ((Math.pow(1 + r, yearsLeftLater * 12) - 1) / r) * (1 + r) : 0;
        const totalPenalty = fvNow - fvLater;

        if (age >= 60 || sip === 0) {
            lateText.innerHTML = `No procrastination penalty applicable. Make sure you're investing something!`;
        } else {
            lateText.innerHTML = `Waiting just 12 months to start your SIP will permanently cost you <strong>${formatCurr(totalPenalty)}</strong> by age 60.`;
        }
    }

    // Pillar 4: No-Cost EMI Trap
    const emiText = document.getElementById('cfmTextEmi');
    if (!cfmInteractedInputs.has('Gadget') || !cfmInteractedInputs.has('Discount') || !cfmInteractedInputs.has('Fee')) {
        emiText.innerHTML = `<span style="color: #fb923c; font-style: italic;">Adjust all <strong>Advance EMI Option</strong> sliders to reveal.</span>`;
    } else {
        // Total = Foregone Discount + Processing Fee + GST (18%) on the Bank Interest
        // Note: Assuming Interest Amount = Foregone Cash Discount
        const gstOnInterest = discount * 0.18;
        const totalHiddenCost = discount + fee + gstOnInterest;

        if (totalHiddenCost === 0) {
            emiText.innerHTML = `You are a savvy buyer! No hidden fees or lost discounts detected.`;
        } else {
            emiText.innerHTML = `That 'free' EMI is a trap. Between fees and lost discounts, you are actually paying an extra <strong>${formatCurr(totalHiddenCost)}</strong> for this gadget.`;
        }
    }
}

// --- Calculator Lead Capture Logic ---
window.submitCalculatorLead = function (calcType) {
    const nameEl = document.getElementById('lcName-' + calcType);
    const emailEl = document.getElementById('lcEmail-' + calcType);
    const phoneEl = document.getElementById('lcPhone-' + calcType);
    const btn = document.getElementById('lcBtn-' + calcType);
    const successMsg = document.getElementById('lcSuccess-' + calcType);

    if (!nameEl || !emailEl || !phoneEl) return;

    // Helper to toggle visual error
    const setError = (el, isValid, msg) => {
        const errorSpan = el.nextElementSibling;
        if (!isValid) {
            el.style.borderColor = '#dc2626';
            if (errorSpan && errorSpan.classList.contains('lc-error')) {
                errorSpan.textContent = msg;
                errorSpan.style.display = 'block';
            }
        } else {
            el.style.borderColor = '#ddd';
            if (errorSpan && errorSpan.classList.contains('lc-error')) {
                errorSpan.style.display = 'none';
            }
        }
    };

    // Add real-time clear + blur validation listeners once
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    [nameEl, emailEl, phoneEl].forEach(el => {
        if (!el.dataset.listenerAdded) {
            // Clear error as user types
            el.addEventListener('input', () => setError(el, true));

            // Live validation on blur
            el.addEventListener('blur', () => {
                const val = el.value.trim();
                if (el === emailEl) {
                    if (!val) {
                        setError(el, false, 'Email required');
                    } else if (!emailRegex.test(val)) {
                        setError(el, false, 'Invalid email (e.g. name@domain.com)');
                    } else {
                        setError(el, true);
                    }
                } else if (el === phoneEl) {
                    if (!val) {
                        setError(el, false, 'Mobile required');
                    } else if (!phoneRegex.test(val)) {
                        setError(el, false, '10-digit number required');
                    } else {
                        setError(el, true);
                    }
                }
            });

            el.dataset.listenerAdded = 'true';
        }
    });

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    let hasError = false;

    // 1. Name Validation
    if (!name) {
        setError(nameEl, false, "Name required");
        hasError = true;
    }

    // 2. Email Validation
    if (!email) {
        setError(emailEl, false, "Email required");
        hasError = true;
    } else if (!emailRegex.test(email)) {
        setError(emailEl, false, "Invalid email format");
        hasError = true;
    }

    // 3. Mobile Validation
    if (!phone) {
        setError(phoneEl, false, "Mobile required");
        hasError = true;
    } else if (!phoneRegex.test(phone)) {
        setError(phoneEl, false, "10-digit number required");
        hasError = true;
    }

    if (hasError) return;

    let description = `User requested a copy of their ${calcType} calculation.\n\n`;
    description += `--- CALCULATOR INPUTS & RESULTS ---\n`;

    try {
        if (calcType === 'SIP') {
            const isSA = document.getElementById('checkSuperAdvance') && document.getElementById('checkSuperAdvance').checked;
            const isStepUp = document.getElementById('checkStepUp') && document.getElementById('checkStepUp').checked;
            const isInflation = document.getElementById('checkInflation') && document.getElementById('checkInflation').checked;
            const isGoalReality = document.getElementById('sipCheckGoalReality') && document.getElementById('sipCheckGoalReality').checked;

            description += `MODE: ${isSA ? 'Super Advance' : 'Normal'}\n`;
            if (isSA) {
                description += `Target Goal: ₹${document.getElementById('inputGoalAmount').value}\n`;
                description += `Monthly SIP Required: ${document.getElementById('resMonthlySipVal').innerText}\n`;
            } else {
                description += `Monthly Investment: ₹${document.getElementById('inputInvestment').value}\n`;
            }
            description += `Expected Return: ${document.getElementById('inputRate').value}%\n`;
            description += `Time Period: ${document.getElementById('inputYears').value} Yr\n`;

            description += `Step-up: ${isStepUp ? document.getElementById('inputStepUp').value + '%' : 'No'}\n`;
            description += `Inflation Adj: ${isInflation ? document.getElementById('inputInflation').value + '%' : 'No'}\n`;

            if (isSA && isGoalReality) {
                description += `--- Reality Check ---\n`;
                description += `Current Portfolio: ₹${document.getElementById('inputCurrentPortfolio').value}\n`;
                description += `Existing SIP: ₹${document.getElementById('inputExistingSip').value}\n`;
                description += `Shortfall: ${document.getElementById('resShortfall').innerText}\n`;
                description += `Extra SIP Needed: ${document.getElementById('resExtraSipNeeded').innerText}\n`;
            }

            description += `--- FINAL RESULTS ---\n`;
            description += `Invested Amount: ${document.getElementById('resInvested').innerText}\n`;
            description += `Est. Returns: ${document.getElementById('resGained').innerText}\n`;
            description += `Total Value: ${document.getElementById('resTotalValueBottom').innerText}\n`;

        } else if (calcType === 'SWP') {
            const isSA = document.getElementById('checkSwpSuperAdvance') && document.getElementById('checkSwpSuperAdvance').checked;
            const isStepUp = document.getElementById('swpCheckStepUp') && document.getElementById('swpCheckStepUp').checked;
            const isInflation = document.getElementById('swpCheckInflation') && document.getElementById('swpCheckInflation').checked;

            description += `MODE: ${isSA ? 'Super Advance (Dual Cashflow)' : 'Normal'}\n`;
            if (isSA) {
                description += `Time Horizon: ${document.getElementById('swpAdvInputTime').value} Yr\n`;
                description += `Target Goal: ₹${document.getElementById('swpAdvInputGoal').value}\n`;
                description += `Annual Withdrawal: ₹${document.getElementById('swpAdvInputWithdrawal').value}\n`;
                description += `Existing Savings: ₹${document.getElementById('swpAdvInputSavings').value}\n`;
                description += `Expected Return: ${document.getElementById('swpAdvInputReturn').value}%\n`;
                description += `Required Monthly SIP: ${document.getElementById('resSwpAdvRequiredSip').innerText}\n`;

                const isSipStep = document.getElementById('swpAdvCheckStepUpSip') && document.getElementById('swpAdvCheckStepUpSip').checked;
                const isSwpStep = document.getElementById('swpAdvCheckStepUpSwp') && document.getElementById('swpAdvCheckStepUpSwp').checked;
                const isAdvInf = document.getElementById('swpAdvCheckInflation') && document.getElementById('swpAdvCheckInflation').checked;

                description += `SIP Step-up: ${isSipStep ? document.getElementById('swpAdvInputStepUpSip').value + '%' : 'No'}\n`;
                description += `SWP Step-up: ${isSwpStep ? document.getElementById('swpAdvInputStepUpSwp').value + '%' : 'No'}\n`;
                description += `Inflation: ${isAdvInf ? document.getElementById('swpAdvInputInflation').value + '%' : 'No'}\n`;

                description += `--- RESULTS ---\n`;
                description += `Total Invested: ${document.getElementById('resSwpAdvTotalInvested').innerText}\n`;
                description += `Total Withdrawn: ${document.getElementById('resSwpAdvTotalWithdrawn').innerText}\n`;
                description += `Final Corpus: ${document.getElementById('resSwpAdvFinalCorpus').innerText}\n`;
            } else {
                description += `Total Investment: ₹${document.getElementById('swpInputInvestment').value}\n`;
                description += `Monthly Withdrawal: ₹${document.getElementById('swpInputWithdrawal').value}\n`;
                description += `Expected Return: ${document.getElementById('swpInputRate').value}%\n`;
                description += `Time Period: ${document.getElementById('swpInputYears').value} Yr\n`;
                description += `Step-up: ${isStepUp ? document.getElementById('swpInputStepUp').value + '%' : 'No'}\n`;
                description += `Inflation Adj: ${isInflation ? document.getElementById('swpInputInflation').value + '%' : 'No'}\n`;
                description += `Final Balance: ${document.getElementById('swpResFinalBalanceBottom').innerText}\n`;
                description += `Returns Earned: ${document.getElementById('swpResReturnsEarned').innerText}\n`;
            }
        } else if (calcType === 'Loan') {
            description += `Outstanding Loan: ₹${document.getElementById('loanInputBalance').value}\n`;
            description += `Interest Rate: ${document.getElementById('loanInputRate').value}%\n`;
            description += `Pending Tenure: ${document.getElementById('loanInputTenure').value} Mo\n`;
            description += `Extra EMI: ₹${document.getElementById('loanInputExtraEmi').value} (${document.getElementById('loanExtraEmiFreq').value})\n`;
            description += `Benefit Type: ${document.getElementById('loanPrepayBenefit').value}\n`;
            description += `--- RESULTS ---\n`;
            description += `Total Interest Saved: ${document.getElementById('loanResInterestSaved').innerText}\n`;
            description += `New Tenure: ${document.getElementById('loanResNewTenureVal').innerText}\n`;
            description += `Smart EMI: ${document.getElementById('loanResNewEMI').innerText}\n`;
        } else if (calcType === 'Retirement') {
            description += `Current Age: ${document.getElementById('retInputAge').value}\n`;
            description += `Retirement Age: ${document.getElementById('retInputRetireAge').value}\n`;
            description += `Life Expectancy: ${document.getElementById('retInputLife').value} Yr\n`;
            description += `Monthly Expenses: ₹${document.getElementById('retInputExpenses').value}\n`;
            description += `Existing Savings: ₹${document.getElementById('retInputSavings').value}\n`;
            description += `Expected Returns: ${document.getElementById('retInputPreROI').value}% (Pre) / ${document.getElementById('retInputPostROI').value}% (Post)\n`;
            description += `Inflation: ${document.getElementById('retInputInflation').value}%\n`;
            description += `Annual Step-up: ${document.getElementById('retCheckStepUp').checked ? document.getElementById('retInputStepUp').value + '%' : 'No'}\n`;
            description += `--- RESULTS ---\n`;
            description += `Corpus Required: ${document.getElementById('retResTotalCorpus').innerText}\n`;
            description += `Est. Monthly SIP: ${document.getElementById('retResRequiredSIP').innerText}\n`;
        } else if (calcType === 'FHS') {
            description += `FinNomy Score: ${document.getElementById('fhsScoreDisplay').innerText}/100\n`;
            description += `Age: ${document.getElementById('fhsInputAge').value}\n`;
            description += `Monthly Income: ₹${document.getElementById('fhsInputIncome').value}\n`;
            description += `Expenses: ₹${document.getElementById('fhsInputExpenses').value}\n`;
            description += `EMIs: ₹${document.getElementById('fhsInputEmi').value}\n`;
            description += `Passive Income: ₹${document.getElementById('fhsInputPassiveIncome').value}\n`;
            description += `Liquid Assets: ₹${document.getElementById('fhsInputLiquid').value}\n`;
            description += `Invested Assets: ₹${document.getElementById('fhsInputInvested').value}\n`;
            description += `Equity: ₹${document.getElementById('fhsInputEquity').value}\n`;
            description += `Real Estate: ₹${document.getElementById('fhsInputRealEstate').value}\n`;
            description += `Debt: ₹${document.getElementById('fhsInputDebt').value}\n`;
            description += `Health Cover: ₹${document.getElementById('fhsInputHealthCover').value}\n`;
        } else if (calcType === 'CFM') {
            description += `Age: ${document.getElementById('cfmInputAge').value}\n`;
            description += `Monthly Income: ₹${document.getElementById('cfmInputIncome').value}\n`;
            description += `Idle Cash: ₹${document.getElementById('cfmInputIdleCash').value}\n`;
            description += `Daily Unessential Spend: ₹${document.getElementById('cfmInputDailySpend').value}\n`;
            description += `Monthly SIP Capacity: ₹${document.getElementById('cfmInputSip').value}\n`;
            description += `Next Gadget Price: ₹${document.getElementById('cfmInputGadget').value}\n`;
            description += `--- RESULTS ---\n`;
            description += `Lazy Money Trap: ${document.getElementById('cfmTextLazy').innerText}\n`;
            description += `Small Daily Leak: ${document.getElementById('cfmTextLeak').innerText}\n`;
            description += `Yearly Cost of Delay: ${document.getElementById('cfmTextLate').innerText}\n`;
            description += `The "No-Cost" Trap: ${document.getElementById('cfmTextEmi').innerText}\n`;
        } else if (calcType === 'MGSE') {
            description += `Monthly Income: ₹${document.getElementById('mgseIncome').value}\n`;
            description += `Monthly Expenses: ₹${document.getElementById('mgseExpenses').value}\n`;
            description += `Returns: ${document.getElementById('mgseReturns').value}% / Inflation: ${document.getElementById('mgseInflation').value}%\n`;
            description += `Portfolio Health: ${document.getElementById('mgseHealthPercentage').innerText}\n`;
            description += `Total Goal Cost (Today): ${document.getElementById('mgseTotalRequiredSip').innerText}\n`;
            description += `FinNomy Fix: ${document.getElementById('mgseFinnomyFixText').innerText}\n`;
        }
    } catch (e) {
        description += `(Could not extract all specific fields: ${e.message})\n`;
    }

    const formData = {
        name: name,
        company: '',
        email: email,
        mobile: phone,
        social: '',
        website: '',
        service: `Calculator Report Request - ${calcType}`,
        description: description
    };

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztbbWZMcmYxBelEOnD2mPmE7zC8ZcN-vqas2B9-HLUG1Btp7k-yn-EFBZ8fJu0DYXV/exec';

    const originalText = btn.textContent;
    btn.textContent = "Sending...";
    btn.disabled = true;

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(formData)
    })
        .then(() => {
            btn.style.display = 'none';
            if (successMsg) successMsg.style.display = 'flex';
        })
        .catch(error => {
            console.error('Submission Error:', error);
            if (btn) {
                btn.textContent = "Submission Error";
                setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
            }
            btn.textContent = originalText;
            btn.disabled = false;
        });
};

// --- EmailJS Dashboard Report Logic ---
window.sendDashboardReport = function(calcType) {
    const btn = document.getElementById(`btn${calcType.charAt(0).toUpperCase() + calcType.slice(1)}Report`);
    const feedback = document.getElementById(`${calcType}EmailFeedback`);
    const emailInput = document.getElementById(`${calcType}Email`);
    const userEmail = emailInput ? emailInput.value.trim() : "";
    
    if (!userEmail || !userEmail.includes('@')) {
        if (feedback) {
            feedback.style.display = 'block';
            feedback.style.color = '#dc2626';
            feedback.innerText = "Please enter a valid email address.";
        }
        return;
    }

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "⏳ Sending...";
    if (feedback) feedback.style.display = 'none';

    // Collect data based on calculator type
    let calculatorData = {
        user_name: userEmail.split('@')[0], // Fallback name
        user_email: userEmail,
        calculator_name: "",
        total_investment: "0",
        returns_earned: "0",
        total_wealth: "0",
        advisor_fix: ""
    };

    try {
        if (calcType === 'sip') {
            calculatorData.calculator_name = "Magic of SIP ✨";
            calculatorData.total_investment = document.getElementById('sipResTotalInvest').innerText.replace(/[₹,]/g, '');
            calculatorData.returns_earned = document.getElementById('sipResReturnsEarned').innerText.replace(/[₹,]/g, '');
            calculatorData.total_wealth = document.getElementById('sipResTotalWealth').innerText.replace(/[₹,]/g, '');
        } else if (calcType === 'swp') {
            calculatorData.calculator_name = "SWP Wisdom 💎";
            calculatorData.total_investment = document.getElementById('swpResTotalInvest').innerText.replace(/[₹,]/g, '');
            calculatorData.returns_earned = document.getElementById('swpResReturnsEarned').innerText.replace(/[₹,]/g, '');
            calculatorData.total_wealth = document.getElementById('swpResFinalBalance').innerText.replace(/[₹,]/g, '');
        } else if (calcType === 'ret') {
            calculatorData.calculator_name = "Retirement Journey 🚀";
            calculatorData.total_investment = document.getElementById('retResTotalCorpus').innerText.replace(/[₹,]/g, '');
            calculatorData.returns_earned = document.getElementById('retResRequiredSIP').innerText.replace(/[₹,]/g, ''); // Using SIP as second stat
            calculatorData.total_wealth = document.getElementById('retResTotalCorpus').innerText.replace(/[₹,]/g, '');
        } else if (calcType === 'mgse') {
            calculatorData.calculator_name = "Multi-Goal Roadmap 🗺️";
            calculatorData.total_investment = document.getElementById('mgseTotalRequiredSip').innerText.replace(/[₹,]/g, '');
            calculatorData.returns_earned = document.getElementById('mgseHealthPercentage').innerText;
            calculatorData.total_wealth = document.getElementById('resSwpAdvFinalCorpus').innerText.replace(/[₹,]/g, '');
            calculatorData.advisor_fix = document.getElementById('mgseFinnomyFixText').innerText;
        }

        // Add Indian Comma formatting back for the email display
        const fmt = (num) => parseFloat(num).toLocaleString('en-IN');
        calculatorData.total_investment = fmt(calculatorData.total_investment);
        calculatorData.returns_earned = calculatorData.returns_earned.includes('%') ? calculatorData.returns_earned : fmt(calculatorData.returns_earned);
        calculatorData.total_wealth = fmt(calculatorData.total_wealth);

    } catch (e) {
        console.error("Error collecting calculator data:", e);
    }

    emailjs.send("service_finnomy", "template_finnomy", calculatorData)
        .then(() => {
            btn.innerHTML = "✅ Sent!";
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.color = '#059669';
                feedback.innerText = "Dashboard sent successfully!";
            }
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 5000);
        })
        .catch((error) => {
            console.error("EmailJS Error:", error);
            btn.innerHTML = "❌ Failed";
            if (feedback) {
                feedback.style.display = 'block';
                feedback.style.color = '#dc2626';
                feedback.innerText = "Error sending report. Please try again.";
            }
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 3000);
        });
};

document.addEventListener('DOMContentLoaded', () => {

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
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Navbar Scroll Effect
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
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
            let msg = "Growth requires patience — we’re working behind the scenes."; // Default fallback

            // Determine message based on section context
            if (section) {
                const id = section.id;
                if (id === 'services') {
                    msg = "We’re carefully shaping our services to bring you financial clarity.";
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

            // 4. Services, Calculators, Insights -> Trigger Toast with Specific Messages
            attachToast(links.services, "We’re carefully shaping our services to bring you financial clarity.");
            attachToast(links.calculators, "Smart calculations take careful design. Coming soon.");
            attachToast(links.insights, "Clarity begins with understanding. Insights are on the way.");
        }
    };

    // Run Navigation Logic
    manageNavigation();

});


// --- GLOBAL MODAL FUNCTIONS (Must be accessible via HTML onclick) ---
window.openConnectModal = function () {
    const modal = document.getElementById('connectModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        // Reset to form view if opened again
        const headerWrapper = document.querySelector('#connectModalOverlay .modal-header-wrapper') || document.querySelector('.modal-header-wrapper');
        const scrollContent = document.querySelector('#connectModalOverlay .modal-scroll-content') || document.querySelector('.modal-scroll-content');

        if (headerWrapper) headerWrapper.style.display = 'block';
        if (scrollContent) scrollContent.style.display = 'block';
        if (document.getElementById('successScreen')) document.getElementById('successScreen').style.display = 'none';
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

window.openPrivacyModal = function () {
    const modal = document.getElementById('privacyModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.closePrivacyModal = function () {
    const modal = document.getElementById('privacyModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.openTermsModal = function () {
    const modal = document.getElementById('termsModalOverlay');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.closeTermsModal = function () {
    const modal = document.getElementById('termsModalOverlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Global Click for Closing Modals
window.onclick = function (event) {
    const connectModal = document.getElementById('connectModalOverlay');
    const partnerModal = document.getElementById('partnerModalOverlay');
    const privacyModal = document.getElementById('privacyModalOverlay');
    const termsModal = document.getElementById('termsModalOverlay');
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
                        alert("There was a problem submitting your form. Please try again.");
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
                        alert("There was a problem submitting your form. Please try again.");
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

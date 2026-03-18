/* FinNomy Services JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Loader Handling
    const loader = document.querySelector('.finnomy-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }, 800);
        });
    }

    // 2. Animate Cards on Scroll
    const animateCards = () => {
        const cards = document.querySelectorAll('.service-card');
        const triggerBottom = window.innerHeight * 0.8;

        cards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            if (cardTop < triggerBottom) {
                card.classList.add('animate');
            }
        });
    };

    window.addEventListener('scroll', animateCards);
    animateCards(); // Initial check


    // 3. Connect Modal Logic (Delegated to main.js for standard Nomy Connect Modal)
    /*
    const overlay = document.getElementById('connect-modal-overlay');
    ...
    */
});

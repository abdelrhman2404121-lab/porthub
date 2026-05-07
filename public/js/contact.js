// public/js/contact.js — Contact page
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const name    = document.getElementById('contact-name')?.value.trim();
        const email   = document.getElementById('contact-email')?.value.trim();
        const message = document.getElementById('contact-message')?.value.trim();

        if (!name || !email || !message) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        const submitBtn      = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

        // For now, simulate success (no backend email route needed).
        // To wire up a real email service (e.g. Nodemailer), add a POST /api/contact route.
        setTimeout(() => {
            showNotification('Message sent! We\'ll get back to you soon.');
            form.reset();
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
        }, 800);
    });
});

// public/js/login.js — Login page logic
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isLoggedIn()) {
        const u = getCurrentUser();
        window.location.href = u && u.role === 'admin' ? '/admin.html' : '/dashboard.html';
        return;
    }

    const form         = document.getElementById('login-form');
    const emailInput   = document.getElementById('login-email');
    const passwordInput= document.getElementById('login-password');
    const emailError   = document.getElementById('email-error');
    const passwordError= document.getElementById('password-error');
    const generalError = document.getElementById('general-error');
    const submitBtn    = form.querySelector('button[type="submit"]');

    // Hide error hint on the general-error div
    if (generalError) generalError.style.display = 'none';

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const email    = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let   valid    = true;

        // ── Client-side validation ────────────────────────────────────────
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            emailError.style.display = 'block';
            valid = false;
        } else {
            emailError.style.display = 'none';
        }

        if (!password) {
            passwordError.style.display = 'block';
            valid = false;
        } else {
            passwordError.style.display = 'none';
        }

        if (!valid) return;

        // ── Call API ──────────────────────────────────────────────────────
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Logging in...';
        if (generalError) generalError.style.display = 'none';

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body:   JSON.stringify({ email, password })
            });

            // Save session
            setSession(data.token, data.user);

            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        } catch (err) {
            if (generalError) {
                generalError.textContent  = err.message || 'Invalid email or password.';
                generalError.style.display = 'block';
            }
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Login';
        }
    });
});

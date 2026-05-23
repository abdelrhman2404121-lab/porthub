// public/js/register.js — Registration page logic
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) { window.location.href = '/dashboard.html'; return; }

    const form        = document.getElementById('register-form');
    const submitBtn   = form.querySelector('button[type="submit"]');

    // ── Password Strength Indicator ───────────────────────────────────────────
    const passInput = document.getElementById('reg-password');
    const strengthFill = document.getElementById('password-strength-fill');
    const strengthLabel = document.getElementById('password-strength-label');

    if (passInput && strengthFill) {
        passInput.addEventListener('input', () => {
            const val = passInput.value;
            let score = 0;
            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            const levels = [
                { label: '', color: 'transparent', width: '0%' },
                { label: '⚠️ Weak',   color: '#ef4444', width: '25%' },
                { label: '🔶 Fair',   color: '#f59e0b', width: '50%' },
                { label: '✅ Strong', color: '#10b981', width: '75%' },
                { label: '🔒 Very Strong', color: '#059669', width: '100%' }
            ];
            const level = levels[score] || levels[0];
            strengthFill.style.width = level.width;
            strengthFill.style.background = level.color;
            strengthLabel.textContent = level.label;
            strengthLabel.style.color = level.color;
        });
    }

    // Radio button styling toggle (preserves original UX)
    const radios = document.querySelectorAll('input[name="reg-role"]');
    radios.forEach(radio => {
        radio.addEventListener('change', e => {
            radios.forEach(r => {
                const label = r.closest('label');
                label.style.borderColor = 'var(--border-color)';
                label.style.background  = 'transparent';
                const icon = label.querySelector('i');
                if (icon) icon.className = icon.className.replace('text-primary', 'text-secondary');
            });
            const sel  = e.target.closest('label');
            sel.style.borderColor = 'var(--primary-color)';
            sel.style.background  = 'rgba(59,130,246,0.1)';
            const selIcon = sel.querySelector('i');
            if (selIcon) selIcon.className = selIcon.className.replace('text-secondary', 'text-primary');

            const nameLabel = document.getElementById('name-label');
            const nameInput = document.getElementById('reg-name');
            if (nameLabel) nameLabel.textContent = e.target.value === 'company' ? 'Company Name' : 'Full Name';
            if (nameInput) nameInput.placeholder  = e.target.value === 'company' ? 'Acme Corp' : 'John Doe';
        });
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const roleInput = document.querySelector('input[name="reg-role"]:checked');
        const role      = roleInput ? roleInput.value : 'individual';
        const name      = document.getElementById('reg-name').value.trim();
        const email     = document.getElementById('reg-email').value.trim();
        const password  = document.getElementById('reg-password').value;
        const confirm   = document.getElementById('reg-confirm').value;
        let   valid     = true;

        // ── Validation ────────────────────────────────────────────────────
        const nameErr  = document.getElementById('reg-name-error');
        const emailErr = document.getElementById('reg-email-error');
        const passErr  = document.getElementById('reg-password-error');
        const confErr  = document.getElementById('reg-confirm-error');

        if (!name || /\d/.test(name)) {
            nameErr.textContent    = 'Name is required and cannot contain numbers';
            nameErr.style.display  = 'block';
            valid = false;
        } else { nameErr.style.display = 'none'; }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            emailErr.textContent   = 'Valid email is required';
            emailErr.style.display = 'block';
            valid = false;
        } else { emailErr.style.display = 'none'; }

        const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!password || !passRegex.test(password)) {
            passErr.textContent   = 'Password must be 8+ chars with a letter and a number';
            passErr.style.display = 'block';
            valid = false;
        } else { passErr.style.display = 'none'; }

        if (!confirm || password !== confirm) {
            confErr.style.display = 'block';
            valid = false;
        } else { confErr.style.display = 'none'; }

        if (!valid) return;

        // ── Call API ──────────────────────────────────────────────────────
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Creating account...';

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body:   JSON.stringify({ name, email, password, role })
            });

            setSession(data.token, data.user);
            window.location.href = '/dashboard.html';
        } catch (err) {
            // Show error under email field (most likely duplicate)
            emailErr.textContent   = err.message || 'Registration failed. Please try again.';
            emailErr.style.display = 'block';
            submitBtn.disabled     = false;
            submitBtn.textContent  = 'Create Account';
        }
    });
});

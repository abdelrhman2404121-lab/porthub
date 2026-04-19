// login.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            document.getElementById('email-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('email-error').style.display = 'none';
        }

        if (!password) {
            document.getElementById('password-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('password-error').style.display = 'none';
        }

        if (isValid) {
            // Mock authentication
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // For demo purposes, we accept 'password' for any existing user, or specific check
            const user = users.find(u => u.email === email);
            
            // Hardcode demo pass logic
            if (user && (password === 'password' || password.length > 0)) {
                // Login success
                document.getElementById('general-error').style.display = 'none';
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('general-error').style.display = 'block';
            }
        }
    });
});

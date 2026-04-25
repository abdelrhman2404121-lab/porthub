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
            
            // Verify password
            if (user && user.password === password) {
                if (user.blocked) {
                    const errorDiv = document.getElementById('general-error');
                    errorDiv.textContent = 'Your account has been blocked by an administrator.';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                // Login success
                document.getElementById('general-error').style.display = 'none';
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                document.getElementById('general-error').style.display = 'block';
            }
        }
    });
});

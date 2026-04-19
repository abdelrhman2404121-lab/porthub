// register.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        let isValid = true;

        if (!name) {
            document.getElementById('reg-name-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('reg-name-error').style.display = 'none';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            document.getElementById('reg-email-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('reg-email-error').style.display = 'none';
        }

        if (!password || password.length < 6) {
            document.getElementById('reg-password-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('reg-password-error').style.display = 'none';
        }

        if (password !== confirm || !confirm) {
            document.getElementById('reg-confirm-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('reg-confirm-error').style.display = 'none';
        }

        if (isValid) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Check if email exists
            if (users.find(u => u.email === email)) {
                document.getElementById('reg-email-error').textContent = 'Email already exists';
                document.getElementById('reg-email-error').style.display = 'block';
                return;
            }

            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                title: "New Member",
                bio: "I'm new here!",
                avatar: `https://i.pravatar.cc/150?u=${email}`,
                skills: [],
                experience: [],
                education: [],
                projects: [],
                comments: [],
                rating: 0,
                ratingCount: 0
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Auto login
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            window.location.href = 'dashboard.html';
        }
    });
});

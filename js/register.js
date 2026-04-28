// register.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');

    // Radio button styling toggle
    const radios = document.querySelectorAll('input[name="reg-role"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            radios.forEach(r => {
                const label = r.closest('label');
                label.style.borderColor = 'var(--border-color)';
                label.style.background = 'transparent';
                
                // Change icon colors back to secondary
                const icon = label.querySelector('i');
                icon.className = icon.className.replace('text-primary', 'text-secondary');
            });
            
            const selectedLabel = e.target.closest('label');
            selectedLabel.style.borderColor = 'var(--primary-color)';
            selectedLabel.style.background = 'rgba(59,130,246,0.1)';
            
            // Highlight selected icon
            const selectedIcon = selectedLabel.querySelector('i');
            selectedIcon.className = selectedIcon.className.replace('text-secondary', 'text-primary');

            // Update label text based on role
            document.getElementById('name-label').textContent = e.target.value === 'company' ? 'Company Name' : 'Full Name';
            document.getElementById('reg-name').placeholder = e.target.value === 'company' ? 'Acme Corp' : 'John Doe';
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const role = document.querySelector('input[name="reg-role"]:checked').value;

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        let isValid = true;

        if (!name || /\d/.test(name)) {
            const nameErr = document.getElementById('reg-name-error');
            nameErr.textContent = 'Name is required and cannot contain numbers';
            nameErr.style.display = 'block';
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

        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\w\W]{8,}$/;
        if (!password || !passRegex.test(password)) {
            const passErr = document.getElementById('reg-password-error');
            passErr.textContent = 'Password must be at least 8 chars, include a letter and a number';
            passErr.style.display = 'block';
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

            let baseUser = {
                id: Date.now(),
                name: name,
                email: email,
                password: password,
                role: role,
                title: role === 'company' ? "Innovative Company" : "New Member",
                bio: role === 'company' ? "We are a company that builds great things!" : "I'm new here!",
                avatar: `https://i.pravatar.cc/150?u=${email}`,
                comments: [],
                rating: 0,
                ratingCount: 0
            };

            let newUser;
            if (role === 'individual') {
                newUser = {
                    ...baseUser,
                    skills: [],
                    experience: [],
                    education: [],
                    projects: []
                };
            } else {
                newUser = {
                    ...baseUser,
                    products: [],
                    branches: [],
                    timeline: [],
                    team: [],
                    jobs: []
                };
            }

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Auto login
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            window.location.href = 'dashboard.html';
        }
    });
});

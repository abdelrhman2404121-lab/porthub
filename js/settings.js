// settings.js
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Refresh user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        currentUser = users[userIndex];
    }

    // Navigation Logic
    const navButtons = document.querySelectorAll('.settings-nav button');
    const sections = document.querySelectorAll('.settings-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    // Populate Account Form
    document.getElementById('set-name').value = currentUser.name || '';
    document.getElementById('set-title').value = currentUser.title || '';
    document.getElementById('set-email').value = currentUser.email || '';
    document.getElementById('set-phone').value = currentUser.phone || '';
    document.getElementById('set-bio').value = currentUser.bio || '';
    document.getElementById('set-avatar').value = currentUser.avatar || '';

    document.getElementById('form-account').addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser.name = document.getElementById('set-name').value.trim();
        currentUser.title = document.getElementById('set-title').value.trim();
        currentUser.email = document.getElementById('set-email').value.trim();
        currentUser.phone = document.getElementById('set-phone').value.trim();
        currentUser.bio = document.getElementById('set-bio').value.trim();
        currentUser.avatar = document.getElementById('set-avatar').value.trim() || `https://i.pravatar.cc/150?u=${currentUser.email}`;

        saveUser();
        showNotification('Profile updated successfully!');
        
        // Update top nav
        document.getElementById('user-greeting').textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        document.getElementById('nav-avatar').src = currentUser.avatar;
    });

    // Populate Privacy Form
    document.getElementById('priv-email').checked = currentUser.settings?.showEmail ?? true;
    document.getElementById('priv-phone').checked = currentUser.settings?.showPhone ?? true;

    document.getElementById('form-privacy').addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser.settings = {
            ...currentUser.settings,
            showEmail: document.getElementById('priv-email').checked,
            showPhone: document.getElementById('priv-phone').checked
        };
        saveUser();
        showNotification('Privacy settings updated!');
    });

    // Security Form
    document.getElementById('form-security').addEventListener('submit', (e) => {
        e.preventDefault();
        const curPass = document.getElementById('sec-current').value;
        const newPass = document.getElementById('sec-new').value;
        const confPass = document.getElementById('sec-confirm').value;
        const errorDiv = document.getElementById('sec-error');
        
        errorDiv.style.display = 'none';

        if (newPass.length < 6) {
            errorDiv.textContent = 'New password must be at least 6 characters.';
            errorDiv.style.display = 'block';
            return;
        }

        if (newPass !== confPass) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.style.display = 'block';
            return;
        }

        // Mock update
        showNotification('Password changed successfully!');
        document.getElementById('form-security').reset();
    });

    // Render Skills
    function renderSkills() {
        const skillsContainer = document.getElementById('set-skills-list');
        if (currentUser.skills && currentUser.skills.length > 0) {
            skillsContainer.innerHTML = currentUser.skills.map((s, idx) => `
                <div style="font-size: 0.875rem; padding: 4px 10px; background: var(--bg-color); border-radius: 20px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 5px;">
                    ${s} <i class="fas fa-times text-danger" style="cursor: pointer;" onclick="window.removeSkill(${idx})"></i>
                </div>
            `).join('');
        } else {
            skillsContainer.innerHTML = '<p class="text-sm text-secondary">No skills added yet.</p>';
        }
    }
    renderSkills();

    document.getElementById('form-skills').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('set-new-skill');
        const skill = input.value.trim();
        if (skill) {
            if (!currentUser.skills) currentUser.skills = [];
            if (!currentUser.skills.includes(skill)) {
                currentUser.skills.push(skill);
                saveUser();
                renderSkills();
                input.value = '';
            }
        }
    });

    window.removeSkill = (idx) => {
        if (currentUser.skills) {
            currentUser.skills.splice(idx, 1);
            saveUser();
            renderSkills();
        }
    };

    // Render Projects
    function renderProjects() {
        const projContainer = document.getElementById('set-projects-list');
        if (currentUser.projects && currentUser.projects.length > 0) {
            projContainer.innerHTML = currentUser.projects.map((p) => `
                <div class="mb-3 p-3" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin-bottom: 5px;">${p.title}</h4>
                        <p class="text-sm text-secondary" style="margin-bottom: 5px;">${p.desc}</p>
                        <a href="${p.link}" target="_blank" class="text-sm">Link</a>
                    </div>
                    <button class="btn btn-outline" style="color: var(--danger); border-color: var(--danger); padding: 5px 10px;" onclick="window.removeProject(${p.id})">Delete</button>
                </div>
            `).join('');
        } else {
            projContainer.innerHTML = '<p class="text-sm text-secondary">No projects added yet.</p>';
        }
    }
    renderProjects();

    document.getElementById('form-add-project').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('set-proj-title').value.trim();
        const desc = document.getElementById('set-proj-desc').value.trim();
        const link = document.getElementById('set-proj-link').value.trim();

        if (title && desc && link) {
            if (!currentUser.projects) currentUser.projects = [];
            currentUser.projects.push({
                id: Date.now(),
                title: title,
                desc: desc,
                link: link
            });
            saveUser();
            renderProjects();
            document.getElementById('form-add-project').reset();
            showNotification('Project added successfully!');
        }
    });

    window.removeProject = (id) => {
        if (currentUser.projects) {
            currentUser.projects = currentUser.projects.filter(p => p.id !== id);
            saveUser();
            renderProjects();
            showNotification('Project removed.', 'success');
        }
    };

    function saveUser() {
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
});

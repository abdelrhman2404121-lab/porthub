// admin.js
document.addEventListener('DOMContentLoaded', () => {
    // Nav logic
    const navUsers = document.getElementById('nav-users');
    const navProjects = document.getElementById('nav-projects');
    const viewUsers = document.getElementById('view-users');
    const viewProjects = document.getElementById('view-projects');

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        navUsers.classList.add('active');
        navProjects.classList.remove('active');
        viewUsers.style.display = 'block';
        viewProjects.style.display = 'none';
        renderUsers();
    });

    navProjects.addEventListener('click', (e) => {
        e.preventDefault();
        navProjects.classList.add('active');
        navUsers.classList.remove('active');
        viewProjects.style.display = 'block';
        viewUsers.style.display = 'none';
        renderProjects();
    });

    function getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    function saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
        renderUsers();
        renderProjects();
    }

    // Render Users Table
    function renderUsers() {
        const users = getUsers();
        const tbody = document.getElementById('admin-user-table');
        const search = document.getElementById('admin-user-search').value.toLowerCase();

        const filtered = users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));

        tbody.innerHTML = filtered.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <img src="${u.avatar}" style="width: 30px; height: 30px; border-radius: 50%;">
                        ${u.name}
                    </div>
                </td>
                <td>${u.email}</td>
                <td>${u.projects ? u.projects.length : 0}</td>
                <td>
                    <span style="color: ${u.blocked ? 'var(--danger)' : 'var(--success)'}; font-weight: 500;">
                        ${u.blocked ? 'Blocked' : 'Active'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-primary" onclick="window.editUser(${u.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-warning" onclick="window.toggleBlock(${u.id})">
                            <i class="fas ${u.blocked ? 'fa-unlock' : 'fa-ban'}"></i>
                        </button>
                        <button class="btn btn-danger" onclick="window.deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Render Projects Table
    function renderProjects() {
        const users = getUsers();
        const tbody = document.getElementById('admin-proj-table');
        const search = document.getElementById('admin-proj-search').value.toLowerCase();

        let allProj = [];
        users.forEach(u => {
            if (u.projects) {
                u.projects.forEach(p => {
                    allProj.push({ ...p, authorId: u.id, authorName: u.name });
                });
            }
        });

        const filtered = allProj.filter(p => p.title.toLowerCase().includes(search) || p.authorName.toLowerCase().includes(search));

        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.title}</td>
                <td>${p.authorName}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-danger" onclick="window.deleteProject(${p.authorId}, ${p.id})"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Global Functions for inline onclick handlers
    window.editUser = (id) => {
        const users = getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            document.getElementById('edit-id').value = user.id;
            document.getElementById('edit-name').value = user.name;
            document.getElementById('edit-email').value = user.email;
            document.getElementById('edit-modal').style.display = 'flex';
        }
    };

    window.toggleBlock = (id) => {
        const users = getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index].blocked = !users[index].blocked;
            saveUsers(users);
            showNotification(`User ${users[index].blocked ? 'blocked' : 'unblocked'}.`, 'success');
        }
    };

    window.deleteUser = (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            let users = getUsers();
            users = users.filter(u => u.id !== id);
            saveUsers(users);
            showNotification('User deleted.', 'success');
        }
    };

    window.deleteProject = (userId, projId) => {
        if (confirm('Are you sure you want to delete this project?')) {
            const users = getUsers();
            const index = users.findIndex(u => u.id === userId);
            if (index !== -1) {
                users[index].projects = users[index].projects.filter(p => p.id !== projId);
                saveUsers(users);
                showNotification('Project deleted.', 'success');
            }
        }
    };

    // Edit Form Logic
    document.getElementById('close-edit').addEventListener('click', () => {
        document.getElementById('edit-modal').style.display = 'none';
    });

    document.getElementById('admin-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-id').value);
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();

        const users = getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index].name = name;
            users[index].email = email;
            saveUsers(users);
            document.getElementById('edit-modal').style.display = 'none';
            showNotification('User updated.', 'success');
        }
    });

    // Search Listeners
    document.getElementById('admin-user-search').addEventListener('input', renderUsers);
    document.getElementById('admin-proj-search').addEventListener('input', renderProjects);

    // Initial render
    renderUsers();
});
//n
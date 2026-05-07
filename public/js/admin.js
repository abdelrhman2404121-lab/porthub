// public/js/admin.js — Admin panel
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
    const me = getCurrentUser();
    if (!me || me.role !== 'admin') { window.location.href = '/dashboard.html'; return; }

    // ── Navigation ────────────────────────────────────────────────────────────
    const navUsers    = document.getElementById('nav-users');
    const navProjects = document.getElementById('nav-projects');
    const viewUsers   = document.getElementById('view-users');
    const viewProjects= document.getElementById('view-projects');

    if (navUsers) navUsers.addEventListener('click', e => {
        e.preventDefault();
        navUsers.classList.add('active'); navProjects.classList.remove('active');
        viewUsers.style.display='block'; viewProjects.style.display='none';
        loadStats(); renderUsers();
    });
    if (navProjects) navProjects.addEventListener('click', e => {
        e.preventDefault();
        navProjects.classList.add('active'); navUsers.classList.remove('active');
        viewProjects.style.display='block'; viewUsers.style.display='none';
        renderProjects();
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    async function loadStats() {
        try {
            const res = await apiFetch('/admin/stats');
            const s   = res.stats;
            const ids = ['stat-total','stat-individuals','stat-companies','stat-blocked','stat-projects','stat-online'];
            const vals= [s.totalUsers, s.totalIndividuals, s.totalCompanies, s.blockedUsers, s.totalProjects, s.onlineUsers];
            ids.forEach((id,i) => { const el=document.getElementById(id); if(el) el.textContent=vals[i]||0; });
        } catch {}
    }
    loadStats();

    // ── Users Table ───────────────────────────────────────────────────────────
    async function renderUsers() {
        const tbody  = document.getElementById('admin-user-table');
        const search = document.getElementById('admin-user-search');
        if (!tbody) return;

        const q    = search ? search.value : '';
        const role = document.getElementById('admin-user-role')?.value || '';
        const stat = document.getElementById('admin-user-status')?.value || '';

        const params = new URLSearchParams({ limit: 100 });
        if (q)    params.append('q', q);
        if (role) params.append('role', role);
        if (stat) params.append('status', stat);

        try {
            const data  = await apiFetch(`/admin/users?${params}`);
            const users = data.users || [];
            tbody.innerHTML = users.length ? users.map(u => `
                <tr>
                    <td><img src="${u.profileImage||`https://i.pravatar.cc/30?u=${u.email}`}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:8px;">${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.role==='company'?'badge-company':'badge-user'}">${u.role}</span></td>
                    <td>${u.projectCount || 0}</td>
                    <td>
                        ${u.isOnline
                            ? '<span style="color:#22c55e;"><i class="fas fa-circle" style="font-size:0.6rem;"></i> Online</span>'
                            : `<span style="color:var(--text-secondary);font-size:0.8rem;">${formatLastSeen(u.lastSeen)}</span>`}
                    </td>
                    <td><span style="color:${u.isBlocked?'var(--danger)':'var(--success)'};font-weight:500;">${u.isBlocked?'Blocked':'Active'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-primary" onclick="window.editUser('${u._id}','${u.name.replace(/'/g,"\\'")}','${u.email}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-warning" onclick="window.toggleBlock('${u._id}')"><i class="fas ${u.isBlocked?'fa-unlock':'fa-ban'}"></i></button>
                            <button class="btn btn-danger"  onclick="window.deleteUser('${u._id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="7" style="text-align:center;">No users found.</td></tr>';
        } catch (err) { tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`; }
    }

    // ── Projects Table ────────────────────────────────────────────────────────
    async function renderProjects() {
        const tbody  = document.getElementById('admin-proj-table');
        const search = document.getElementById('admin-proj-search');
        if (!tbody) return;

        const params = new URLSearchParams({ limit: 100 });
        if (search && search.value) params.append('q', search.value);

        try {
            const data  = await apiFetch(`/admin/projects?${params}`);
            const projs = data.projects || [];
            tbody.innerHTML = projs.length ? projs.map(p => `
                <tr>
                    <td>${p.title}</td>
                    <td>${p.userId ? p.userId.name : 'Unknown'}</td>
                    <td>${(p.technologies||[]).join(', ')||'-'}</td>
                    <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-danger" onclick="window.deleteProject('${p._id}')"><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center;">No projects found.</td></tr>';
        } catch (err) { tbody.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`; }
    }

    // ── Global action handlers ─────────────────────────────────────────────────
    window.editUser = (id, name, email) => {
        document.getElementById('edit-id').value    = id;
        document.getElementById('edit-name').value  = name;
        document.getElementById('edit-email').value = email;
        document.getElementById('edit-modal').style.display = 'flex';
    };

    window.toggleBlock = async id => {
        try {
            const res = await apiFetch(`/admin/users/${id}/block`, { method: 'PUT' });
            showNotification(`User ${res.isBlocked ? 'blocked' : 'unblocked'}.`);
            renderUsers(); loadStats();
        } catch (err) { showNotification(err.message, 'error'); }
    };

    window.deleteUser = async id => {
        if (!confirm('Permanently delete this user and all their data?')) return;
        try {
            await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
            showNotification('User deleted.');
            renderUsers(); loadStats();
        } catch (err) { showNotification(err.message, 'error'); }
    };

    window.deleteProject = async id => {
        if (!confirm('Delete this project?')) return;
        try {
            await apiFetch(`/admin/projects/${id}`, { method: 'DELETE' });
            showNotification('Project deleted.');
            renderProjects();
        } catch (err) { showNotification(err.message, 'error'); }
    };

    // ── Edit modal ────────────────────────────────────────────────────────────
    const closeEdit = document.getElementById('close-edit');
    if (closeEdit) closeEdit.addEventListener('click', () => { document.getElementById('edit-modal').style.display='none'; });

    const editForm = document.getElementById('admin-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async e => {
            e.preventDefault();
            const id    = document.getElementById('edit-id').value;
            const name  = document.getElementById('edit-name').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            try {
                await apiFetch(`/admin/users/${id}`, { method:'PUT', body: JSON.stringify({ name, email }) });
                document.getElementById('edit-modal').style.display = 'none';
                showNotification('User updated.');
                renderUsers();
            } catch (err) { showNotification(err.message, 'error'); }
        });
    }

    // ── Search listeners ──────────────────────────────────────────────────────
    const userSearch = document.getElementById('admin-user-search');
    const projSearch = document.getElementById('admin-proj-search');
    const userRole   = document.getElementById('admin-user-role');
    const userStatus = document.getElementById('admin-user-status');

    if (userSearch)  userSearch.addEventListener('input',  renderUsers);
    if (projSearch)  projSearch.addEventListener('input',  renderProjects);
    if (userRole)    userRole.addEventListener('change',   renderUsers);
    if (userStatus)  userStatus.addEventListener('change', renderUsers);

    // Initial render
    renderUsers();
});

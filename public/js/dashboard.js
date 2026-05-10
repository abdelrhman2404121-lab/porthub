// public/js/dashboard.js — Dashboard page
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

    try {
        // Fetch fresh user data from the API
        const data       = await apiFetch('/auth/me');
        const user       = data.user;

        // Update cached user
        setSession(getToken(), user);

        // ── Basic Profile Info ────────────────────────────────────────────
        const avatar = user.profileImage || `https://i.pravatar.cc/150?u=${user.email}`;
        document.getElementById('dash-avatar').src          = avatar;
        document.getElementById('dash-name').textContent    = user.name;
        document.getElementById('dash-title').textContent   = user.title || 'No title set';
        document.getElementById('dash-rating').textContent  = (user.rating || 0).toFixed(1);

        // ── Stats ─────────────────────────────────────────────────────────
        document.getElementById('dash-views-count').textContent = user.viewers ? user.viewers.length : 0;

        // Fetch project count separately
        const projData  = await apiFetch('/projects/mine');
        const projects  = projData.projects || [];
        document.getElementById('dash-project-count').textContent = projects.length;

        // ── Viewers Modal ─────────────────────────────────────────────────
        const viewersCount  = user.viewers ? user.viewers.length : 0;
        const viewsStat     = document.getElementById('dash-views-count');
        const viewersModal  = document.getElementById('viewers-modal');
        const modalList     = document.getElementById('modal-viewers-list');

        viewsStat.addEventListener('click', () => {
            if (!user.viewers || user.viewers.length === 0) return;
            viewersModal.style.display = 'flex';
            modalList.innerHTML = user.viewers.map(v => `
                <div class="flex items-center justify-between p-2" style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md);">
                    <div class="flex items-center gap-3">
                        <img src="${v.avatar || `https://i.pravatar.cc/150?u=${v.userId}`}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                        <div>
                            <p class="m-0 text-sm font-bold text-white">${v.name}</p>
                            <p class="m-0 text-xs" style="color:rgba(255,255,255,0.7);">${formatLastSeen(v.viewedAt)}</p>
                        </div>
                    </div>
                    <a href="/profile.html?id=${v.userId}" class="btn btn-sm" style="background:white;color:var(--primary-color);">View</a>
                </div>
            `).join('');
        });

        document.getElementById('close-viewers-modal').addEventListener('click', () => {
            viewersModal.style.display = 'none';
        });

        // ── Notifications ─────────────────────────────────────────────────
        const notifContainer = document.getElementById('dash-notifications');
        const notifBadge     = document.getElementById('nav-notif-badge');
        const notifBtn       = document.getElementById('nav-notifications-btn');

        if (user.notifications && user.notifications.length > 0) {
            const hasUnread = user.notifications.some(n => !n.read);
            if (hasUnread && notifBadge) notifBadge.style.display = 'block';

            notifContainer.innerHTML = user.notifications.slice(0, 10).map(n => `
                <div class="mb-3 p-3 glass-panel animate-fade-in" style="border-radius:var(--radius-md);">
                    <p class="text-sm m-0" style="color:var(--text-primary);">${n.text}</p>
                    <span class="text-secondary" style="font-size:0.75rem;">${formatLastSeen(n.createdAt)}</span>
                </div>
            `).join('');
        } else {
            notifContainer.innerHTML = '<p class="text-sm text-secondary">No recent notifications.</p>';
        }

        if (notifBtn) {
            notifBtn.addEventListener('click', async () => {
                try {
                    await apiFetch('/users/me/notifications/read', { method: 'PUT' });
                    if (notifBadge) notifBadge.style.display = 'none';
                } catch {}
            });
        }

        // ── Projects Preview ──────────────────────────────────────────────
        const projContainer = document.getElementById('dash-projects');
        if (projects.length > 0) {
            projContainer.innerHTML = projects.slice(0, 4).map(p => `
                <div class="p-4 glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);">
                    <h4 style="color:var(--primary-color);">${p.title}</h4>
                    <p class="text-secondary text-sm mb-3">${p.description || p.desc || ''}</p>
                    <a href="${p.liveDemo || p.link || p.githubLink || '#'}" class="text-sm" style="font-weight:600;" target="_blank"><i class="fas fa-external-link-alt"></i> View Link</a>
                </div>
            `).join('');
        } else {
            projContainer.innerHTML = '<p class="text-sm text-secondary">You haven\'t added any projects yet.</p>';
            projContainer.classList.remove('grid-cols-2');
        }

        // ── Team Requests (pending connect requests) ───────────────────────
        const reqCard      = document.getElementById('dash-requests-card');
        const reqContainer = document.getElementById('dash-requests');

        const pendingRequests = (user.requests || []).filter(r => r.status === 'pending');

        if (pendingRequests.length > 0) {
            reqCard.style.display = 'block';
            reqContainer.innerHTML = pendingRequests.map(r => `
                <div class="p-4 glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;">
                    <div class="flex items-center gap-3">
                        <div class="avatar-ring"><img src="${r.fromAvatar || 'https://i.pravatar.cc/150?img=3'}" style="width:46px;height:46px;object-fit:cover;"></div>
                        <div>
                            <p class="m-0 text-sm"><strong>${r.fromName}</strong> ${r.type === 'join' ? 'wants to join your company.' : 'invited you to join their company.'}</p>
                            <span class="text-xs text-secondary">${formatLastSeen(r.date)}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-primary req-accept" data-id="${r._id}" style="padding:6px 16px;font-size:0.875rem;">Accept</button>
                        <button class="btn btn-outline req-decline" data-id="${r._id}" style="padding:6px 16px;font-size:0.875rem;">Decline</button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.req-accept').forEach(btn => {
                btn.addEventListener('click', e => handleRequest(e.target.dataset.id, 'accepted'));
            });
            document.querySelectorAll('.req-decline').forEach(btn => {
                btn.addEventListener('click', e => handleRequest(e.target.dataset.id, 'declined'));
            });
        } else {
            if (reqCard) reqCard.style.display = 'none';
        }

        async function handleRequest(reqId, status) {
            try {
                await apiFetch(`/users/requests/${reqId}`, {
                    method: 'PUT',
                    body:   JSON.stringify({ status })
                });
                showNotification(`Request ${status}!`);
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showNotification(err.message || 'Could not handle request.', 'error');
            }
        }

    } catch (err) {
        console.error('Dashboard error:', err);
        showNotification('Could not load dashboard data.', 'error');
    }
});

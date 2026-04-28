// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Refresh user data from localStorage in case it changed in settings
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUser = users.find(u => u.id === currentUser.id);
    if (updatedUser) {
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    document.getElementById('dash-name').textContent = currentUser.name;
    document.getElementById('dash-title').textContent = currentUser.title || 'No title set';
    document.getElementById('dash-avatar').src = currentUser.avatar || 'https://i.pravatar.cc/150?img=3';
    document.getElementById('dash-rating').textContent = (currentUser.rating || 0).toFixed(1);
    
    const projCount = currentUser.projects ? currentUser.projects.length : 0;
    document.getElementById('dash-project-count').textContent = projCount;

    // Handle Viewers Modal
    const viewersCount = currentUser.viewers ? currentUser.viewers.length : 0;
    const viewsStat = document.getElementById('dash-views-count');
    viewsStat.textContent = viewersCount;
    
    const viewersModal = document.getElementById('viewers-modal');
    const modalViewersList = document.getElementById('modal-viewers-list');
    
    viewsStat.addEventListener('click', () => {
        if (viewersCount === 0) return;
        viewersModal.style.display = 'flex';
        modalViewersList.innerHTML = currentUser.viewers.map(v => `
            <div class="flex items-center justify-between p-2" style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md);">
                <div class="flex items-center gap-3">
                    <img src="${v.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <p class="m-0 text-sm font-bold text-white">${v.name}</p>
                        <p class="m-0 text-xs" style="color: rgba(255,255,255,0.7);">${new Date(v.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <a href="profile.html?id=${v.id}" class="btn btn-sm" style="background: white; color: var(--primary-color);">View</a>
            </div>
        `).join('');
    });

    document.getElementById('close-viewers-modal').addEventListener('click', () => {
        viewersModal.style.display = 'none';
    });

    // Render Notifications
    const notifContainer = document.getElementById('dash-notifications');
    const notifBadge = document.getElementById('nav-notif-badge');
    const notifBtn = document.getElementById('nav-notifications-btn');
    
    if (currentUser.notifications && currentUser.notifications.length > 0) {
        const hasUnread = currentUser.notifications.some(n => !n.read);
        if (hasUnread) notifBadge.style.display = 'block';

        notifContainer.innerHTML = currentUser.notifications.map(n => `
            <div class="mb-3 pb-3" style="border-bottom: 1px solid var(--border-color);">
                <p class="text-sm m-0">${n.text}</p>
                <span class="text-secondary" style="font-size: 0.75rem;">${new Date(n.date).toLocaleDateString()}</span>
            </div>
        `).join('');
    } else {
        notifContainer.innerHTML = '<p class="text-sm text-secondary">No recent notifications.</p>';
    }

    notifBtn.addEventListener('click', () => {
        // Scroll to notifications
        notifContainer.scrollIntoView({ behavior: 'smooth' });
        // Mark as read
        if (currentUser.notifications) {
            currentUser.notifications.forEach(n => n.read = true);
            notifBadge.style.display = 'none';
            
            // Save to localStorage
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        }
    });

    const projContainer = document.getElementById('dash-projects');
    if (projCount > 0) {
        projContainer.innerHTML = currentUser.projects.slice(0, 4).map(p => `
            <div style="padding: 15px; background-color: var(--bg-color); border-radius: var(--radius-md);">
                <h4>${p.title}</h4>
                <p class="text-secondary text-sm mb-2">${p.desc}</p>
                <a href="${p.link}" class="text-sm" target="_blank">View Link</a>
            </div>
        `).join('');
    } else {
        projContainer.innerHTML = '<p class="text-sm text-secondary">You haven\'t added any projects yet.</p>';
        projContainer.classList.remove('grid-cols-2');
    }
    // Render Team Requests
    const reqCard = document.getElementById('dash-requests-card');
    const reqContainer = document.getElementById('dash-requests');
    const pendingRequests = (currentUser.requests || []).filter(r => r.status === 'pending');

    if (pendingRequests.length > 0) {
        reqCard.style.display = 'block';
        reqContainer.innerHTML = pendingRequests.map(r => `
            <div class="p-3 glass-panel" style="border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div class="flex items-center gap-3">
                    <img src="${r.fromAvatar || 'https://i.pravatar.cc/150?img=3'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <p class="m-0 text-sm"><strong>${r.fromName}</strong> ${r.type === 'join' ? 'wants to join your company.' : 'invited you to join their company.'}</p>
                        <span class="text-xs text-secondary">${new Date(r.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary req-accept" data-id="${r.id}" style="padding: 5px 10px; font-size: 0.8rem;">Accept</button>
                    <button class="btn btn-outline req-decline" data-id="${r.id}" style="padding: 5px 10px; font-size: 0.8rem;">Decline</button>
                </div>
            </div>
        `).join('');

        // Handle Accept / Decline
        document.querySelectorAll('.req-accept').forEach(btn => {
            btn.addEventListener('click', (e) => handleRequest(e.target.dataset.id, 'accepted'));
        });
        document.querySelectorAll('.req-decline').forEach(btn => {
            btn.addEventListener('click', (e) => handleRequest(e.target.dataset.id, 'declined'));
        });
    } else {
        reqCard.style.display = 'none';
    }

    function handleRequest(reqId, newStatus) {
        let req = currentUser.requests.find(r => r.id.toString() === reqId);
        if (!req) return;
        req.status = newStatus;

        if (newStatus === 'accepted') {
            // If the current user is a Company and accepted a 'join' request from an individual
            // Or if current user is Individual and accepted an 'invite' from a Company
            let companyId = currentUser.role === 'company' ? currentUser.id : req.fromId;
            let individualId = currentUser.role === 'individual' ? currentUser.id : req.fromId;

            let companyObj = users.find(u => u.id === companyId);
            let individualObj = users.find(u => u.id === individualId);

            if (companyObj && individualObj) {
                if (!companyObj.team) companyObj.team = [];
                // Check if already in team
                if (!companyObj.team.some(t => t.name === individualObj.name)) {
                    companyObj.team.push({
                        id: Date.now(),
                        name: individualObj.name,
                        role: individualObj.title || 'Team Member',
                        avatar: individualObj.avatar
                    });
                }
            }
        }

        // Save users
        let userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification(`Request ${newStatus}!`);
        setTimeout(() => location.reload(), 1000);
    }
});

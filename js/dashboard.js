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
});

// profile.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get('id');

    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (userId === 'me' && currentUser) {
        userId = currentUser.id.toString();
    }

    if (!userId) {
        document.getElementById('profile-content').innerHTML = '<h2>User not found.</h2>';
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let profileUser = users.find(u => u.id.toString() === userId);

    if (!profileUser) {
        document.getElementById('profile-content').innerHTML = '<h2>User not found.</h2>';
        return;
    }

    // Populate Data
    document.getElementById('prof-avatar').src = profileUser.avatar || 'https://i.pravatar.cc/150?img=3';
    document.getElementById('prof-name').textContent = profileUser.name;
    document.getElementById('prof-title').textContent = profileUser.title || '';
    document.getElementById('prof-rating').textContent = (profileUser.rating || 0).toFixed(1);
    document.getElementById('prof-rating-count').textContent = profileUser.ratingCount || 0;
    
    document.getElementById('prof-email').textContent = profileUser.email || 'Hidden';
    document.getElementById('prof-phone').textContent = profileUser.phone || 'Hidden';
    document.getElementById('prof-bio').textContent = profileUser.bio || 'No bio provided.';
    document.getElementById('prof-email-btn').href = `mailto:${profileUser.email}`;

    // --- ROLE BASED RENDERING ---
    if (profileUser.role === 'company') {
        // Hide individual sections
        document.getElementById('ind-skills-card').style.display = 'none';
        document.getElementById('ind-exp-card').style.display = 'none';
        document.getElementById('ind-edu-card').style.display = 'none';

        // Show company sections
        document.getElementById('comp-branches-card').style.display = 'block';
        document.getElementById('comp-team-card').style.display = 'block';
        document.getElementById('comp-timeline-card').style.display = 'block';
        document.getElementById('comp-jobs-card').style.display = 'block';

        document.getElementById('proj-header').textContent = 'Products / Services';

        // Render Branches
        const branchesContainer = document.getElementById('prof-branches');
        if (profileUser.branches && profileUser.branches.length > 0) {
            branchesContainer.innerHTML = profileUser.branches.map(b => `
                <div class="p-3" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    <h4 style="color: var(--primary-color); margin-bottom: 5px;">${b.name}</h4>
                    <p class="text-sm text-secondary m-0"><i class="fas fa-map-marker-alt w-4"></i> ${b.location}</p>
                    ${b.contact ? `<p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-envelope w-4"></i> ${b.contact}</p>` : ''}
                </div>
            `).join('');
        } else {
            branchesContainer.innerHTML = '<p class="text-sm text-secondary">No branches listed.</p>';
        }

        // Render Team
        const teamContainer = document.getElementById('prof-team');
        if (profileUser.team && profileUser.team.length > 0) {
            teamContainer.innerHTML = profileUser.team.map(t => `
                <div class="flex items-center gap-3 p-2" style="background: var(--bg-color); border-radius: var(--radius-md);">
                    <img src="${t.avatar || 'https://i.pravatar.cc/150?img=1'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <h4 class="m-0 text-sm">${t.name}</h4>
                        <p class="text-xs text-secondary m-0">${t.role}</p>
                    </div>
                </div>
            `).join('');
        } else {
            teamContainer.innerHTML = '<p class="text-sm text-secondary">No team members listed.</p>';
        }

        // Render Timeline
        const tlContainer = document.getElementById('prof-timeline');
        if (profileUser.timeline && profileUser.timeline.length > 0) {
            const sorted = [...profileUser.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));
            tlContainer.innerHTML = sorted.map((t, idx) => `
                <div class="timeline-item" style="display: flex; gap: 20px; margin-bottom: 20px; position: relative;">
                    ${idx !== sorted.length - 1 ? `<div style="position: absolute; left: 19px; top: 40px; bottom: -20px; width: 2px; background: var(--border-color);"></div>` : ''}
                    <div style="background: rgba(59,130,246,0.1); color: var(--primary-color); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1;">
                        <i class="${t.icon || 'fas fa-star'}"></i>
                    </div>
                    <div class="p-4" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); flex: 1;">
                        <span class="text-xs text-primary font-bold tracking-wider uppercase">${t.date}</span>
                        <h3 class="m-0 mt-1 mb-2">${t.title}</h3>
                        <p class="text-sm text-secondary m-0">${t.desc}</p>
                    </div>
                </div>
            `).join('');
        } else {
            tlContainer.innerHTML = '<p class="text-sm text-secondary">No timeline events listed.</p>';
        }

        // Render Jobs
        const jobsContainer = document.getElementById('prof-jobs');
        if (profileUser.jobs && profileUser.jobs.length > 0) {
            jobsContainer.innerHTML = profileUser.jobs.map(j => `
                <div class="p-4 flex justify-between items-center hover:shadow-md transition" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: var(--transition);">
                    <div>
                        <h4 class="m-0" style="color: var(--primary-color);">${j.title}</h4>
                        <p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-map-marker-alt"></i> ${j.location}</p>
                    </div>
                    <a href="${j.link}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.875rem;">Apply Now</a>
                </div>
            `).join('');
        } else {
            jobsContainer.innerHTML = '<p class="text-sm text-secondary">No open positions.</p>';
        }

        // Products (reusing projects array)
        const projContainer = document.getElementById('prof-proj');
        const items = profileUser.products || profileUser.projects; // Fallback to projects
        if (items && items.length > 0) {
            projContainer.innerHTML = items.map(p => `
                <div style="padding: 15px; background-color: var(--bg-color); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h4>${p.title}</h4>
                    <p class="text-secondary text-sm mb-2">${p.desc}</p>
                    <a href="${p.link}" class="text-sm" target="_blank">View details</a>
                </div>
            `).join('');
        } else {
            projContainer.innerHTML = '<p class="text-sm text-secondary">No products or services listed.</p>';
            projContainer.classList.remove('grid-cols-2');
        }

    } else {
        // Render Individual specific arrays
        // Skills
        const skillsContainer = document.getElementById('prof-skills');
        if (profileUser.skills && profileUser.skills.length > 0) {
            skillsContainer.innerHTML = profileUser.skills.map(s => `<span style="font-size: 0.875rem; padding: 4px 10px; background: var(--bg-color); border-radius: 20px; color: var(--primary-color); border: 1px solid var(--border-color);">${s}</span>`).join('');
        } else {
            skillsContainer.innerHTML = '<p class="text-sm text-secondary">No skills listed.</p>';
        }

        // Experience
        const expContainer = document.getElementById('prof-exp');
        if (profileUser.experience && profileUser.experience.length > 0) {
            expContainer.innerHTML = profileUser.experience.map(e => `
                <div class="mb-3" style="border-left: 2px solid var(--border-color); padding-left: 15px;">
                    <h4 style="color: var(--primary-color);">${e.role}</h4>
                    <p class="text-secondary text-sm">${e.company} | ${e.years}</p>
                </div>
            `).join('');
        } else {
            expContainer.innerHTML = '<p class="text-sm text-secondary">No experience listed.</p>';
        }

        // Education
        const eduContainer = document.getElementById('prof-edu');
        if (profileUser.education && profileUser.education.length > 0) {
            eduContainer.innerHTML = profileUser.education.map(e => `
                <div class="mb-3" style="border-left: 2px solid var(--border-color); padding-left: 15px;">
                    <h4 style="color: var(--primary-color);">${e.degree}</h4>
                    <p class="text-secondary text-sm">${e.school} | ${e.year}</p>
                </div>
            `).join('');
        } else {
            eduContainer.innerHTML = '<p class="text-sm text-secondary">No education listed.</p>';
        }

        // Projects
        const projContainer = document.getElementById('prof-proj');
        if (profileUser.projects && profileUser.projects.length > 0) {
            projContainer.innerHTML = profileUser.projects.map(p => `
                <div style="padding: 15px; background-color: var(--bg-color); border-radius: var(--radius-md);">
                    <h4>${p.title}</h4>
                    <p class="text-secondary text-sm mb-2">${p.desc}</p>
                    <a href="${p.link}" class="text-sm" target="_blank">View Project</a>
                </div>
            `).join('');
        } else {
            projContainer.innerHTML = '<p class="text-sm text-secondary">No projects listed.</p>';
            projContainer.classList.remove('grid-cols-2');
        }
    }

    // Comments
    function renderComments() {
        const commContainer = document.getElementById('prof-comments');
        if (profileUser.comments && profileUser.comments.length > 0) {
            commContainer.innerHTML = profileUser.comments.map(c => `
                <div class="mb-3 p-3" style="background: var(--bg-color); border-radius: var(--radius-md);">
                    <div class="flex justify-between items-center mb-1">
                        <strong>${c.author}</strong>
                        <span class="text-sm text-secondary">${c.date}</span>
                    </div>
                    <p class="text-sm">${c.text}</p>
                </div>
            `).join('');
        } else {
            commContainer.innerHTML = '<p class="text-sm text-secondary">No comments yet.</p>';
        }
    }
    renderComments();

    // Interaction Logic (Logged in users only)
    if (currentUser && currentUser.id.toString() !== userId) {
        document.getElementById('login-to-comment').style.display = 'none';
        document.getElementById('comment-form').style.display = 'block';
        document.getElementById('rate-btn').style.display = 'inline-flex';

        // Profile View Tracking
        if (!profileUser.viewers) profileUser.viewers = [];
        const viewerExists = profileUser.viewers.find(v => v.id === currentUser.id);
        if (!viewerExists) {
            profileUser.viewers.unshift({
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                role: currentUser.role,
                date: new Date().toISOString()
            });
            // Keep only recent 20 viewers
            if (profileUser.viewers.length > 20) profileUser.viewers.pop();

            // Generate Notification
            if (!profileUser.notifications) profileUser.notifications = [];
            profileUser.notifications.unshift({
                id: Date.now(),
                text: `<strong>${currentUser.name}</strong> viewed your profile.`,
                date: new Date().toISOString(),
                read: false,
                type: 'view'
            });
            // Keep recent 30 notifications
            if (profileUser.notifications.length > 30) profileUser.notifications.pop();

            let userIndex = users.findIndex(u => u.id === profileUser.id);
            if (userIndex !== -1) users[userIndex] = profileUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        // Connect Logic
        const connectBtn = document.getElementById('connect-btn');
        let canConnect = false;
        let connectType = '';
        let connectText = '';

        if (currentUser.role === 'individual' && profileUser.role === 'company') {
            canConnect = true;
            connectType = 'join';
            connectText = '<i class="fas fa-handshake"></i> Request to Join';
        } else if (currentUser.role === 'company' && profileUser.role === 'individual') {
            canConnect = true;
            connectType = 'invite';
            connectText = '<i class="fas fa-user-plus"></i> Invite to Team';
        }

        if (canConnect) {
            connectBtn.style.display = 'inline-flex';
            
            // Check if already in team
            let alreadyInTeam = false;
            if (currentUser.role === 'individual' && profileUser.role === 'company') {
                alreadyInTeam = profileUser.team?.some(t => t.name === currentUser.name);
            } else if (currentUser.role === 'company' && profileUser.role === 'individual') {
                alreadyInTeam = currentUser.team?.some(t => t.name === profileUser.name);
            }

            if (alreadyInTeam) {
                connectBtn.innerHTML = '<i class="fas fa-check"></i> ' + (currentUser.role === 'individual' ? 'Joined' : 'In Team');
                connectBtn.disabled = true;
                connectBtn.classList.replace('btn-primary', 'btn-success');
                connectBtn.style.backgroundColor = 'var(--success)';
                connectBtn.style.borderColor = 'var(--success)';
                connectBtn.style.color = 'white';
            } else {
                // Check if request already exists
                const existingReq = profileUser.requests?.find(r => r.fromId === currentUser.id && r.status === 'pending');
                if (existingReq) {
                    connectBtn.innerHTML = '<i class="fas fa-clock"></i> Request Pending';
                    connectBtn.disabled = true;
                    connectBtn.classList.replace('btn-primary', 'btn-outline');
                } else {
                connectBtn.innerHTML = connectText;
                connectBtn.addEventListener('click', () => {
                    if (!profileUser.requests) profileUser.requests = [];
                    
                    profileUser.requests.push({
                        id: Date.now(),
                        fromId: currentUser.id,
                        fromName: currentUser.name,
                        fromAvatar: currentUser.avatar,
                        toId: profileUser.id,
                        type: connectType,
                        status: 'pending',
                        date: new Date().toISOString()
                    });

                    // Save
                    let userIndex = users.findIndex(u => u.id === profileUser.id);
                    if (userIndex !== -1) users[userIndex] = profileUser;
                    localStorage.setItem('users', JSON.stringify(users));

                    showNotification(connectType === 'join' ? 'Request sent to company!' : 'Invitation sent to user!');
                    
                    connectBtn.innerHTML = '<i class="fas fa-clock"></i> Request Pending';
                    connectBtn.disabled = true;
                    connectBtn.classList.replace('btn-primary', 'btn-outline');
                });
            }
        }
    }

        // Comment submission
        document.getElementById('comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.getElementById('comment-text').value.trim();
            if (text) {
                if (!profileUser.comments) profileUser.comments = [];
                profileUser.comments.push({
                    id: Date.now(),
                    author: currentUser.name,
                    text: text,
                    date: new Date().toISOString().split('T')[0]
                });
                
                // Save
                let userIndex = users.findIndex(u => u.id === profileUser.id);
                if (userIndex !== -1) users[userIndex] = profileUser;
                localStorage.setItem('users', JSON.stringify(users));
                
                document.getElementById('comment-text').value = '';
                renderComments();
                showNotification('Comment added successfully!');
            }
        });

        // Rating Modal logic
        const modal = document.getElementById('rating-modal');
        document.getElementById('rate-btn').addEventListener('click', () => {
            modal.style.display = 'flex';
        });
        document.getElementById('cancel-rate').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        document.getElementById('submit-rate').addEventListener('click', () => {
            const val = parseInt(document.getElementById('rating-val').value);
            let currentTotal = (profileUser.rating || 0) * (profileUser.ratingCount || 0);
            profileUser.ratingCount = (profileUser.ratingCount || 0) + 1;
            profileUser.rating = (currentTotal + val) / profileUser.ratingCount;
            
            // Save
            let userIndex = users.findIndex(u => u.id === profileUser.id);
            if (userIndex !== -1) users[userIndex] = profileUser;
            localStorage.setItem('users', JSON.stringify(users));

            document.getElementById('prof-rating').textContent = profileUser.rating.toFixed(1);
            document.getElementById('prof-rating-count').textContent = profileUser.ratingCount;

            modal.style.display = 'none';
            showNotification('Rating submitted!');
        });
    }
});

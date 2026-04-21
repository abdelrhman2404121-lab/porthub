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
            <div style="padding: 15px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                <h4>${p.title}</h4>
                <p class="text-secondary text-sm mb-2">${p.desc}</p>
                <a href="${p.link}" class="text-sm" target="_blank">View Project</a>
            </div>
        `).join('');
    } else {
        projContainer.innerHTML = '<p class="text-sm text-secondary">No projects listed.</p>';
        projContainer.classList.remove('grid-cols-2');
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

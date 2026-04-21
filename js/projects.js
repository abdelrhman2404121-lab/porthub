// projects.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    let allProjects = [];

    users.forEach(user => {
        if (user.projects) {
            user.projects.forEach(proj => {
                allProjects.push({ ...proj, author: user.name, authorId: user.id });
            });
        }
    });

    if (allProjects.length === 0) {
        container.innerHTML = '<p>No projects found.</p>';
        return;
    }

    let html = '';
    allProjects.forEach(proj => {
        html += `
            <div class="card transition">
                <h3 class="mb-2">${proj.title}</h3>
                <p class="text-secondary mb-4">${proj.desc}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm">By <a href="profile.html?id=${proj.authorId}">${proj.author}</a></span>
                    <a href="${proj.link}" target="_blank" class="btn btn-outline" style="padding: 5px 10px; font-size: 0.875rem;">View</a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
});

// public/js/projects.js — Public projects listing
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    container.innerHTML = '<p class="text-secondary">Loading projects...</p>';

    try {
        const data     = await apiFetch('/projects?limit=50');
        const projects = data.projects || [];

        if (projects.length === 0) {
            container.innerHTML = '<p class="text-secondary">No projects found.</p>';
            return;
        }

        container.innerHTML = projects.map(p => {
            const author = p.userId || {};
            const techs  = (p.technologies || []).map(t =>
                `<span style="font-size:0.75rem;padding:2px 8px;background:var(--bg-color);border-radius:20px;border:1px solid var(--border-color);">${t}</span>`
            ).join('');
            const links = [
                p.githubLink ? `<a href="${p.githubLink}" target="_blank" class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;"><i class="fab fa-github"></i> GitHub</a>` : '',
                p.liveDemo   ? `<a href="${p.liveDemo}"   target="_blank" class="btn btn-primary"  style="padding:5px 10px;font-size:0.8rem;"><i class="fas fa-external-link-alt"></i> Live</a>` : '',
                (!p.githubLink && !p.liveDemo && p.link) ? `<a href="${p.link}" target="_blank" class="btn btn-outline" style="padding:5px 10px;font-size:0.8rem;">View</a>` : ''
            ].filter(Boolean).join('');

            return `
                <div class="card transition">
                    ${p.image ? `<img src="${p.image}" alt="${p.title}" style="width:100%;height:160px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:12px;">` : ''}
                    <h3 class="mb-2">${p.title}</h3>
                    <p class="text-secondary mb-3">${p.description || p.desc || ''}</p>
                    ${techs ? `<div class="flex flex-wrap gap-1 mb-3">${techs}</div>` : ''}
                    <div class="flex justify-between items-center">
                        <span class="text-sm">By <a href="/profile.html?id=${author._id}">${author.name || 'Unknown'}</a></span>
                        <div class="flex gap-2">${links}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        container.innerHTML = '<p class="text-secondary">Failed to load projects. Please try again.</p>';
    }
});

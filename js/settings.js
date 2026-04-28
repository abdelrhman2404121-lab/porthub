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

    // Role-based Nav adjustments
    if (currentUser.role === 'company') {
        document.getElementById('nav-company-details').style.display = 'block';
        document.getElementById('nav-company-team').style.display = 'block';
        document.getElementById('nav-projects-skills').textContent = 'Products & Services';
        document.getElementById('cv-upload-title').textContent = 'Upload Company Brochure / Pitch Deck';
        document.querySelector('#cv-drop-area .upload-text').innerHTML = 'Drag & drop your Brochure/Deck here or <span class="upload-link">click to browse</span>';
    }

    // Populate Account Form
    document.getElementById('set-name').value = currentUser.name || '';
    document.getElementById('set-title').value = currentUser.title || '';
    document.getElementById('set-email').value = currentUser.email || '';
    document.getElementById('set-phone').value = currentUser.phone || '';
    document.getElementById('set-bio').value = currentUser.bio || '';
    document.getElementById('set-avatar').value = currentUser.avatar || '';

    document.getElementById('form-account').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('set-name').value.trim();
        
        if (!newName || /\d/.test(newName)) {
            showNotification('Name is required and cannot contain numbers', 'error');
            return;
        }
        
        currentUser.name = newName;
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

        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\w\W]{8,}$/;
        if (!passRegex.test(newPass)) {
            errorDiv.textContent = 'New password must be at least 8 chars, include a letter and a number.';
            errorDiv.style.display = 'block';
            return;
        }

        if (newPass !== confPass) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.style.display = 'block';
            return;
        }

        if (currentUser.password && curPass !== currentUser.password) {
            errorDiv.textContent = 'Current password is incorrect.';
            errorDiv.style.display = 'block';
            return;
        }

        // Update password
        currentUser.password = newPass;
        saveUser();
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
                <div class="mb-3 p-3" style="background-color: var(--bg-color); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
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

    // --- COMPANY SPECIFIC SECTIONS ---
    if (currentUser.role === 'company') {
        // Render Branches
        function renderBranches() {
            const container = document.getElementById('set-branches-list');
            if (currentUser.branches && currentUser.branches.length > 0) {
                container.innerHTML = currentUser.branches.map(b => `
                    <div class="p-3 mb-2 flex justify-between items-center" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <div>
                            <h4 class="m-0">${b.name}</h4>
                            <p class="text-sm text-secondary m-0"><i class="fas fa-map-marker-alt"></i> ${b.location} | <i class="fas fa-envelope"></i> ${b.contact}</p>
                        </div>
                        <button class="btn btn-outline text-danger" style="padding: 4px 8px; border-color: var(--danger);" onclick="window.removeBranch(${b.id})"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-sm text-secondary">No branches added yet.</p>';
            }
        }
        renderBranches();

        document.getElementById('form-add-branch').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('set-branch-name').value.trim();
            const loc = document.getElementById('set-branch-loc').value.trim();
            const contact = document.getElementById('set-branch-contact').value.trim();
            if (name && loc) {
                if (!currentUser.branches) currentUser.branches = [];
                currentUser.branches.push({ id: Date.now(), name, location: loc, contact });
                saveUser();
                renderBranches();
                document.getElementById('form-add-branch').reset();
                showNotification('Branch added successfully!');
            }
        });

        window.removeBranch = (id) => {
            currentUser.branches = currentUser.branches.filter(b => b.id !== id);
            saveUser();
            renderBranches();
            showNotification('Branch removed.');
        };

        // Render Timeline
        function renderTimeline() {
            const container = document.getElementById('set-timeline-list');
            if (currentUser.timeline && currentUser.timeline.length > 0) {
                // sort by date descending
                const sorted = [...currentUser.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));
                container.innerHTML = sorted.map(t => `
                    <div class="p-3 mb-2 flex justify-between items-start" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <div class="flex gap-3 items-start">
                            <div style="background: rgba(59,130,246,0.1); color: var(--primary-color); padding: 10px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="${t.icon || 'fas fa-star'}"></i>
                            </div>
                            <div>
                                <span class="text-sm text-primary font-bold">${t.date}</span>
                                <h4 class="m-0 mt-1">${t.title}</h4>
                                <p class="text-sm text-secondary m-0 mt-1">${t.desc}</p>
                            </div>
                        </div>
                        <button class="btn btn-outline text-danger" style="padding: 4px 8px; border-color: var(--danger);" onclick="window.removeTimeline(${t.id})"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-sm text-secondary">No timeline events added yet.</p>';
            }
        }
        renderTimeline();

        document.getElementById('form-add-timeline').addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('set-tl-date').value;
            const title = document.getElementById('set-tl-title').value.trim();
            const desc = document.getElementById('set-tl-desc').value.trim();
            const icon = document.getElementById('set-tl-icon').value.trim() || 'fas fa-star';
            if (date && title && desc) {
                if (!currentUser.timeline) currentUser.timeline = [];
                currentUser.timeline.push({ id: Date.now(), date, title, desc, icon });
                saveUser();
                renderTimeline();
                document.getElementById('form-add-timeline').reset();
                showNotification('Event added to timeline!');
            }
        });

        window.removeTimeline = (id) => {
            currentUser.timeline = currentUser.timeline.filter(t => t.id !== id);
            saveUser();
            renderTimeline();
            showNotification('Timeline event removed.');
        };

        // Render Team
        function renderTeam() {
            const container = document.getElementById('set-team-list');
            if (currentUser.team && currentUser.team.length > 0) {
                container.innerHTML = currentUser.team.map(t => `
                    <div class="p-3 flex items-center gap-3 relative" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <img src="${t.avatar || 'https://i.pravatar.cc/150?img=1'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h4 class="m-0">${t.name}</h4>
                            <p class="text-sm text-secondary m-0">${t.role}</p>
                        </div>
                        <button class="btn btn-outline text-danger" style="padding: 2px 6px; position: absolute; top: 10px; right: 10px; border: none;" onclick="window.removeTeam(${t.id})"><i class="fas fa-times"></i></button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-sm text-secondary col-span-2">No team members added.</p>';
            }
        }
        renderTeam();

        document.getElementById('form-add-team').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('set-team-name').value.trim();
            const role = document.getElementById('set-team-role').value.trim();
            const avatar = document.getElementById('set-team-avatar').value.trim();
            if (name && role) {
                if (!currentUser.team) currentUser.team = [];
                currentUser.team.push({ id: Date.now(), name, role, avatar });
                saveUser();
                renderTeam();
                document.getElementById('form-add-team').reset();
                showNotification('Team member added!');
            }
        });

        window.removeTeam = (id) => {
            currentUser.team = currentUser.team.filter(t => t.id !== id);
            saveUser();
            renderTeam();
            showNotification('Team member removed.');
        };

        // Render Jobs
        function renderJobs() {
            const container = document.getElementById('set-jobs-list');
            if (currentUser.jobs && currentUser.jobs.length > 0) {
                container.innerHTML = currentUser.jobs.map(j => `
                    <div class="p-3 mb-2 flex justify-between items-center" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <div>
                            <h4 class="m-0">${j.title}</h4>
                            <p class="text-sm text-secondary m-0"><i class="fas fa-briefcase"></i> ${j.location} | <a href="${j.link}" target="_blank">Apply</a></p>
                        </div>
                        <button class="btn btn-outline text-danger" style="padding: 4px 8px; border-color: var(--danger);" onclick="window.removeJob(${j.id})"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-sm text-secondary">No job openings posted.</p>';
            }
        }
        renderJobs();

        document.getElementById('form-add-job').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('set-job-title').value.trim();
            const location = document.getElementById('set-job-loc').value.trim();
            const link = document.getElementById('set-job-link').value.trim();
            if (title && location && link) {
                if (!currentUser.jobs) currentUser.jobs = [];
                currentUser.jobs.push({ id: Date.now(), title, location, link });
                saveUser();
                renderJobs();
                document.getElementById('form-add-job').reset();
                showNotification('Job posted!');
            }
        });

        window.removeJob = (id) => {
            currentUser.jobs = currentUser.jobs.filter(j => j.id !== id);
            saveUser();
            renderJobs();
            showNotification('Job removed.');
        };
    }

    function saveUser() {
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }

    // Upload Components
    function setupUpload(dropAreaId, fileInputId, fileInfoId, errorId, allowedTypes, maxSizeMB, isMultiple = false) {
        const dropArea = document.getElementById(dropAreaId);
        const fileInput = document.getElementById(fileInputId);
        const fileInfo = document.getElementById(fileInfoId);
        const errorDiv = document.getElementById(errorId);

        // Drag and drop events
        ["dragenter", "dragover"].forEach(event => {
            dropArea.addEventListener(event, e => {
                e.preventDefault();
                dropArea.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach(event => {
            dropArea.addEventListener(event, () => {
                dropArea.classList.remove("dragover");
            });
        });

        // Drop event
        dropArea.addEventListener("drop", e => {
            e.preventDefault();
            dropArea.classList.remove("dragover");
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files, allowedTypes, maxSizeMB, isMultiple);
        });

        // Click to upload
        dropArea.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", () => {
            const files = Array.from(fileInput.files);
            handleFiles(files, allowedTypes, maxSizeMB, isMultiple);
        });

        function handleFiles(files, allowedTypes, maxSizeMB, isMultiple) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            if (!isMultiple && files.length > 1) {
                showError('Please select only one file');
                return;
            }

            const validFiles = [];
            const errors = [];

            files.forEach(file => {
                if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedTypes.includes('.' + file.name.split('.').pop().toLowerCase())) {
                    errors.push(`${file.name}: Invalid file type`);
                } else if (file.size > maxSizeMB * 1024 * 1024) {
                    errors.push(`${file.name}: File too large (max ${maxSizeMB}MB)`);
                } else {
                    validFiles.push(file);
                }
            });

            if (errors.length > 0) {
                showError(errors.join('<br>'));
                return;
            }

            displayFiles(validFiles, isMultiple);
        }

        function showError(message) {
            errorDiv.innerHTML = message;
            errorDiv.style.display = 'block';
        }

        function displayFiles(files, isMultiple) {
            if (isMultiple) {
                fileInfo.innerHTML = '';
                files.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';

                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.className = 'file-preview';
                        img.src = URL.createObjectURL(file);
                        fileItem.appendChild(img);
                    } else {
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-file-pdf';
                        fileItem.appendChild(icon);
                    }

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = file.name;
                    fileItem.appendChild(nameSpan);

                    fileInfo.appendChild(fileItem);
                });
            } else {
                const file = files[0];
                document.getElementById(fileInfoId.replace('-info', '-file-name')).textContent = file.name;
            }

            fileInfo.style.display = 'block';
        }
    }

    // Setup CV Upload (PDF only)
    setupUpload('cv-drop-area', 'cv-file-input', 'cv-file-info', 'cv-error', ['application/pdf', '.pdf'], 50, false);

    // Setup Projects Upload (Images + PDF)
    setupUpload('projects-drop-area', 'projects-file-input', 'projects-files-info', 'projects-error', 
                ['image/png', 'image/jpg', 'image/jpeg', '.png', '.jpg', '.jpeg', 'application/pdf', '.pdf'], 50, true);
});

// Global variables for admin dashboard
let announcementsData = [];
let eventsData = [];
let resourceTree = null;
let timetableData = { url: '', type: 'image' };

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Modern navigation system
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Navigation functionality
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.tab;

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(target);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Update URL hash
            window.location.hash = target;
        });
    });

    // Initialize with dashboard or hash
    const initialTab = window.location.hash.slice(1) || 'dashboard';
    const initialLink = document.querySelector(`[data-tab="${initialTab}"]`);
    if (initialLink) {
        initialLink.click();
    } else {
        const dashboardLink = document.querySelector('[data-tab="dashboard"]');
        if (dashboardLink) dashboardLink.click();
    }

    // Load existing data and update dashboard
    loadData();

    // Utility functions
    function uid() {
        return 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function addIdsToTree(node) {
        if (!node.id) node.id = uid();
        if (node.type === 'folder' && Array.isArray(node.children)) {
            node.children = node.children.map(addIdsToTree);
        }
        return node;
    }

    function legacyToTree(legacy) {
        const root = { id: uid(), name: 'Resources', type: 'folder', children: [] };
        const cat = (label, arr) => ({
            id: uid(),
            name: label,
            type: 'folder',
            children: (arr || []).map(x => ({
                id: uid(),
                name: x.title,
                type: 'file',
                url: x.url
            }))
        });
        if (legacy && Object.keys(legacy).length) {
            root.children.push(cat('Notes', legacy.notes));
            root.children.push(cat('Slides', legacy.slides));
            root.children.push(cat('Recordings', legacy.recordings));
            root.children.push(cat('External Links', legacy.external_links));
        }
        return root;
    }

    function countResources(node) {
        if (!node) return 0;
        let count = 0;
        if (node.type === 'file') count = 1;
        if (node.children) {
            count += node.children.reduce((sum, child) => sum + countResources(child), 0);
        }
        return count;
    }

    // Dashboard stats update
    function updateDashboardStats() {
        const announcementsCount = document.getElementById('announcements-count');
        const eventsCount = document.getElementById('events-count');
        const resourcesCount = document.getElementById('resources-count');
        const lastUpdated = document.getElementById('last-updated');

        if (announcementsCount) announcementsCount.textContent = announcementsData.length;
        if (eventsCount) eventsCount.textContent = eventsData.length;
        if (resourcesCount) resourcesCount.textContent = countResources(resourceTree);
        if (lastUpdated) lastUpdated.textContent = new Date().toLocaleDateString();
    }

    // Load all data
    async function loadData() {
        try {
            // Load announcements
            try {
                const announcementsResponse = await fetch('../data/announcements.json');
                if (announcementsResponse.ok) {
                    announcementsData = await announcementsResponse.json();
                }
            } catch (e) {
                console.log('No announcements data found');
            }

            // Load events
            try {
                const eventsResponse = await fetch('../data/events.json');
                if (eventsResponse.ok) {
                    eventsData = await eventsResponse.json();
                }
            } catch (e) {
                console.log('No events data found');
            }

            // Load resources
            try {
                const resourcesResponse = await fetch('../data/resources.json');
                if (resourcesResponse.ok) {
                    const data = await resourcesResponse.json();
                    if (data && data.type === 'folder' && Array.isArray(data.children)) {
                        resourceTree = addIdsToTree(data);
                    } else {
                        resourceTree = legacyToTree(data || {});
                    }
                } else {
                    resourceTree = { id: uid(), name: 'Resources', type: 'folder', children: [] };
                }
            } catch (e) {
                resourceTree = { id: uid(), name: 'Resources', type: 'folder', children: [] };
            }

            // Load timetable
            try {
                const timetableResponse = await fetch('../data/timetable.json');
                if (timetableResponse.ok) {
                    timetableData = Object.assign({ url: '', type: 'image' }, await timetableResponse.json());
                }
            } catch (e) {
                console.log('No timetable data found');
            }

            // Update dashboard and render sections
            updateDashboardStats();
            renderAnnouncements();
            renderEvents();
            renderResources();
            renderTimetable();

        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading data', 'error');
        }
    }

    // Render functions
    function renderAnnouncements() {
        const announcementsEditor = document.getElementById('announcements-editor');
        if (!announcementsEditor) return;

        announcementsEditor.innerHTML = '';

        if (announcementsData.length === 0) {
            announcementsEditor.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-color-soft);">
                    <i class="fa-solid fa-bullhorn" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3>No announcements yet</h3>
                    <p>Create your first announcement to get started</p>
                </div>
            `;
            return;
        }

        announcementsData.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'admin-item-card';
            div.innerHTML = `
                <div class="admin-item-header">
                    <div class="admin-form-group" style="flex: 2; margin: 0;">
                        <label class="admin-form-label">Title</label>
                        <input type="text" class="admin-form-input" value="${item.title}" data-field="title" data-index="${index}" placeholder="Announcement title">
                    </div>
                    <div class="admin-form-group" style="flex: 1; margin: 0;">
                        <label class="admin-form-label">Date</label>
                        <input type="date" class="admin-form-input" value="${item.date}" data-field="date" data-index="${index}">
                    </div>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Description</label>
                    <textarea class="admin-form-textarea" data-field="description" data-index="${index}" placeholder="Announcement description">${item.description}</textarea>
                </div>
                <div class="admin-item-actions">
                    <span class="status-badge published">Published</span>
                    <button class="action-btn delete delete-announcement" data-index="${index}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            announcementsEditor.appendChild(div);
        });
    }

    function renderEvents() {
        const eventsEditor = document.getElementById('events-editor');
        if (!eventsEditor) return;

        eventsEditor.innerHTML = '';

        if (eventsData.length === 0) {
            eventsEditor.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-color-soft);">
                    <i class="fa-solid fa-calendar-days" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3>No events scheduled</h3>
                    <p>Create your first event to get started</p>
                </div>
            `;
            return;
        }

        eventsData.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'admin-item-card';
            div.innerHTML = `
                <div class="admin-item-header">
                    <div class="admin-form-group" style="flex: 2; margin: 0;">
                        <label class="admin-form-label">Event Title</label>
                        <input type="text" class="admin-form-input" value="${item.title}" data-field="title" data-index="${index}" placeholder="Event title">
                    </div>
                    <div class="admin-form-group" style="flex: 1; margin: 0;">
                        <label class="admin-form-label">Date</label>
                        <input type="date" class="admin-form-input" value="${item.date}" data-field="date" data-index="${index}">
                    </div>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Description</label>
                    <textarea class="admin-form-textarea" data-field="description" data-index="${index}" placeholder="Event description">${item.description}</textarea>
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Registration Form URL (Optional)</label>
                    <input type="url" class="admin-form-input" value="${item.form_url || ''}" data-field="form_url" data-index="${index}" placeholder="https://forms.google.com/...">
                </div>
                <div class="admin-item-actions">
                    <span class="status-badge published">Published</span>
                    <button class="action-btn delete delete-event" data-index="${index}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            eventsEditor.appendChild(div);
        });
    }

    function renderResources() {
        const resourcesEditor = document.getElementById('resources-editor');
        if (!resourcesEditor) return;

        resourcesEditor.innerHTML = `
            <div class="admin-item-card">
                <h3>Resources Management</h3>
                <p>Resource management interface will be implemented here.</p>
                <p>Current resources: ${countResources(resourceTree)}</p>
                <div class="admin-form-group">
                    <button class="button-primary" onclick="alert('Resource management coming soon!')">
                        <i class="fa-solid fa-plus"></i>
                        Add Resource
                    </button>
                </div>
            </div>
        `;
    }

    function renderTimetable() {
        const timetableEditor = document.getElementById('timetable-editor');
        if (!timetableEditor) return;

        timetableEditor.innerHTML = `
            <div class="admin-item-card">
                <div class="admin-form-group">
                    <label class="admin-form-label">Timetable URL</label>
                    <input type="url" class="admin-form-input" value="${timetableData.url || ''}" 
                           placeholder="https://example.com/timetable.pdf" id="timetable-url">
                </div>
                <div class="admin-form-group">
                    <label class="admin-form-label">Type</label>
                    <select class="admin-form-select" id="timetable-type">
                        <option value="image" ${timetableData.type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="pdf" ${timetableData.type === 'pdf' ? 'selected' : ''}>PDF</option>
                    </select>
                </div>
                ${timetableData.url ? `
                    <div class="admin-form-group">
                        <label class="admin-form-label">Preview</label>
                        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
                            ${timetableData.type === 'pdf' ?
                    `<iframe src="${timetableData.url}" style="width: 100%; height: 300px; border: none;"></iframe>` :
                    `<img src="${timetableData.url}" style="max-width: 100%; height: auto;" alt="Timetable preview">`
                }
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listeners for timetable form
        const urlInput = document.getElementById('timetable-url');
        const typeSelect = document.getElementById('timetable-type');

        if (urlInput) {
            urlInput.addEventListener('change', (e) => {
                timetableData.url = e.target.value;
                renderTimetable();
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                timetableData.type = e.target.value;
                renderTimetable();
            });
        }
    }

    // Toast notification system
    function showToast(message, type = 'success', title = '') {
        const toastContainer = document.querySelector('.toast-container') || createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'check' : type === 'error' ? 'times' : 'exclamation';
        const toastTitle = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info');

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${toastTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    function downloadJSON(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Event handlers for form changes
    document.addEventListener('change', (e) => {
        const target = e.target;
        const index = target.dataset.index;
        const field = target.dataset.field;

        if (index !== undefined && field) {
            if (target.closest('#announcements-editor')) {
                if (announcementsData[index]) {
                    announcementsData[index][field] = target.value;
                }
            } else if (target.closest('#events-editor')) {
                if (eventsData[index]) {
                    eventsData[index][field] = target.value;
                }
            }
        }
    });

    // Add new items
    const addAnnouncementBtn = document.getElementById('add-announcement');
    if (addAnnouncementBtn) {
        addAnnouncementBtn.addEventListener('click', () => {
            announcementsData.unshift({
                title: 'New Announcement',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
            renderAnnouncements();
            updateDashboardStats();
            showToast('New announcement created');
        });
    }

    const addEventBtn = document.getElementById('add-event');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            eventsData.unshift({
                title: 'New Event',
                date: new Date().toISOString().split('T')[0],
                description: '',
                form_url: ''
            });
            renderEvents();
            updateDashboardStats();
            showToast('New event created');
        });
    }

    // Delete handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-announcement')) {
            const index = e.target.closest('.delete-announcement').dataset.index;
            if (confirm('Are you sure you want to delete this announcement?')) {
                announcementsData.splice(index, 1);
                renderAnnouncements();
                updateDashboardStats();
                showToast('Announcement deleted');
            }
        }

        if (e.target.closest('.delete-event')) {
            const index = e.target.closest('.delete-event').dataset.index;
            if (confirm('Are you sure you want to delete this event?')) {
                eventsData.splice(index, 1);
                renderEvents();
                updateDashboardStats();
                showToast('Event deleted');
            }
        }
    });

    // Save/Export handlers
    const saveAnnouncementsBtn = document.getElementById('save-announcements');
    if (saveAnnouncementsBtn) {
        saveAnnouncementsBtn.addEventListener('click', () => {
            downloadJSON(announcementsData, 'announcements.json');
            showToast('Announcements exported successfully');
        });
    }

    const saveEventsBtn = document.getElementById('save-events');
    if (saveEventsBtn) {
        saveEventsBtn.addEventListener('click', () => {
            downloadJSON(eventsData, 'events.json');
            showToast('Events exported successfully');
        });
    }

    const saveResourcesBtn = document.getElementById('save-resources');
    if (saveResourcesBtn) {
        saveResourcesBtn.addEventListener('click', () => {
            const clean = JSON.parse(JSON.stringify(resourceTree));
            const stripIds = (n) => {
                delete n.id;
                if (n.children) n.children.forEach(stripIds);
            };
            stripIds(clean);
            downloadJSON(clean, 'resources.json');
            showToast('Resources exported successfully');
        });
    }

    const saveTimetableBtn = document.getElementById('save-timetable');
    if (saveTimetableBtn) {
        saveTimetableBtn.addEventListener('click', () => {
            downloadJSON(timetableData, 'timetable.json');
            showToast('Timetable exported successfully');
        });
    }

    // Quick action handlers
    document.addEventListener('click', (e) => {
        const actionCard = e.target.closest('.action-card');
        if (actionCard) {
            const action = actionCard.dataset.action;
            const navLink = document.querySelector(`[data-tab="${action}"]`);
            if (navLink) {
                navLink.click();
                // Trigger add action after navigation
                setTimeout(() => {
                    if (action === 'announcements') {
                        document.getElementById('add-announcement')?.click();
                    } else if (action === 'events') {
                        document.getElementById('add-event')?.click();
                    }
                }, 100);
            }
        }
    });

    // Logout handler
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('isAdmin');
                window.location.href = 'login.html';
            }
        });
    }
});    /
    / Mobile navigation for admin dashboard
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (mobileNavToggle && adminSidebar && sidebarOverlay) {
    mobileNavToggle.addEventListener('click', () => {
        adminSidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = adminSidebar.classList.contains('active') ? 'hidden' : '';
    });

    sidebarOverlay.addEventListener('click', () => {
        adminSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close sidebar when clicking nav links on mobile
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 767) {
                adminSidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) {
            adminSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
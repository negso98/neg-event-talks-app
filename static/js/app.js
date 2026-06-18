// Global State
let allUpdates = [];
let filteredUpdates = [];
let currentFilter = 'all';
let currentSearch = '';
let activeUpdateForTweet = null;

// Constants
const GOOGLE_DOCS_URL = "https://docs.cloud.google.com/bigquery/docs/release-notes";
const TWEET_MAX_CHARS = 280;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedText = document.getElementById('last-updated');
const notesGrid = document.getElementById('notes-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statBreaking = document.getElementById('stat-breaking');
const statAnnouncements = document.getElementById('stat-announcements');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalClose = document.getElementById('modal-close');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalBadge = document.getElementById('modal-badge');
const modalDate = document.getElementById('modal-date');
const modalContentPreview = document.getElementById('modal-content-preview');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');

// Template Buttons
const tplNews = document.getElementById('tpl-news');
const tplTech = document.getElementById('tpl-tech');
const tplShort = document.getElementById('tpl-short');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh handlers
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);

    // Search and filter inputs
    searchInput.addEventListener('input', handleSearch);
    searchClearBtn.addEventListener('click', clearSearch);
    clearFiltersBtn.addEventListener('click', resetAllFilters);

    // Filter pill events
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            filterPills.forEach(p => p.classList.remove('active'));
            const clickedPill = e.currentTarget;
            clickedPill.classList.add('active');
            
            currentFilter = clickedPill.dataset.filter;
            applyFilters();
        });
    });

    // Modal Events
    modalClose.addEventListener('click', hideTweetModal);
    modalCancelBtn.addEventListener('click', hideTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) hideTweetModal();
    });

    // Character counter validation
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Tweet templates
    tplNews.addEventListener('click', () => applyTweetTemplate('news'));
    tplTech.addEventListener('click', () => applyTweetTemplate('tech'));
    tplShort.addEventListener('click', () => applyTweetTemplate('short'));

    // Tweet submit
    tweetSubmitBtn.addEventListener('click', submitTweet);
}

// Fetch Release Notes from backend API
async function fetchReleaseNotes() {
    showState('loading');
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/notes');
        const data = await response.json();

        if (data.success && data.entries) {
            processEntries(data.entries);
            updateDashboardStats();
            applyFilters();
            
            // Set Last Updated Timestamp
            const now = new Date();
            lastUpdatedText.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            showToast('Release notes successfully updated!', 'check_circle');
        } else {
            throw new Error(data.error || "Unknown server error parsing notes.");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        errorMessage.textContent = error.message || "Failed to establish server connection.";
        showState('error');
        showToast('Error syncing release notes.', 'error', 'text-red');
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Process entries and split them into individual updates
function processEntries(entries) {
    allUpdates = [];
    
    entries.forEach(entry => {
        const dateStr = entry.title || "Unknown Date";
        const entryLink = entry.link || GOOGLE_DOCS_URL;
        const rawContent = entry.content || "";
        
        // Use DOMParser to parse the entry HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawContent, 'text/html');
        
        let currentType = 'Update';
        let currentNodes = [];
        
        // Loop through all child nodes of parsed HTML
        const childNodes = doc.body.childNodes;
        
        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            
            // Check if node is an H3 tag (indicates type of update, e.g. Feature, Issue)
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H3') {
                // Save previous group if it exists
                if (currentNodes.length > 0) {
                    pushUpdate(dateStr, currentType, currentNodes, entryLink);
                }
                currentType = node.textContent.trim();
                currentNodes = [];
            } else {
                currentNodes.push(node.cloneNode(true));
            }
        }
        
        // Push remaining elements
        if (currentNodes.length > 0) {
            pushUpdate(dateStr, currentType, currentNodes, entryLink);
        }
    });
}

// Helper to push processed updates into list
function pushUpdate(date, type, nodes, link) {
    // Generate innerHTML from nodes list
    const tempDiv = document.createElement('div');
    nodes.forEach(node => tempDiv.appendChild(node));
    const html = tempDiv.innerHTML.trim();
    
    // Generate text-only summary for searches & previews
    const plainText = tempDiv.textContent.replace(/\s+/g, ' ').trim();
    
    // Create unique ID
    const safeDate = date.replace(/[^a-zA-Z0-9]/g, '_');
    const safeType = type.replace(/[^a-zA-Z0-9]/g, '_');
    const id = `update_${safeDate}_${safeType}_${allUpdates.length}`;

    allUpdates.push({
        id,
        date,
        type,
        html,
        plainText,
        link
    });
}

// Calculate and render dashboard stats indicators
function updateDashboardStats() {
    statTotal.textContent = allUpdates.length;
    
    const features = allUpdates.filter(u => u.type.toLowerCase() === 'feature').length;
    statFeatures.textContent = features;
    
    const breaking = allUpdates.filter(u => u.type.toLowerCase() === 'breaking' || u.type.toLowerCase() === 'issue').length;
    statBreaking.textContent = breaking;
    
    const announcements = allUpdates.filter(u => u.type.toLowerCase() === 'announcement').length;
    statAnnouncements.textContent = announcements;
}

// Handle search input events
function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase().trim();
    searchClearBtn.style.display = currentSearch ? 'block' : 'none';
    applyFilters();
}

// Clear search input filter
function clearSearch() {
    searchInput.value = '';
    currentSearch = '';
    searchClearBtn.style.display = 'none';
    applyFilters();
}

// Reset filters to defaults
function resetAllFilters() {
    clearSearch();
    currentFilter = 'all';
    
    // Reset pill state
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        if (pill.dataset.filter === 'all') {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
    
    applyFilters();
}

// Filter and search calculations
function applyFilters() {
    filteredUpdates = allUpdates;
    
    // 1. Filter by category pill
    if (currentFilter !== 'all') {
        filteredUpdates = filteredUpdates.filter(u => u.type.toLowerCase() === currentFilter.toLowerCase());
    }
    
    // 2. Search filtering
    if (currentSearch) {
        filteredUpdates = filteredUpdates.filter(u => 
            u.plainText.toLowerCase().includes(currentSearch) ||
            u.date.toLowerCase().includes(currentSearch) ||
            u.type.toLowerCase().includes(currentSearch)
        );
    }
    
    renderGrid();
}

// Render the grid of cards
function renderGrid() {
    if (filteredUpdates.length === 0) {
        showState('empty');
        return;
    }
    
    notesGrid.innerHTML = '';
    
    filteredUpdates.forEach(update => {
        const card = document.createElement('div');
        const typeClass = `card-${update.type.toLowerCase()}`;
        card.className = `note-card ${typeClass}`;
        card.id = update.id;
        
        // Badge styling helpers
        const badgeClass = `badge-${update.type.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="note-header">
                <div class="note-meta">
                    <span class="note-badge ${badgeClass}">${update.type}</span>
                    <span class="note-date">
                        <span class="material-symbols-outlined text-muted">calendar_today</span>
                        ${update.date}
                    </span>
                </div>
                <div class="note-select-wrapper" style="display:none">
                    <input type="checkbox" class="note-checkbox" data-id="${update.id}">
                </div>
            </div>
            <div class="note-body">
                ${update.html}
            </div>
            <div class="note-footer">
                <button class="btn btn-secondary btn-copy" data-id="${update.id}">
                    <span class="material-symbols-outlined">content_copy</span>
                    Copy Code
                </button>
                <button class="btn btn-tweet-action btn-tweet-trigger" data-id="${update.id}">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Tweet
                </button>
            </div>
        `;
        
        notesGrid.appendChild(card);
    });
    
    // Hook actions
    setupCardActions();
    showState('grid');
}

// Hook copy and tweet triggers in grid
function setupCardActions() {
    // Copy HTML contents
    const copyBtns = notesGrid.querySelectorAll('.btn-copy');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const update = allUpdates.find(u => u.id === id);
            if (update) {
                // Copy clean text representation
                navigator.clipboard.writeText(update.plainText)
                    .then(() => showToast('Update text copied to clipboard!', 'check_circle'))
                    .catch(err => console.error('Clipboard copy failed:', err));
            }
        });
    });
    
    // Open Tweet modal
    const tweetTriggers = notesGrid.querySelectorAll('.btn-tweet-trigger');
    tweetTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const update = allUpdates.find(u => u.id === id);
            if (update) {
                showTweetModal(update);
            }
        });
    });
}

// Show Tweet Modal composer
function showTweetModal(update) {
    activeUpdateForTweet = update;
    
    // Populate Modal preview fields
    modalBadge.className = `preview-badge badge-${update.type.toLowerCase()}`;
    modalBadge.textContent = update.type;
    modalDate.textContent = update.date;
    
    // Truncate content in visual preview if very long
    let previewText = update.plainText;
    if (previewText.length > 200) {
        previewText = previewText.substring(0, 197) + '...';
    }
    modalContentPreview.textContent = previewText;
    
    // Reset and apply default template
    applyTweetTemplate('news');
    
    // Show Modal element
    tweetModal.classList.remove('hidden');
    tweetTextarea.focus();
}

// Hide Tweet Modal composer
function hideTweetModal() {
    tweetModal.classList.add('hidden');
    activeUpdateForTweet = null;
}

// Generate templates text based on type
function applyTweetTemplate(tplType) {
    if (!activeUpdateForTweet) return;
    
    const update = activeUpdateForTweet;
    const dateStr = update.date;
    const typeLabel = update.type;
    
    // Clean description: limit sentence lengths to fit
    let desc = update.plainText;
    
    // Get the first one or two sentences
    const sentences = desc.split(/(?<=[.!?])\s+/);
    let tweetDesc = sentences[0];
    
    if (sentences.length > 1 && (tweetDesc.length + sentences[1].length < 150)) {
        tweetDesc += " " + sentences[1];
    }
    
    // Ensure it is not too long to keep room for hashtags and link
    if (tweetDesc.length > 160) {
        tweetDesc = tweetDesc.substring(0, 157) + "...";
    }

    let tweetText = "";
    
    if (tplType === 'news') {
        tweetText = `📢 BigQuery Update (${dateStr}): ${typeLabel} launch!\n\n"${tweetDesc}"\n\nRead details here: ${update.link} #BigQuery #GoogleCloud #GCP`;
    } else if (tplType === 'tech') {
        tweetText = `💻 BigQuery Tech Release [${dateStr}]\n\nFeature: ${tweetDesc}\n\nSpecs & details: ${update.link} #DataEngineering #Cloud #BigQuery`;
    } else if (tplType === 'short') {
        tweetText = `⚡ BigQuery Update: ${tweetDesc}\n\n👉 ${update.link} #BigQuery`;
    }
    
    tweetTextarea.value = tweetText;
    updateCharCounter();
}

// Character counter and visual validation feedback
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = `${len} / ${TWEET_MAX_CHARS}`;
    
    // Highlight warn colors
    charCounter.classList.remove('char-warning', 'char-danger');
    tweetSubmitBtn.disabled = false;
    
    if (len > TWEET_MAX_CHARS) {
        charCounter.classList.add('char-danger');
        tweetSubmitBtn.disabled = true;
    } else if (len >= 250) {
        charCounter.classList.add('char-warning');
    }
}

// Action: Submit Twitter Web Intent
function submitTweet() {
    const text = tweetTextarea.value.trim();
    if (!text) return;
    
    if (text.length > TWEET_MAX_CHARS) {
        showToast('Tweet draft exceeds 280 characters limit!', 'error', 'text-red');
        return;
    }
    
    // Encode tweet text and open Twitter (X) Web Intent URL
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
    
    hideTweetModal();
    showToast('Redirecting to Twitter/X Web Intent...', 'check_circle');
}

// State container routing
function showState(state) {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    notesGrid.classList.add('hidden');
    
    if (state === 'loading') {
        loadingState.classList.remove('hidden');
    } else if (state === 'error') {
        errorState.classList.remove('hidden');
    } else if (state === 'empty') {
        emptyState.classList.remove('hidden');
    } else if (state === 'grid') {
        notesGrid.classList.remove('hidden');
    }
}

// Global Toast notifications
let toastTimeout;
function showToast(message, iconName = 'check_circle', iconClass = 'text-green') {
    clearTimeout(toastTimeout);
    
    toastMessage.textContent = message;
    toastIcon.textContent = iconName;
    
    // Reset colors
    toastIcon.className = `material-symbols-outlined toast-icon ${iconClass}`;
    
    toast.classList.remove('hidden');
    
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// Simple script for H-TV with essential functionality - Performance Optimized
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functions
    setupFilters();
    setupFavorites();
    setupHistory();
    setupDarkMode();
    setupMobileMenu();
    
    // Lazy load player and channels
    setTimeout(() => {
        initPlayer();
        setupChannels();
    }, 100);
});

// Global variables
let art = null;
// Global function for applying filters - making it available to all functions
window.applyFilters = null;

// Initialize Art Player
function initPlayer() {
    try {
        // Destroy previous instance if exists
        if (art) {
            art.destroy();
            art = null;
        }
        
        const playerElement = document.getElementById('artplayer-app');
        if (!playerElement) return;
        
        // Create player instance with optimized settings
        art = new Artplayer({
            container: '#artplayer-app',
            url: '',
            volume: 0.8,
            isLive: true,
            muted: false,
            autoplay: false,
            pip: true,
            fullscreen: true,
            setting: true,
            customType: {
                m3u8: function(video, url) {
                    if (Hls.isSupported()) {
                        const hls = new Hls({
                            lowLatencyMode: true,
                            maxBufferLength: 5,
                            manifestLoadingTimeOut: 10000,
                            levelLoadingTimeOut: 10000,
                            fragLoadingTimeOut: 15000,
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        
                        // Handle HLS errors
                        hls.on(Hls.Events.ERROR, function(event, data) {
                            if (data.fatal) {
                                switch(data.type) {
                                    case Hls.ErrorTypes.NETWORK_ERROR:
                                        // Try to recover network error
                                        console.log('Fatal network error encountered, try to recover');
                                        hls.startLoad();
                                        break;
                                    case Hls.ErrorTypes.MEDIA_ERROR:
                                        console.log('Fatal media error encountered, try to recover');
                                        hls.recoverMediaError();
                                        break;
                                    default:
                                        // Cannot recover
                                        console.error('Fatal error, cannot recover:', data);
                                        break;
                                }
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        console.error('HLS not supported');
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing player:', error);
    }
}

// Setup channel click events - with performance optimizations
function setupChannels() {
    const channels = document.querySelectorAll('.channel');
    const channelsContainer = document.querySelector('.channels');
    
    // Use event delegation for better performance
    channelsContainer.addEventListener('click', function(e) {
        const channel = e.target.closest('.channel');
        if (!channel) return; // Not clicked on a channel
        
        // Don't process if clicked on favorite button
        if (e.target.closest('.favorite-btn')) return;
        
        // Set active class
        document.querySelector('.channel.active')?.classList.remove('active');
        channel.classList.add('active');
        
        // Get stream URL
        const videoSrc = channel.dataset.src;
        if (!videoSrc) return;
        
        // Play video
        playVideo(videoSrc);
        
        // Save to watch history
        const channelName = channel.querySelector('.channel-info span').textContent;
        const channelImg = channel.querySelector('.channel-info img').src;
        const category = channel.dataset.category;
        
        addToHistory(channelName, videoSrc, channelImg, category);
    });
    
    // Setup favorites using event delegation
    channelsContainer.addEventListener('click', function(e) {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (!favoriteBtn) return; // Not clicked on a favorite button
        
        e.stopPropagation(); // Prevent channel click
        const channel = favoriteBtn.closest('.channel');
        const icon = favoriteBtn.querySelector('i');
        const channelSrc = channel.dataset.src;
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (icon.classList.contains('fa-solid')) {
            // Remove from favorites
            icon.classList.remove('fa-solid');
            icon.classList.add('fa-regular');
            
            // Update localStorage
            favorites = favorites.filter(src => src !== channelSrc);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        } else {
            // Add to favorites
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
            
            // Update localStorage
            if (!favorites.includes(channelSrc)) {
                favorites.push(channelSrc);
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        }
        
        // Apply filters if favorites filter is on
        if (document.getElementById('favoritesToggle').classList.contains('active')) {
            window.applyFilters();
        }
    });
}

// Play video function with optimized loading
function playVideo(videoSrc) {
    if (!art) return;
    
    // Show loading
    const videoPlayer = document.querySelector('.video-player');
    videoPlayer.classList.add('loading');
    
    // Clear any previous error handlers
    art.off('error');
    
    // Remove any previous playing handlers
    art.off('playing');
    
    // Add error handler for this specific video
    art.on('error', function(error) {
        console.warn('Art player error, trying to recover:', error);
    });
    
    // Set timeout for loading - longer timeout with no prompts
    let loadTimeout = setTimeout(() => {
        videoPlayer.classList.remove('loading');
        // Only show error if video still isn't playing after full timeout
        if (!art.playing) {
            console.error('Channel failed to load after full timeout');
            // Don't show any prompt, just log it
        }
    }, 20000);
    
    // Play video
    try {
        // Simple approach that works reliably
        art.switchUrl(videoSrc);
        
        // Listen for the playing event to clear loading state
        art.on('playing', function() {
            console.log('Video is now playing');
            clearTimeout(loadTimeout);
            videoPlayer.classList.remove('loading');
        });
        
        // Try to play, but don't show errors if it's interrupted
        setTimeout(() => {
            art.play().catch(err => {
                // Only log the error, don't show it to the user
                console.log('Play interrupted or autoplay prevented');
            });
        }, 500);
        
        // Clear loading after 5 seconds regardless, as a fallback
        setTimeout(() => {
            videoPlayer.classList.remove('loading');
        }, 5000);
        
    } catch (error) {
        console.error('Error in video handling:', error);
        // Don't show error dialog, just remove loading state
        setTimeout(() => {
            videoPlayer.classList.remove('loading');
        }, 1000);
    }
}

// Show user-friendly message (not used for errors anymore)
function showMessage(message) {
    console.log(message);
    // Optionally add a non-intrusive message display here
}

// Setup favorites functionality
function setupFavorites() {
    // Load favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Set initial state for favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const channel = btn.closest('.channel');
        const channelSrc = channel.dataset.src;
        
        // Set initial heart state
        if (favorites.includes(channelSrc)) {
            btn.querySelector('i').classList.remove('fa-regular');
            btn.querySelector('i').classList.add('fa-solid');
        }
    });
    
    // Setup favorites toggle button
    const favoritesToggle = document.getElementById('favoritesToggle');
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            window.applyFilters();
        });
    }
}

// Setup search and filter functionality with performance improvements
function setupFilters() {
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');
    const countryFilter = document.getElementById('countryFilter');
    const noResults = document.querySelector('.no-results');
    
    // Event listeners
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    categoryFilter.addEventListener('change', applyFilters);
    countryFilter.addEventListener('change', applyFilters);
    
    // Debounce function to limit how often a function can run
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // Apply filters function - optimized for performance
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const country = countryFilter.value;
        const favorites = document.getElementById('favoritesToggle').classList.contains('active');
        const favoritesList = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        // Use requestAnimationFrame for better performance with animations
        requestAnimationFrame(() => {
            let visibleCount = 0;
            const channels = document.querySelectorAll('.channel');
            
            // Process in batches for better performance
            const batchSize = 5;
            const numBatches = Math.ceil(channels.length / batchSize);
            
            function processBatch(batchIndex) {
                if (batchIndex >= numBatches) {
                    // All batches processed
                    // Show/hide no results message
                    if (visibleCount === 0) {
                        noResults.style.display = 'flex';
                    } else {
                        noResults.style.display = 'none';
                    }
                    return;
                }
                
                const startIndex = batchIndex * batchSize;
                const endIndex = Math.min(startIndex + batchSize, channels.length);
                
                for (let i = startIndex; i < endIndex; i++) {
                    const channel = channels[i];
                    const channelName = channel.querySelector('.channel-info span').textContent.toLowerCase();
                    const channelCategory = channel.dataset.category;
                    const channelCountry = channel.dataset.country;
                    const channelSrc = channel.dataset.src;
                    
                    // Check if matches all criteria
                    const matchesSearch = channelName.includes(searchTerm);
                    const matchesCategory = category === 'all' || channelCategory === category;
                    const matchesCountry = country === 'all' || channelCountry === country;
                    const matchesFavorites = !favorites || favoritesList.includes(channelSrc);
                    
                    if (matchesSearch && matchesCategory && matchesCountry && matchesFavorites) {
                        channel.classList.remove('filtered-out');
                        channel.classList.add('filtered-in');
                        visibleCount++;
                    } else {
                        channel.classList.add('filtered-out');
                        channel.classList.remove('filtered-in');
                    }
                }
                
                // Process next batch
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        processBatch(batchIndex + 1);
                    });
                }, 0);
            }
            
            // Start batch processing
            processBatch(0);
        });
    }
    
    // Make applyFilters available globally
    window.applyFilters = applyFilters;
    
    // Initial filter
    applyFilters();
}

// Setup history functionality
function setupHistory() {
    // Create history panel if not exist
    if (!document.getElementById('historyPanel')) {
        const historyPanel = document.createElement('div');
        historyPanel.className = 'history-panel';
        historyPanel.id = 'historyPanel';
        historyPanel.innerHTML = `
            <div class="history-header">
                <h3>Watch History</h3>
                <button class="close-history" id="closeHistory">&times;</button>
            </div>
            <div class="history-list"></div>
            <button id="clearHistory" class="clear-history">Clear History</button>
        `;
        document.body.appendChild(historyPanel);
    }

    const historyToggle = document.querySelector('.history-toggle');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistory = document.getElementById('closeHistory');
    const clearHistory = document.getElementById('clearHistory');
    
    // Open/close history panel
    historyToggle.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent it from immediately closing
        historyPanel.classList.toggle('active');
        updateHistoryDisplay();
    });
    
    // Close history button
    closeHistory.addEventListener('click', function() {
        historyPanel.classList.remove('active');
    });
    
    // Add event listener to close when clicking outside
    document.addEventListener('click', function(e) {
        // If the history panel is active and the click is outside the panel
        if (historyPanel.classList.contains('active') && 
            !historyPanel.contains(e.target) && 
            !e.target.closest('.history-toggle')) {
            historyPanel.classList.remove('active');
        }
    });
    
    // Clear history button with proper confirmation dialog
    clearHistory.addEventListener('click', function() {
        showConfirmDialog(
            'Are you sure you want to clear your watch history?', 
            function() {
                localStorage.removeItem('watchHistory');
                updateHistoryDisplay();
            }
        );
    });
    
    // Initial history display
    updateHistoryDisplay();
}

// Show confirmation dialog
function showConfirmDialog(message, confirmCallback) {
    const dialog = document.getElementById('confirmDialog');
    const confirmMsg = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeConfirm = document.querySelector('.close-confirm');
    
    // Set message
    confirmMsg.textContent = message;
    
    // Show dialog
    dialog.classList.add('active');
    
    // Confirm action
    confirmOk.onclick = function() {
        dialog.classList.remove('active');
        if (confirmCallback) confirmCallback();
    };
    
    // Cancel action
    confirmCancel.onclick = closeConfirm.onclick = function() {
        dialog.classList.remove('active');
    };
}

// Add channel to watch history
function addToHistory(name, src, img, category) {
    let history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    // Remove existing entry if present
    history = history.filter(item => item.src !== src);
    
    // Add new entry at the beginning
    history.unshift({
        name: name,
        src: src,
        img: img,
        category: category,
        timestamp: new Date().getTime()
    });
    
    // Limit history to 20 items
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('watchHistory', JSON.stringify(history));
    
    // Update display if panel is open
    if (document.getElementById('historyPanel').classList.contains('active')) {
        updateHistoryDisplay();
    }
}

// Update history display
function updateHistoryDisplay() {
    const historyList = document.querySelector('.history-list');
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No watch history</div>';
        return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-info">
                <img src="${item.img}" alt="${item.name}">
                <div class="history-text">
                    <span>${item.name}</span>
                    <small>${formatTimeAgo(item.timestamp)}</small>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-play" data-src="${item.src}" title="Play"><i class="fas fa-play"></i></button>
                <button class="history-remove" data-src="${item.src}" title="Remove"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
    
    // Add event listeners to play buttons
    document.querySelectorAll('.history-play').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.dataset.src;
            
            // Find the corresponding channel and click it
            document.querySelectorAll('.channel').forEach(channel => {
                if (channel.dataset.src === src) {
                    channel.click();
                }
            });
            
            // Close history panel
            document.getElementById('historyPanel').classList.remove('active');
        });
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.history-remove').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.dataset.src;
            let history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
            
            // Remove item
            history = history.filter(item => item.src !== src);
            localStorage.setItem('watchHistory', JSON.stringify(history));
            
            // Update display
            updateHistoryDisplay();
        });
    });
}

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

// Setup dark mode
function setupDarkMode() {
    // Support both darkModeToggle and themeToggle
    const darkModeToggle = document.getElementById('darkModeToggle') || document.getElementById('themeToggle');
    if (!darkModeToggle) return;
    
    // Check for saved preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'true');
            this.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('darkMode', 'false');
            this.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

// Scroll to player section
function scrollToPlayer() {
    const playerSection = document.getElementById('player-section');
    if (playerSection) {
        playerSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Show section (used for navigation)
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}

// Setup mobile menu functionality
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            menu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !menu.contains(e.target) && menu.classList.contains('active')) {
            menu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
    
    // Close menu when clicking on menu items in mobile view
    const menuItems = document.querySelectorAll('.menu a');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                menu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
}
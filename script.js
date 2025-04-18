// Simple script for H-TV with essential functionality - Performance Optimized
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functions
    setupFilters();
    setupFavorites();
    setupHistory();
    setupDarkMode();
    setupMobileMenu();
    
    // Initialize player immediately
    initPlayer();
    setupChannels();
});

// Global variables
let art = null;
// Global function for applying filters - making it available to all functions
window.applyFilters = null;

// Initialize Art Player with the recommended implementation
function initPlayer() {
    try {
        // Destroy previous instance if exists
        if (art) {
            art.destroy();
            art = null;
        }
        
        // Get player container
        const container = document.getElementById('artplayer-app');
        if (!container) {
            console.error('Player container not found');
            return;
        }
        
        // Initialize with a simple empty configuration
        art = new Artplayer({
            container: '#artplayer-app',
            url: '',
            volume: 0.8,
            isLive: true,
            muted: false,
            autoplay: true,
            pip: true,
            fullscreen: true,
            setting: true,
            customType: {
                m3u8: function(video, url) {
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        art.notice.show = 'HLS is not supported in this browser';
                    }
                }
            }
        });
        
        // Add events for better user feedback
        art.on('ready', function() {
            console.log('Art player is ready');
        });
        
        art.on('play', function() {
            console.log('Video started playing');
        });
        
        art.on('error', function(error) {
            console.error('Art player error:', error);
        });
    } catch (error) {
        console.error('Error initializing player:', error);
    }
}

// Setup channel click events using event delegation
function setupChannels() {
    const channelsContainer = document.querySelector('.channels');
    
    // Use event delegation for better performance
    channelsContainer.addEventListener('click', function(e) {
        // Find closest channel element (if any)
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
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent channel click
            
            const channel = this.closest('.channel');
            const icon = this.querySelector('i');
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
    });
}

// Simple and reliable video playback function
function playVideo(videoSrc) {
    if (!art) {
        console.error('Art player not initialized');
        return;
    }
    
    // Show loading indicator
    const videoPlayer = document.querySelector('.video-player');
    videoPlayer.classList.add('loading');
    
    // Simple and direct approach - first pause and reset the player
    art.pause();
    
    // Set new source and play
    setTimeout(() => {
        // Switch the URL directly
        art.switchUrl(videoSrc);
        
        // Try to play
        try {
            art.play();
        } catch (error) {
            console.log('Play prevented:', error);
        }
        
        // Hide loading after a reasonable time
        setTimeout(() => {
            videoPlayer.classList.remove('loading');
        }, 3000);
    }, 100);
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

// Setup search and filter functionality
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
    
    // Apply filters function
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const country = countryFilter.value;
        const favorites = document.getElementById('favoritesToggle').classList.contains('active');
        const favoritesList = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        let visibleCount = 0;
        const channels = document.querySelectorAll('.channel');
        
        // Simple approach for better browser performance
        channels.forEach(channel => {
            const channelName = channel.querySelector('.channel-info span').textContent.toLowerCase();
            const channelCategory = channel.dataset.category;
            const channelCountry = channel.dataset.country;
            const channelSrc = channel.dataset.src;
            
            // Check if matches all criteria
            const matchesSearch = channelName.includes(searchTerm);
            const matchesCategory = category === 'all' || channelCategory === category;
            const matchesCountry = country === 'all' || channelCountry === country;
            const matchesFavorites = !favorites || favoritesList.includes(channelSrc);
            
            // Add fade-in effect with a slight delay for visual appeal
            if (matchesSearch && matchesCategory && matchesCountry && matchesFavorites) {
                channel.style.display = '';
                channel.classList.add('filtered-in');
                visibleCount++;
            } else {
                channel.style.display = 'none';
                channel.classList.remove('filtered-in');
            }
        });
        
        // Show/hide no results message
        if (visibleCount === 0) {
            noResults.style.display = 'flex';
        } else {
            noResults.style.display = 'none';
        }
    }
    
    // Make applyFilters available globally
    window.applyFilters = applyFilters;
    
    // Initial filter
    applyFilters();
}

// Setup watch history panel and functionality
function setupHistory() {
    const historyToggle = document.querySelector('.history-toggle');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistory = document.getElementById('closeHistory');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const historyContent = document.querySelector('.history-content');
    
    // Toggle history panel visibility
    historyToggle.addEventListener('click', function() {
        historyPanel.classList.toggle('active');
        loadHistory();
    });
    
    // Close history panel when close button is clicked
    closeHistory.addEventListener('click', function() {
        historyPanel.classList.remove('active');
    });
    
    // Close history panel when clicking outside
    document.addEventListener('click', function(e) {
        if (historyPanel.classList.contains('active') && 
            !historyPanel.contains(e.target) && 
            e.target !== historyToggle &&
            !historyToggle.contains(e.target)) {
            
            historyPanel.classList.remove('active');
        }
    });
    
    // Clear watch history
    clearHistoryBtn.addEventListener('click', function() {
        // Show confirmation dialog
        showConfirmDialog('Are you sure you want to clear your watch history?', function() {
            localStorage.removeItem('watchHistory');
            loadHistory();
        });
    });
    
    // Load and display history items
    function loadHistory() {
        historyContent.innerHTML = '';
        
        const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        
        if (history.length === 0) {
            historyContent.innerHTML = '<div class="empty-history">Your watch history is empty</div>';
            return;
        }
        
        // Sort history with newest first
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Format the timestamp
            const itemDate = new Date(item.timestamp);
            const formattedDate = formatDate(itemDate);
            
            historyItem.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="history-img">
                <div class="history-text">
                    <span>${item.name}</span>
                    <small>${formattedDate} · ${item.category}</small>
                </div>
                <div class="history-actions">
                    <button class="history-play" title="Play"><i class="fas fa-play"></i></button>
                    <button class="history-remove" title="Remove"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Play button
            historyItem.querySelector('.history-play').addEventListener('click', function(e) {
                e.stopPropagation();
                playVideo(item.src);
                
                // Find and activate the corresponding channel
                const channels = document.querySelectorAll('.channel');
                channels.forEach(channel => {
                    if (channel.dataset.src === item.src) {
                        document.querySelector('.channel.active')?.classList.remove('active');
                        channel.classList.add('active');
                    }
                });
                
                // Close the history panel
                historyPanel.classList.remove('active');
            });
            
            // Remove button
            historyItem.querySelector('.history-remove').addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Remove from history
                const updatedHistory = history.filter(h => h.src !== item.src);
                localStorage.setItem('watchHistory', JSON.stringify(updatedHistory));
                
                // Remove from UI with animation
                historyItem.style.opacity = '0';
                setTimeout(() => {
                    historyItem.remove();
                    
                    // Show empty state if needed
                    if (updatedHistory.length === 0) {
                        historyContent.innerHTML = '<div class="empty-history">Your watch history is empty</div>';
                    }
                }, 300);
            });
            
            // Click on item to play
            historyItem.addEventListener('click', function() {
                playVideo(item.src);
                
                // Find and activate the corresponding channel
                const channels = document.querySelectorAll('.channel');
                channels.forEach(channel => {
                    if (channel.dataset.src === item.src) {
                        document.querySelector('.channel.active')?.classList.remove('active');
                        channel.classList.add('active');
                    }
                });
                
                // Close the history panel
                historyPanel.classList.remove('active');
            });
            
            historyContent.appendChild(historyItem);
        });
    }
    
    // Helper to format date
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        
        if (diffDay > 0) {
            return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
        } else if (diffHr > 0) {
            return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffMin > 0) {
            return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
        } else {
            return 'Just now';
        }
    }
}

// Add channel to watch history
function addToHistory(name, src, img, category) {
    let history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    // Remove if already exists (to update and move to top)
    history = history.filter(item => item.src !== src);
    
    // Add new entry
    history.unshift({
        name: name,
        src: src,
        img: img,
        category: category || 'unknown',
        timestamp: new Date().toISOString()
    });
    
    // Limit history size to 20 items
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('watchHistory', JSON.stringify(history));
}

// Show confirm dialog
function showConfirmDialog(message, onConfirm) {
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeConfirm = document.querySelector('.close-confirm');
    
    // Set message
    confirmMessage.textContent = message;
    
    // Show dialog
    confirmDialog.style.display = 'flex';
    
    // Handle confirm button
    const handleConfirm = function() {
        confirmDialog.style.display = 'none';
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        cleanup();
    };
    
    // Handle cancel
    const handleCancel = function() {
        confirmDialog.style.display = 'none';
        cleanup();
    };
    
    // Cleanup event listeners
    const cleanup = function() {
        confirmOk.removeEventListener('click', handleConfirm);
        confirmCancel.removeEventListener('click', handleCancel);
        closeConfirm.removeEventListener('click', handleCancel);
    };
    
    // Add event listeners
    confirmOk.addEventListener('click', handleConfirm);
    confirmCancel.addEventListener('click', handleCancel);
    closeConfirm.addEventListener('click', handleCancel);
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
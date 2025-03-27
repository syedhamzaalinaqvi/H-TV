// Add this at the top of the file
if (typeof Hls === 'undefined') {
    console.error('HLS.js is not loaded');
}

//===== Show About Contact and Css
        function showSection(sectionId) {
            var sections = document.querySelectorAll('.section');
            sections.forEach(function(section) {
                section.style.display = 'none';
            });

            var sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.style.display = 'block';
 sectionToShow.scrollIntoView({ behavior: 'smooth' });
            }
        }


/*  document.addEventListener('DOMContentLoaded', function() {
            showSection('about');
        });
*/

// Optimize video player initialization
const player = new Plyr('#liveVideo', {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    clickToPlay: false,
    resetOnEnd: false,
    loadSprite: false
});

// Initialize HLS
let hls = null;
if (Hls.isSupported()) {
    hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 0
    });
    hls.attachMedia(player.media);
}

// Function to play video
function playVideo(videoSrc) {
    const videoPlayer = document.querySelector('.video-player');
    
    // Prevent multiple loads
    if (videoPlayer.classList.contains('loading')) return;
    
    videoPlayer.classList.add('loading');

    // Clear any existing source
    if (hls && hls.url) {
        hls.destroy();
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 0,
            startLevel: -1
        });
        hls.attachMedia(player.media);
    }

    try {
        if (hls) {
            hls.loadSource(videoSrc);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.classList.remove('loading');
                player.play().catch(() => {
                    console.log("Autoplay prevented");
                });
            });
        } else if (player.media.canPlayType('application/vnd.apple.mpegurl')) {
            player.media.src = videoSrc;
            videoPlayer.classList.remove('loading');
            player.play();
        }
    } catch (error) {
        console.error('Playback error:', error);
        videoPlayer.classList.remove('loading');
    }
}

// Enhanced channel click handler
function handleChannelClick(channel) {
    const videoSrc = channel.dataset.src;
    if (!videoSrc) return;

    // Update active state
    document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
    channel.classList.add('active');

    // Play video without scrolling
    playVideo(videoSrc);

    // On mobile, smoothly scroll to player
    if (window.innerWidth <= 1024) {
        const videoPlayer = document.querySelector('.video-player');
        const headerHeight = document.querySelector('header').offsetHeight;
        const yOffset = videoPlayer.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
            top: yOffset,
            behavior: 'smooth'
        });
    }
}

// Attach click handlers with debounce
document.querySelectorAll('.channel').forEach(channel => {
    let timeoutId;
    channel.addEventListener('click', (e) => {
        e.preventDefault();
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleChannelClick(channel), 100);
    });
});

// Script for search filter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const channels = document.querySelectorAll('.channel');

    searchInput.addEventListener('input', function() {
        const filter = searchInput.value.toLowerCase();

        channels.forEach(channel => {
            const channelName = channel.textContent.toLowerCase();

            if (channelName.includes(filter)) {
                channel.style.display = 'block';
            } else {
                channel.style.display = 'none';
            }
        });
    });
});

// Search filter optimization
const searchHandler = (event) => {
    const filter = event.target.value.toLowerCase();
    document.querySelectorAll('.channel').forEach(channel => {
        const name = channel.textContent.toLowerCase();
        channel.style.display = name.includes(filter) ? 'flex' : 'none';
    });
};

document.getElementById('search').addEventListener('input', searchHandler);

// Category Filter
document.getElementById('categoryFilter').addEventListener('change', function(e) {
    const category = e.target.value;
    const channels = document.querySelectorAll('.channel');
    
    channels.forEach(channel => {
        if (category === 'all' || channel.dataset.category === category) {
            channel.style.display = 'flex';
        } else {
            channel.style.display = 'none';
        }
    });
});

// Favorites System
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const channel = this.closest('.channel');
        const channelId = channel.dataset.src;
        
        if (favorites.includes(channelId)) {
            favorites = favorites.filter(id => id !== channelId);
            this.classList.remove('active');
        } else {
            favorites.push(channelId);
            this.classList.add('active');
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
});

// Quality Selection
document.getElementById('qualitySelector').addEventListener('change', function(e) {
    const quality = e.target.value;
    if (player.media) {
        player.quality = quality;
    }
});

// Theme Toggle
function createThemeToggle() {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.innerHTML = '🌓';
    btn.onclick = toggleTheme;
    document.body.appendChild(btn);
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
}
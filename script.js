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

// Initialize the Plyr video player
const player = new Plyr('#liveVideo');

// Initialize HLS
let hls = null;
if (Hls.isSupported()) {
    hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
    });
    hls.attachMedia(player.media);
}

// Function to play video
function playVideo(videoSrc) {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer.classList.contains('loading')) return;
    
    videoPlayer.classList.add('loading');

    // Simple scroll into view without smooth behavior
    if (window.innerWidth <= 1024) {
        videoPlayer.scrollIntoView(true);
    }

    if (hls) {
        hls.loadSource(videoSrc);
        hls.once(Hls.Events.MANIFEST_PARSED, () => {
            videoPlayer.classList.remove('loading');
            player.play();
        });
    } else if (player.media.canPlayType('application/vnd.apple.mpegurl')) {
        player.media.src = videoSrc;
        player.play();
        videoPlayer.classList.remove('loading');
    } else {
        alert('HLS is not supported in your browser.');
        videoPlayer.classList.remove('loading');
    }
}

// Handle channel click and playback
document.querySelectorAll('.channel').forEach(channel => {
    channel.addEventListener('click', function() {
        const videoSrc = this.getAttribute('data-src');

        // Remove active class from all channels
        document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));

        // Add active class to the clicked channel
        this.classList.add('active');

        // Play selected video
        playVideo(videoSrc);
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
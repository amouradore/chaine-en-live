document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const channelList = document.getElementById('channel-list');
    const player = document.getElementById('player');
    const searchInput = document.getElementById('search-input');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const appContainer = document.getElementById('app-container');

    // --- STATE ---
    let allChannels = [];

    // --- PARSING LOGIC ---
    const parseM3U = (data) => {
        const lines = data.trim().split('\n');
        const channels = [];
        let currentChannel = {};
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                const name = line.split(',').pop();
                if (name) currentChannel.name = name;
            } else if (line.length > 0 && !line.startsWith('#')) {
                if (currentChannel.name) {
                    currentChannel.url = line;
                    channels.push(currentChannel);
                    currentChannel = {};
                }
            }
        });
        return channels;
    };

    // --- DISPLAY LOGIC ---
    const displayChannels = (channels) => {
        if (!channelList) return;
        channelList.innerHTML = channels.map(channel =>
            `<li data-url="${channel.url}">${channel.name}</li>`
        ).join('');
    };

    // --- PLAYBACK LOGIC ---
    const video = document.getElementById('player');
    let hls = new Hls();

    const playChannel = (url) => {
        if (Hls.isSupported()) {
            hls.destroy(); // Destroy previous instance
            hls = new Hls(); // Create a new instance

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(url);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                video.play();
            });

            hls.attachMedia(video); // Attach media first
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                video.play();
            });
        }
    };

    channelList.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'LI') {
            const url = e.target.dataset.url;
            playChannel(url);

            const currentActive = channelList.querySelector('.active');
            if (currentActive) currentActive.classList.remove('active');
            e.target.classList.add('active');
        }
    });

    // --- SEARCH LOGIC (Module 4) ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredChannels = allChannels.filter(channel =>
            channel.name.toLowerCase().includes(searchTerm)
        );
        displayChannels(filteredChannels);
    });

    // --- INITIALIZATION ---
    const init = async () => {
        try {
            const response = await fetch('chaine.m3u8');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const m3uData = await response.text();
            allChannels = parseM3U(m3uData);
            displayChannels(allChannels);

            // Check for channel in URL
            const urlParams = new URLSearchParams(window.location.search);
            const channelUrl = urlParams.get('channel');
            if (channelUrl) {
                // Directly call playChannel, the internal logic will handle HLS readiness
                playChannel(channelUrl);
                // Highlight the channel in the list
                const channelItem = channelList.querySelector(`li[data-url="${channelUrl}"]`);
                if (channelItem) {
                    channelItem.classList.add('active');
                }
                // Request full screen for the video player
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.mozRequestFullScreen) { /* Firefox */
                    video.mozRequestFullScreen();
                } else if (video.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) { /* IE/Edge */
                    video.msRequestFullscreen();
                }
            }
        } catch (error) {
            console.error('Error loading or parsing M3U data:', error);
            if(channelList) channelList.innerHTML = '<li>Erreur de chargement des chaînes.</li>';
        }
    };

    init();

    // --- SIDEBAR TOGGLE LOGIC ---
    let sidebarTimeout;
    const hideSidebar = () => {
        sidebar.classList.remove('sidebar-open');
        mainContent.classList.remove('main-content-shifted');
    };

    const showSidebar = () => {
        clearTimeout(sidebarTimeout);
        sidebar.classList.add('sidebar-open');
        mainContent.classList.add('main-content-shifted');
    };

    // For PC (mouse movement)
    appContainer.addEventListener('mousemove', (e) => {
        if (e.clientX < 50) { // If mouse is near the left edge
            showSidebar();
        } else {
            sidebarTimeout = setTimeout(hideSidebar, 1000); // Hide after 1 second
        }
    });

    // For mobile (touch) - simple toggle on tap
    // This might need refinement for better UX on mobile
    appContainer.addEventListener('touchstart', (e) => {
        if (sidebar.classList.contains('sidebar-open')) {
            hideSidebar();
        } else {
            showSidebar();
        }
    });
});

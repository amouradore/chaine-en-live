document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const channelList = document.getElementById('channel-list');
    const player = document.getElementById('player');
    const searchInput = document.getElementById('search-input');

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
            }
        } catch (error) {
            console.error('Error loading or parsing M3U data:', error);
            if(channelList) channelList.innerHTML = '<li>Erreur de chargement des chaînes.</li>';
        }
    };

    init();
});

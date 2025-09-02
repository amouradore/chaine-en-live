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
    const getYouTubeEmbedUrl = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
                const videoId = urlObj.searchParams.get('v');
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`;
            }
        } catch (e) {
            console.error("Invalid URL or URL parsing failed:", url, e);
        }
        return null;
    };

    channelList.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'LI') {
            const url = e.target.dataset.url;
            const embedUrl = getYouTubeEmbedUrl(url);

            if (embedUrl) {
                player.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            } else {
                player.innerHTML = `<div class="player-error">Impossible de lire le format de cette URL.</div>`;
            }

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
    fetch('chaine.m3u')
        .then(response => response.ok ? response.text() : Promise.reject('Failed to load playlist.'))
        .then(data => {
            allChannels = parseM3U(data); // Store the master list
            displayChannels(allChannels); // Display all channels initially
        })
        .catch(error => {
            console.error('Error:', error);
            if(channelList) channelList.innerHTML = '<li>Erreur de chargement des chaînes.</li>';
        });
});

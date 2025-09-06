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

    // --- PLAYER LOGIC (VIDEO.JS WITH ADS) ---
    const player = videojs('player');

    const adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' + 
        'iu=/21775744923/external/vmap_ad_samples&sz=640x480&'
        + 'cust_params=sample_ar%3Dpremidpostpod&ciu_szs=300x250&'
        + 'gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&'
        + 'correlator=';

    const imaOptions = {
        adTagUrl: adTagUrl
    };

    player.ima(imaOptions);

    const playChannel = (url) => {
        player.src({
            src: url,
            type: 'application/x-mpegURL'
        });
        player.play();
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

    });

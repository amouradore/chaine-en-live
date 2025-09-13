document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const channelList = document.getElementById('channel-list');
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

    // --- PLAYER & ADS LOGIC ---
    const player = videojs('player');

    // Personnalisation du message d'erreur
    player.on('error', function() {
        const errorDisplay = player.getChild('errorDisplay');
        if (errorDisplay) {
            errorDisplay.getChild('content').el().innerHTML = 'Refresh the page';
        }
    });

    const initAds = () => {
        try {
            // IMPORTANT: Remplacez cette URL de test par votre propre URL de publicité VAST.
            // Obtenez-la auprès de votre réseau publicitaire (Google Ad Manager, etc.)
            const myVastAdTagUrl = ""; // <-- COLLEZ VOTRE URL DE PUBLICITÉ VAST ICI

            const adTagUrl = myVastAdTagUrl || 'https://pubads.g.doubleclick.net/gampad/ads?' + 
                'iu=/21775744923/external/vmap_ad_samples&sz=640x480&' +
                'cust_params=sample_ar%3Dpremidpostpod&ciu_szs=300x250&' +
                'gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&' +
                'correlator=';

            const imaOptions = { adTagUrl: adTagUrl };
            player.ima(imaOptions);
        } catch (e) {
            console.error("Erreur lors de l'initialisation des publicités:", e);
        }
    };

    const playChannel = (url) => {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        player.src({ src: proxyUrl, type: 'application/x-mpegURL' });
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

    // --- SEARCH LOGIC ---
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
            const response = await fetch('chaine2.m3u');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const m3uData = await response.text();
            allChannels = parseM3U(m3uData);
            displayChannels(allChannels);

            // Les publicités sont initialisées ici, APRES que les chaînes soient affichées
            initAds();

            // Check for channel in URL or play default
            const urlParams = new URLSearchParams(window.location.search);
            let channelUrl = urlParams.get('channel');

            if (!channelUrl) {
                const defaultChannel = allChannels.find(c => c.name.trim() === 'BeIN Sport 1 HD');
                if (defaultChannel) {
                    channelUrl = defaultChannel.url;
                }
            }

            if (channelUrl) {
                playChannel(channelUrl);
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

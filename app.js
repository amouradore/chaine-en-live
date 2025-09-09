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

    const initAds = () => {
        try {
            const adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' + 
                'iu=/21775744923/external/vmap_ad_samples&sz=640x480&'
                + 'cust_params=sample_ar%3Dpremidpostpod&ciu_szs=300x250&'
                + 'gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&'
                + 'correlator=';

            const imaOptions = { adTagUrl: adTagUrl };
            player.ima(imaOptions);
        } catch (e) {
            console.error("Erreur lors de l'initialisation des publicités:", e);
        }
    };

    const playChannel = (url) => {
        player.src({ src: url, type: 'application/x-mpegURL' });
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
            // CHAÎNE DE TEST AJOUTÉE DIRECTEMENT ICI
            const testChannel = { 
                name: "CHAÎNE TEST SPORT", 
                url: "http://13.team.ga:80/ch1128/mono.m3u8?token=refael.Ca7RM_9T5ydDxKepugjJ82sAw6-6PYHVcxGFO_CtUB1eFgphRMJec1wf8m0oIEbs"
            };

            const response = await fetch('chaine.m3u8');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const m3uData = await response.text();
            allChannels = parseM3U(m3uData);
            
            // Ajout de la chaîne de test au début de la liste
            allChannels.unshift(testChannel);

            displayChannels(allChannels);

            // Les publicités sont initialisées ici, APRES que les chaînes soient affichées
            initAds();

            // Check for channel in URL
            const urlParams = new URLSearchParams(window.location.search);
            const channelUrl = urlParams.get('channel');
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

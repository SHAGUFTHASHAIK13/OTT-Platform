/**
 * S.S. OTT Video Discovery Platform - Core Controller
 * Handles visual routing, carousels, search, watchlist, history, and player state.
 */

class AppController {
  constructor() {
    this.currentView = 'home';
    this.watchlist = [];
    this.history = [];
    
    this.settings = {
      apiMode: false,
      keys: {
        youtube: '',
        vimeo: ''
      }
    };

    this.activePlatformFilter = 'all';
    this.activeLanguageFilter = 'all';
    this.activeBrandFilter = 'all';
    this.currentHeroSlideIndex = 0;
    this.heroSlideInterval = null;
    this.searchDebounceTimer = null;
    this.activeTrendingVideos = [];

    // Elements
    this.dom = {
      loader: document.getElementById('app-loader'),
      header: document.getElementById('main-header'),
      navLinks: document.querySelectorAll('.nav-link'),
      logoLink: document.getElementById('logo-link'),
      searchInput: document.getElementById('search-input'),
      searchClearBtn: document.getElementById('search-clear-btn'),
      searchContainer: document.getElementById('search-container'),
      
      // Page Views
      browsePage: document.getElementById('browse-page'),
      watchlistPage: document.getElementById('watchlist-page'),
      historyPage: document.getElementById('history-page'),
      platformsPage: document.getElementById('platforms-page'),
      
      // Carousel Sections
      watchlistRowWrapper: document.getElementById('watchlist-row-wrapper'),
      watchlistCarousel: document.getElementById('watchlist-carousel'),
      historyRowWrapper: document.getElementById('history-row-wrapper'),
      historyCarousel: document.getElementById('history-carousel'),
      
      trendingCarousel: document.getElementById('trending-carousel'),
      scifiCarousel: document.getElementById('scifi-carousel'),
      natureCarousel: document.getElementById('nature-carousel'),
      animationCarousel: document.getElementById('animation-carousel'),
      musicCarousel: document.getElementById('music-carousel'),
      
      // Platform Showcase Grid
      platformsGrid: document.getElementById('platforms-grid'),
      platformSubtitle: document.getElementById('platform-subtitle'),
      platformCards: document.querySelectorAll('.platform-card'),
      filterBar: document.getElementById('filter-bar'),
      filterChips: document.querySelectorAll('.filter-chip'),

      // Grid Views List
      watchlistGrid: document.getElementById('watchlist-grid'),
      watchlistEmptyState: document.getElementById('watchlist-empty-state'),
      historyGrid: document.getElementById('history-grid'),
      historyEmptyState: document.getElementById('history-empty-state'),
      clearHistoryBtn: document.getElementById('clear-history-btn'),

      // Live Search Results
      searchResultsSection: document.getElementById('search-results-section'),
      searchResultsGrid: document.getElementById('search-results-grid'),
      searchQueryText: document.getElementById('search-query-text'),
      searchEmptyState: document.getElementById('search-empty-state'),

      // Hero Billboard
      heroBillboard: document.getElementById('hero-billboard'),
      heroBgImage: document.getElementById('hero-bg-image'),
      heroTitle: document.getElementById('hero-title'),
      heroMatch: document.getElementById('hero-match'),
      heroYear: document.getElementById('hero-year'),
      heroRating: document.getElementById('hero-rating'),
      heroPlatformBadge: document.getElementById('hero-platform-badge'),
      heroDescription: document.getElementById('hero-description'),
      heroPlayBtn: document.getElementById('hero-play-btn'),
      heroWatchlistBtn: document.getElementById('hero-watchlist-btn'),

      // Video Player Modal
      playerModal: document.getElementById('player-modal'),
      playerCloseBtn: document.getElementById('player-close-btn'),
      playerIframeWrapper: document.getElementById('player-iframe-wrapper'),
      playerMatch: document.getElementById('player-match'),
      playerYear: document.getElementById('player-year'),
      playerRating: document.getElementById('player-rating'),
      playerDuration: document.getElementById('player-duration'),
      playerPlatform: document.getElementById('player-platform'),
      playerTitle: document.getElementById('player-title'),
      playerChannel: document.getElementById('player-channel'),
      playerViews: document.getElementById('player-views'),
      playerDate: document.getElementById('player-date'),
      playerDescription: document.getElementById('player-description'),
      playerWatchlistBtn: document.getElementById('player-watchlist-btn'),
      recommendationsGrid: document.getElementById('recommendations-grid'),
      
      // Share Buttons inside Player
      shareLink: document.getElementById('share-link'),
      shareTwitter: document.getElementById('share-twitter'),
      shareFacebook: document.getElementById('share-facebook'),

      // Settings Modal
      settingsToggle: document.getElementById('settings-toggle'),
      settingsModal: document.getElementById('settings-modal'),
      settingsCloseBtn: document.getElementById('settings-close-btn'),
      settingsCancelBtn: document.getElementById('settings-cancel-btn'),
      settingsSaveBtn: document.getElementById('settings-save-btn'),
      apiModeToggle: document.getElementById('api-mode-toggle'),
      apiModeLabel: document.getElementById('api-mode-label'),
      apiCredentialsSection: document.getElementById('api-credentials-section'),
      ytApiKeyInput: document.getElementById('yt-api-key'),
      vimeoTokenInput: document.getElementById('vimeo-access-token'),
      resetAllBtn: document.getElementById('reset-all-btn'),
      settingsStatus: document.getElementById('settings-status'),

      // Toast Notification
      toastNotification: document.getElementById('toast-notification'),
      toastMessage: document.getElementById('toast-message'),
      toastIcon: document.getElementById('toast-icon'),

      // Brand channels, languages, and sports elements
      brandHubCards: document.querySelectorAll('.brand-hub-card'),
      languagePills: document.querySelectorAll('.language-pill'),
      sportsCards: document.querySelectorAll('.sports-card'),
      sportsRowWrapper: document.getElementById('sports-row-wrapper')
    };

    this.init();
  }

  // --- Initial Setup ---
  init() {
    this.loadState();
    this.setupEventListeners();
    this.applySettingsUI();
    
    // Fake loading screen for high-fidelity feel, then build categories
    setTimeout(() => {
      this.dom.loader.classList.add('fade-out');
      this.loadDashboard();
    }, 800);
  }

  // --- Load LocalStorage Database State ---
  loadState() {
    // 1. Load Watchlist
    const savedWatchlist = localStorage.getItem('ss_watchlist');
    this.watchlist = savedWatchlist ? JSON.parse(savedWatchlist) : [];

    // 2. Load Watch History
    const savedHistory = localStorage.getItem('ss_history');
    this.history = savedHistory ? JSON.parse(savedHistory) : [];

    // 3. Load Settings
    const savedSettings = localStorage.getItem('ss_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
    
    // Initialize API Client
    APIClient.setKeys(this.settings.keys);
  }

  // --- Save Database State ---
  saveState() {
    localStorage.setItem('ss_watchlist', JSON.stringify(this.watchlist));
    localStorage.setItem('ss_history', JSON.stringify(this.history));
    localStorage.setItem('ss_settings', JSON.stringify(this.settings));
  }

  // --- Apply Settings State to UI Controls ---
  applySettingsUI() {
    this.dom.apiModeToggle.checked = this.settings.apiMode;
    this.dom.ytApiKeyInput.value = this.settings.keys.youtube || '';
    this.dom.vimeoTokenInput.value = this.settings.keys.vimeo || '';
    this.updateSettingsView();
  }

  updateSettingsView() {
    const isLive = this.dom.apiModeToggle.checked;
    this.dom.apiModeLabel.textContent = isLive ? 'Live API Mode Active' : 'Demo Mode Active';
    this.dom.apiModeLabel.style.color = isLive ? 'var(--accent-primary)' : 'var(--text-secondary)';
    
    if (isLive) {
      this.dom.apiCredentialsSection.style.display = 'block';
    } else {
      this.dom.apiCredentialsSection.style.display = 'none';
    }
  }

  // --- Event Bindings ---
  setupEventListeners() {
    // Scroll header background behavior
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.dom.header.classList.add('scrolled');
      } else {
        this.dom.header.classList.remove('scrolled');
      }
    });

    // Logo routing
    this.dom.logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateTo('home');
    });

    // Navigation routing links
    this.dom.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.navigateTo(target);
      });
    });

    // Global Search Interactions
    this.dom.searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length > 0) {
        this.dom.searchClearBtn.style.display = 'block';
      } else {
        this.dom.searchClearBtn.style.display = 'none';
      }
      this.triggerSearch(value);
    });

    this.dom.searchClearBtn.addEventListener('click', () => {
      this.dom.searchInput.value = '';
      this.dom.searchClearBtn.style.display = 'none';
      this.triggerSearch('');
      this.dom.searchInput.focus();
    });

    // Navigation filters chips bar
    this.dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activePlatformFilter = chip.getAttribute('data-platform');
        
        // Trigger filter refresh depending on page
        this.refreshActivePageContent();
      });
    });

    // Billboard / Spotlight Button Actions
    this.dom.heroPlayBtn.addEventListener('click', () => {
      const heroVideo = window.mockVideos.find(v => v.featured) || window.mockVideos[0];
      this.openPlayer(heroVideo);
    });

    this.dom.heroWatchlistBtn.addEventListener('click', () => {
      const heroVideo = window.mockVideos.find(v => v.featured) || window.mockVideos[0];
      this.toggleWatchlist(heroVideo);
      this.updateHeroWatchlistButton(heroVideo);
    });

    // Video Player Modal controls
    this.dom.playerCloseBtn.addEventListener('click', () => this.closePlayer());
    this.dom.playerModal.addEventListener('click', (e) => {
      if (e.target === this.dom.playerModal) this.closePlayer();
    });

    // Settings modal interactions
    this.dom.settingsToggle.addEventListener('click', () => {
      this.dom.settingsModal.classList.add('active');
    });

    this.dom.settingsCloseBtn.addEventListener('click', () => {
      this.dom.settingsModal.classList.remove('active');
      this.applySettingsUI(); // rollback changes not saved
    });

    this.dom.settingsCancelBtn.addEventListener('click', () => {
      this.dom.settingsModal.classList.remove('active');
      this.applySettingsUI();
    });

    this.dom.apiModeToggle.addEventListener('change', () => this.updateSettingsView());

    this.dom.settingsSaveBtn.addEventListener('click', () => this.saveSettings());

    this.dom.resetAllBtn.addEventListener('click', () => this.resetAllData());

    this.dom.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Connect slider controls to horizontal scroll rows
    document.querySelectorAll('.carousel-container').forEach(container => {
      const carousel = container.querySelector('.video-carousel');
      const leftBtn = container.querySelector('.left-arrow');
      const rightBtn = container.querySelector('.right-arrow');

      if (!carousel) return;

      const updateArrows = () => {
        if (leftBtn) leftBtn.disabled = carousel.scrollLeft <= 2;
        if (rightBtn) {
          const maxScroll = carousel.scrollWidth - carousel.clientWidth;
          rightBtn.disabled = carousel.scrollLeft >= maxScroll - 2;
        }
      };

      carousel.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', updateArrows);

      if (leftBtn) {
        leftBtn.addEventListener('click', () => {
          carousel.scrollBy({ left: -carousel.offsetWidth * 0.75, behavior: 'smooth' });
        });
      }

      if (rightBtn) {
        rightBtn.addEventListener('click', () => {
          carousel.scrollBy({ left: carousel.offsetWidth * 0.75, behavior: 'smooth' });
        });
      }

      // Initial check
      setTimeout(updateArrows, 500);
    });

    // Platforms card page filters links
    this.dom.platformCards.forEach(card => {
      card.addEventListener('click', () => {
        const platform = card.getAttribute('data-platform');
        
        // Emulate filter click bar action
        const matchedChip = Array.from(this.dom.filterChips).find(chip => chip.getAttribute('data-platform') === platform);
        if (matchedChip) {
          matchedChip.click();
        }
      });
    });

    // JioHotstar Brand Hub Cards Click Filtering
    this.dom.brandHubCards.forEach(card => {
      card.addEventListener('click', () => {
        const brand = card.getAttribute('data-brand');
        
        // Remove active states from header filter chips
        this.dom.filterChips.forEach(c => c.classList.remove('active'));
        
        if (brand === 'youtube' || brand === 'vimeo' || brand === 'dailymotion') {
          this.activePlatformFilter = brand;
          this.activeBrandFilter = 'all';
          const matchedChip = Array.from(this.dom.filterChips).find(chip => chip.getAttribute('data-platform') === brand);
          if (matchedChip) matchedChip.classList.add('active');
        } else {
          this.activePlatformFilter = 'all';
          this.activeBrandFilter = brand; // 'ss_studios' or 'sports'
        }
        
        this.navigateTo('platforms');
      });
    });

    // Zee5 Language Pills Click Filtering
    this.dom.languagePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.languagePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        this.activeLanguageFilter = pill.getAttribute('data-lang');
        this.loadDashboard();
      });
    });

    // Live Sports Scorecard Highlight Playback Trigger
    this.dom.sportsCards.forEach(card => {
      card.addEventListener('click', () => {
        const videoId = card.getAttribute('data-id');
        const sportsVideo = window.mockVideos.find(v => v.id === videoId);
        if (sportsVideo) {
          this.openPlayer(sportsVideo);
        }
      });
    });
  }

  // --- Dynamic Dashboard Row Loaders ---
  async loadDashboard() {
    this.activePlatformFilter = 'all';
    this.dom.filterChips.forEach(c => c.classList.remove('active'));
    this.dom.filterChips[0].classList.add('active');

    // 1. Setup Auto-Rotating Slideshow
    if (this.heroSlideInterval) {
      clearInterval(this.heroSlideInterval);
    }
    this.heroSlides = window.mockVideos.filter(v => v.featured);
    if (this.heroSlides.length > 0) {
      this.renderBillboard(this.heroSlides[this.currentHeroSlideIndex]);
      this.startHeroSlideshow();
    } else {
      const heroVideo = window.mockVideos[0];
      this.renderBillboard(heroVideo);
    }

    // 2. Zee5 Languages Filter Helper
    const filterLang = (list) => {
      if (this.activeLanguageFilter === 'all') return list;
      return list.filter(v => v.language === this.activeLanguageFilter);
    };

    // 3. Render categories rows (filtered by language)
    this.renderRow('trending', filterLang(window.mockVideos.slice().sort(() => 0.5 - Math.random())));
    this.renderRow('scifi', filterLang(window.mockVideos.filter(v => v.category === 'Sci-Fi & Space')));
    this.renderRow('nature', filterLang(window.mockVideos.filter(v => v.category === 'Nature & Wildlife')));
    this.renderRow('animation', filterLang(window.mockVideos.filter(v => v.category === 'Short Films & Animation')));
    this.renderRow('music', filterLang(window.mockVideos.filter(v => v.category === 'Music & Shows')));

    // Hide or show rows that might become empty
    ['trending', 'scifi', 'nature', 'animation', 'music'].forEach(rowName => {
      const carousel = document.getElementById(`${rowName}-carousel`);
      const rowWrapper = carousel?.closest('.category-row-wrapper');
      if (rowWrapper) {
        const hasCards = carousel.children.length > 0 && !carousel.querySelector('.empty-state');
        rowWrapper.style.display = hasCards ? 'block' : 'none';
      }
    });

    // 4. Handle Live Sports scorecard row visibility (Show on English, Hindi, Spanish, All)
    if (this.activeLanguageFilter === 'all' || this.activeLanguageFilter === 'Hindi' || this.activeLanguageFilter === 'Spanish' || this.activeLanguageFilter === 'English') {
      this.dom.sportsRowWrapper.style.display = 'block';
    } else {
      this.dom.sportsRowWrapper.style.display = 'none';
    }

    this.refreshWatchlistRow();
    this.refreshHistoryRow();

    // 5. If Live API mode is enabled, pull actual trending in background
    if (this.settings.apiMode) {
      try {
        const liveTrending = await APIClient.getTrending({
          youtube: !!this.settings.keys.youtube,
          vimeo: !!this.settings.keys.vimeo,
          dailymotion: true
        });
        if (liveTrending.length > 0) {
          this.activeTrendingVideos = liveTrending;
          this.renderRow('trending', filterLang(liveTrending));
        }
      } catch (e) {
        console.error('Failed fetching live trending videos', e);
      }
    }
  }

  // --- Start Slideshow timer ---
  startHeroSlideshow() {
    this.heroSlideInterval = setInterval(() => {
      if (this.heroSlides && this.heroSlides.length > 0) {
        this.currentHeroSlideIndex = (this.currentHeroSlideIndex + 1) % this.heroSlides.length;
        this.renderBillboard(this.heroSlides[this.currentHeroSlideIndex], true);
      }
    }, 7000);
  }

  // --- Render Spotlight Banner ---
  renderBillboard(video, fromTimer = false) {
    if (!video) return;

    // Reset slide interval on manual clicks to prevent rapid scrolling
    if (!fromTimer && this.heroSlideInterval) {
      clearInterval(this.heroSlideInterval);
      this.startHeroSlideshow();
    }

    this.dom.heroBgImage.style.backgroundImage = `url('${video.thumbnail}')`;
    this.dom.heroTitle.textContent = video.title;
    this.dom.heroMatch.textContent = video.matchScore;
    this.dom.heroYear.textContent = video.year;
    this.dom.heroRating.textContent = video.rating;
    this.dom.heroDescription.textContent = video.description;
    
    // Set platform icon badge
    const platformIconHtml = this.getPlatformIconHTML(video.platform);
    this.dom.heroPlatformBadge.innerHTML = `${platformIconHtml} ${video.platform.toUpperCase()}`;

    // Update play action binding
    this.dom.heroPlayBtn.onclick = () => {
      this.openPlayer(video);
    };

    this.dom.heroWatchlistBtn.onclick = () => {
      this.toggleWatchlist(video);
      this.updateHeroWatchlistButton(video);
    };

    this.updateHeroWatchlistButton(video);
  }

  updateHeroWatchlistButton(video) {
    if (!video) return;
    const isAdded = this.watchlist.some(v => v.id === video.id && v.platform === video.platform);
    if (isAdded) {
      this.dom.heroWatchlistBtn.innerHTML = `<i class="fas fa-check"></i> In My List`;
      this.dom.heroWatchlistBtn.classList.add('btn-primary');
      this.dom.heroWatchlistBtn.classList.remove('btn-secondary');
    } else {
      this.dom.heroWatchlistBtn.innerHTML = `<i class="fas fa-plus"></i> My List`;
      this.dom.heroWatchlistBtn.classList.add('btn-secondary');
      this.dom.heroWatchlistBtn.classList.remove('btn-primary');
    }
  }

  // --- Render Row Lists (Horizontal Scroll Carousel) ---
  renderRow(rowName, videos) {
    const container = document.getElementById(`${rowName}-carousel`);
    if (!container) return;

    container.innerHTML = '';
    
    if (videos.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding: 2rem 0; width:100%;">No videos available</div>';
      return;
    }

    videos.forEach(video => {
      const card = this.createVideoCard(video);
      container.appendChild(card);
    });

    // Trigger arrow visibility updates
    const carouselContainer = container.closest('.carousel-container');
    if (carouselContainer) {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    }
  }

  // --- Create Beautiful Video Cards HTML ---
  createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-id', video.id);
    card.setAttribute('data-platform', video.platform);

    const platformIcon = this.getPlatformIconHTML(video.platform);
    const platformClass = video.platform === 'youtube' ? 'color-yt' : (video.platform === 'vimeo' ? 'color-vimeo' : 'color-dm');

    card.innerHTML = `
      <div class="card-thumbnail-wrapper">
        <img class="card-thumbnail" src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        <div class="card-badge"><span class="${platformClass}">${platformIcon}</span></div>
        <div class="card-duration">${video.duration}</div>
        
        <div class="card-info-overlay">
          <h3 class="card-title">${video.title}</h3>
          <div class="card-metadata">
            <span class="match-score">${video.matchScore}</span>
            <span class="card-year">${video.year}</span>
            <span class="meta-rating">${video.rating}</span>
          </div>
          <div class="card-channel">
            <i class="fas fa-user-circle"></i>
            <span>${video.channelName}</span>
          </div>
        </div>
      </div>
    `;

    // Click handler triggers cinema player modal
    card.addEventListener('click', () => this.openPlayer(video));

    return card;
  }

  getPlatformIconHTML(platform) {
    switch(platform) {
      case 'youtube': return '<i class="fab fa-youtube"></i>';
      case 'vimeo': return '<i class="fab fa-vimeo-v"></i>';
      case 'dailymotion': return '<i class="fas fa-play-circle"></i>';
      default: return '<i class="fas fa-play"></i>';
    }
  }

  // --- Sub-View Refresh Helpers ---
  refreshWatchlistRow() {
    if (this.watchlist.length > 0) {
      this.dom.watchlistRowWrapper.style.display = 'block';
      this.renderRow('watchlist', this.watchlist);
    } else {
      this.dom.watchlistRowWrapper.style.display = 'none';
    }
  }

  refreshHistoryRow() {
    if (this.history.length > 0) {
      this.dom.historyRowWrapper.style.display = 'block';
      this.renderRow('history', this.history);
    } else {
      this.dom.historyRowWrapper.style.display = 'none';
    }
  }

  refreshActivePageContent() {
    if (this.currentView === 'platforms') {
      this.renderPlatformsPage();
    } else if (this.currentView === 'home' && this.dom.searchInput.value.length > 0) {
      this.triggerSearch(this.dom.searchInput.value);
    }
  }

  // --- Routing View Control ---
  navigateTo(viewName) {
    this.currentView = viewName;
    
    if (viewName !== 'platforms') {
      this.activeBrandFilter = 'all';
    }

    // Reset Search Input if moving away from home
    if (viewName !== 'home') {
      this.dom.searchInput.value = '';
      this.dom.searchClearBtn.style.display = 'none';
      this.dom.searchResultsSection.style.display = 'none';
      this.dom.heroBillboard.style.display = 'flex';
      // Hide filter bar on standard My List / History subpages to keep layout clean
      this.dom.filterBar.style.display = 'none';
    } else {
      this.dom.filterBar.style.display = 'flex';
    }

    // Toggle active link visual elements
    this.dom.navLinks.forEach(link => {
      if (link.getAttribute('data-target') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all views
    this.dom.browsePage.classList.remove('active-view');
    this.dom.watchlistPage.style.display = 'none';
    this.dom.historyPage.style.display = 'none';
    this.dom.platformsPage.style.display = 'none';

    this.dom.browsePage.style.display = 'none';

    // Show active view
    if (viewName === 'home') {
      this.dom.browsePage.style.display = 'block';
      this.dom.browsePage.classList.add('active-view');
      this.loadDashboard();
    } else if (viewName === 'watchlist') {
      this.dom.watchlistPage.style.display = 'block';
      this.renderWatchlistPage();
    } else if (viewName === 'history') {
      this.dom.historyPage.style.display = 'block';
      this.renderHistoryPage();
    } else if (viewName === 'platforms') {
      this.dom.platformsPage.style.display = 'block';
      this.dom.filterBar.style.display = 'flex'; // show platform bar
      this.renderPlatformsPage();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Watchlist Page Grid Renderer ---
  renderWatchlistPage() {
    this.dom.watchlistGrid.innerHTML = '';
    
    if (this.watchlist.length === 0) {
      this.dom.watchlistEmptyState.style.display = 'flex';
      this.dom.watchlistGrid.style.display = 'none';
    } else {
      this.dom.watchlistEmptyState.style.display = 'none';
      this.dom.watchlistGrid.style.display = 'grid';
      
      this.watchlist.forEach(video => {
        const card = this.createVideoCard(video);
        this.dom.watchlistGrid.appendChild(card);
      });
    }
  }

  // --- History Page Grid Renderer ---
  renderHistoryPage() {
    this.dom.historyGrid.innerHTML = '';
    
    if (this.history.length === 0) {
      this.dom.historyEmptyState.style.display = 'flex';
      this.dom.historyGrid.style.display = 'none';
      this.dom.clearHistoryBtn.style.display = 'none';
    } else {
      this.dom.historyEmptyState.style.display = 'none';
      this.dom.historyGrid.style.display = 'grid';
      this.dom.clearHistoryBtn.style.display = 'inline-block';
      
      this.history.forEach(video => {
        const card = this.createVideoCard(video);
        this.dom.historyGrid.appendChild(card);
      });
    }
  }

  // --- Platforms Page Showcase Renderer ---
  renderPlatformsPage() {
    this.dom.platformsGrid.innerHTML = '';
    
    let filtered = window.mockVideos;
    let subtitleText = '';

    if (this.activeBrandFilter === 'ss_studios') {
      filtered = window.mockVideos.filter(v => v.category === 'Short Films & Animation' || v.category === 'Sci-Fi & Space');
      subtitleText = 'S.S. Studios Originals';
    } else if (this.activeBrandFilter === 'sports') {
      filtered = window.mockVideos.filter(v => v.isSports === true);
      subtitleText = 'Sports Highlights & Events';
    } else {
      const filter = this.activePlatformFilter;
      subtitleText = filter === 'all' 
        ? 'All Sourced Videos' 
        : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Channel`;

      if (filter !== 'all') {
        filtered = window.mockVideos.filter(v => v.platform === filter);
      }
    }

    // Apply active language filter if selected
    if (this.activeLanguageFilter !== 'all') {
      filtered = filtered.filter(v => v.language === this.activeLanguageFilter);
    }

    this.dom.platformSubtitle.textContent = subtitleText;

    if (filtered.length === 0) {
      this.dom.platformsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fas fa-video-slash"></i>
          <h3>No videos found</h3>
          <p>No content matching this channel in ${this.activeLanguageFilter} was found.</p>
        </div>`;
      return;
    }

    filtered.forEach(video => {
      const card = this.createVideoCard(video);
      this.dom.platformsGrid.appendChild(card);
    });
  }

  // --- Universal Player Control (Open/Play) ---
  openPlayer(video) {
    this.currentVideo = video;
    
    // Playback Embed logic
    let embedUrl = '';
    if (video.platform === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;
    } else if (video.platform === 'vimeo') {
      embedUrl = `https://player.vimeo.com/video/${video.id}?autoplay=1&dnt=1`;
    } else if (video.platform === 'dailymotion') {
      embedUrl = `https://www.dailymotion.com/embed/video/${video.id}?autoplay=1&queue-enable=false`;
    }

    // Set modal content details
    this.dom.playerIframeWrapper.innerHTML = `
      <iframe src="${embedUrl}" 
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media" 
              allowfullscreen>
      </iframe>`;

    this.dom.playerTitle.textContent = video.title;
    this.dom.playerDescription.textContent = video.description;
    this.dom.playerChannel.textContent = video.channelName;
    this.dom.playerViews.textContent = video.views.includes('views') ? video.views : `${video.views} views`;
    this.dom.playerDate.textContent = this.formatReadableDate(video.uploadDate);
    
    this.dom.playerMatch.textContent = video.matchScore;
    this.dom.playerYear.textContent = video.year;
    this.dom.playerRating.textContent = video.rating;
    this.dom.playerDuration.textContent = video.duration;

    const platformIcon = this.getPlatformIconHTML(video.platform);
    this.dom.playerPlatform.innerHTML = `${platformIcon} ${video.platform.toUpperCase()}`;
    const badgeColorClass = video.platform === 'youtube' ? 'bg-yt' : (video.platform === 'vimeo' ? 'bg-vimeo' : 'bg-dm');
    this.dom.playerPlatform.className = `platform-badge ${badgeColorClass}`;

    // Add to history database
    this.addToHistory(video);

    // Sync watchlist modal toggle button status
    this.updatePlayerWatchlistButtonState();

    // Render Modal recommendations row
    this.renderRecommendations(video);

    // Show modal dialog overlay
    this.dom.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Share buttons dynamic configs
    const shareText = encodeURIComponent(`Watching "${video.title}" on S.S. Video Discovery Platform!`);
    const shareUrl = encodeURIComponent(window.location.href);
    this.dom.shareLink.onclick = () => this.copyToClipboard(video);
    this.dom.shareTwitter.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    this.dom.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    
    // Bind modal watchlist click action
    this.dom.playerWatchlistBtn.onclick = () => {
      this.toggleWatchlist(video);
      this.updatePlayerWatchlistButtonState();
    };
  }

  closePlayer() {
    this.dom.playerModal.classList.remove('active');
    this.dom.playerIframeWrapper.innerHTML = '';
    document.body.style.overflow = 'auto';
    this.currentVideo = null;
  }

  // --- Modal recommendations matcher ---
  renderRecommendations(currentVideo) {
    this.dom.recommendationsGrid.innerHTML = '';

    // Filter videos excluding current, prioritizing platform matching
    let matches = window.mockVideos.filter(v => v.id !== currentVideo.id && v.platform === currentVideo.platform);
    
    if (matches.length < 3) {
      const categoryMatches = window.mockVideos.filter(v => v.id !== currentVideo.id && v.category === currentVideo.category && v.platform !== currentVideo.platform);
      matches = [...matches, ...categoryMatches];
    }

    // fallback filler if sparse database
    if (matches.length < 3) {
      const defaults = window.mockVideos.filter(v => v.id !== currentVideo.id && !matches.some(m => m.id === v.id));
      matches = [...matches, ...defaults];
    }

    // Limit cards count to 3
    matches.slice(0, 3).forEach(video => {
      const card = this.createVideoCard(video);
      
      // Override standard card sizes inside player modal
      card.style.flex = 'none';
      card.style.width = '100%';

      this.dom.recommendationsGrid.appendChild(card);
    });
  }

  // --- Watchlist toggling controls ---
  toggleWatchlist(video) {
    const index = this.watchlist.findIndex(v => v.id === video.id && v.platform === video.platform);
    let message = '';
    let isAdded = false;

    if (index > -1) {
      this.watchlist.splice(index, 1);
      message = `Removed "${this.truncateText(video.title, 25)}" from My List`;
      isAdded = false;
    } else {
      this.watchlist.push(video);
      message = `Added "${this.truncateText(video.title, 25)}" to My List`;
      isAdded = true;
    }

    this.saveState();
    this.showToast(message, isAdded);

    // Refresh rows & details views
    this.refreshWatchlistRow();
    
    if (this.currentView === 'watchlist') {
      this.renderWatchlistPage();
    }
  }

  updatePlayerWatchlistButtonState() {
    const video = this.currentVideo;
    if (!video) return;

    const isAdded = this.watchlist.some(v => v.id === video.id && v.platform === video.platform);
    if (isAdded) {
      this.dom.playerWatchlistBtn.innerHTML = `<i class="fas fa-check"></i> Added to List`;
      this.dom.playerWatchlistBtn.className = 'btn btn-primary btn-full';
    } else {
      this.dom.playerWatchlistBtn.innerHTML = `<i class="fas fa-plus"></i> Add to List`;
      this.dom.playerWatchlistBtn.className = 'btn btn-secondary btn-full';
    }
  }

  // --- History Controls ---
  addToHistory(video) {
    const index = this.history.findIndex(v => v.id === video.id && v.platform === video.platform);
    if (index > -1) {
      this.history.splice(index, 1); // remove duplicate
    }
    
    // Add to top
    this.history.unshift(video);
    
    // Limit count to 15
    if (this.history.length > 15) {
      this.history.pop();
    }

    this.saveState();
    this.refreshHistoryRow();
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear your watching history?')) {
      this.history = [];
      this.saveState();
      this.refreshHistoryRow();
      
      if (this.currentView === 'history') {
        this.renderHistoryPage();
      }
      this.showToast('Watching history cleared successfully', false);
    }
  }

  // --- Search Input Filtering Engine ---
  triggerSearch(query) {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.executeSearch(query.trim());
    }, 350);
  }

  async executeSearch(query) {
    if (!query) {
      this.dom.searchResultsSection.style.display = 'none';
      this.dom.heroBillboard.style.display = 'flex';
      // reveal default categories
      document.querySelectorAll('.category-rows-container > .category-row-wrapper').forEach(row => {
        if (row !== this.dom.searchResultsSection) {
          // preserve watchlist / history visibility checks
          if (row === this.dom.watchlistRowWrapper) {
            row.style.display = this.watchlist.length > 0 ? 'block' : 'none';
          } else if (row === this.dom.historyRowWrapper) {
            row.style.display = this.history.length > 0 ? 'block' : 'none';
          } else {
            row.style.display = 'block';
          }
        }
      });
      return;
    }

    // Hide normal categories & Hero Banner during searches
    this.dom.heroBillboard.style.display = 'none';
    document.querySelectorAll('.category-rows-container > .category-row-wrapper').forEach(row => {
      if (row !== this.dom.searchResultsSection) {
        row.style.display = 'none';
      }
    });

    this.dom.searchResultsSection.style.display = 'block';
    this.dom.searchQueryText.textContent = query;
    this.dom.searchResultsGrid.innerHTML = '<div class="loader-spinner" style="margin: 3rem auto; grid-column: 1/-1;"></div>';
    this.dom.searchEmptyState.style.display = 'none';

    let results = [];

    // Filter platform if user selected platform filter bar chip
    const filterPlatform = this.activePlatformFilter;

    if (this.settings.apiMode) {
      // LIVE API Mode
      try {
        const liveResults = await APIClient.search(query, {
          youtube: filterPlatform === 'all' || filterPlatform === 'youtube',
          vimeo: filterPlatform === 'all' || filterPlatform === 'vimeo',
          dailymotion: filterPlatform === 'all' || filterPlatform === 'dailymotion'
        });
        results = liveResults;
      } catch (err) {
        console.error('Live search error, falling back to local matches', err);
        results = this.searchLocalMockData(query, filterPlatform);
      }
    } else {
      // DEMO Mode (Query mock database + public live Dailymotion since it works keyless)
      const localResults = this.searchLocalMockData(query, filterPlatform);
      results = [...localResults];

      if (filterPlatform === 'all' || filterPlatform === 'dailymotion') {
        try {
          const liveDM = await APIClient.fetchDailymotion('/videos', { search: query, limit: 8 });
          // append and avoid duplicated mock videos
          liveDM.forEach(dm => {
            if (!results.some(r => r.id === dm.id && r.platform === 'dailymotion')) {
              results.push(dm);
            }
          });
        } catch (e) {
          console.warn('Failed querying keyless public Dailymotion during demo search', e);
        }
      }
    }

    // Sort results by matching score or platform preference
    results.sort(() => 0.5 - Math.random());

    this.dom.searchResultsGrid.innerHTML = '';
    
    if (results.length === 0) {
      this.dom.searchEmptyState.style.display = 'block';
    } else {
      this.dom.searchEmptyState.style.display = 'none';
      results.forEach(video => {
        const card = this.createVideoCard(video);
        this.dom.searchResultsGrid.appendChild(card);
      });
    }
  }

  searchLocalMockData(query, platform) {
    const q = query.toLowerCase();
    return window.mockVideos.filter(video => {
      // platform filter match
      if (platform !== 'all' && video.platform !== platform) return false;

      // field search query match
      return (
        video.title.toLowerCase().includes(q) ||
        video.description.toLowerCase().includes(q) ||
        video.channelName.toLowerCase().includes(q) ||
        video.category.toLowerCase().includes(q)
      );
    });
  }

  // --- Save Configurations ---
  saveSettings() {
    const apiMode = this.dom.apiModeToggle.checked;
    const youtubeKey = this.dom.ytApiKeyInput.value.trim();
    const vimeoToken = this.dom.vimeoTokenInput.value.trim();

    this.settings.apiMode = apiMode;
    this.settings.keys.youtube = youtubeKey;
    this.settings.keys.vimeo = vimeoToken;

    this.saveState();
    APIClient.setKeys(this.settings.keys);

    // Visual save alert
    this.dom.settingsStatus.textContent = 'Configuration saved!';
    setTimeout(() => {
      this.dom.settingsStatus.textContent = '';
      this.dom.settingsModal.classList.remove('active');
      
      // Reload lists using new mode settings
      this.dom.loader.classList.remove('fade-out');
      setTimeout(() => {
        this.dom.loader.classList.add('fade-out');
        this.loadDashboard();
      }, 500);

    }, 1000);
  }

  // --- Clear local configurations ---
  resetAllData() {
    if (confirm('CAUTION: This will delete your Watchlist, Watch History, and API configurations. Continue?')) {
      localStorage.removeItem('ss_watchlist');
      localStorage.removeItem('ss_history');
      localStorage.removeItem('ss_settings');

      this.watchlist = [];
      this.history = [];
      this.settings = {
        apiMode: false,
        keys: { youtube: '', vimeo: '' }
      };

      APIClient.setKeys(this.settings.keys);
      this.applySettingsUI();
      this.saveState();

      this.dom.settingsModal.classList.remove('active');
      
      this.dom.loader.classList.remove('fade-out');
      setTimeout(() => {
        this.dom.loader.classList.add('fade-out');
        this.navigateTo('home');
      }, 600);

      this.showToast('Application database reset successfully', false);
    }
  }

  // --- Toast notifications animator ---
  showToast(message, isAdded) {
    this.dom.toastMessage.textContent = message;
    
    if (isAdded) {
      this.dom.toastIcon.className = 'fas fa-check-circle';
      this.dom.toastIcon.style.color = '#4ade80';
    } else {
      this.dom.toastIcon.className = 'fas fa-info-circle';
      this.dom.toastIcon.style.color = 'var(--accent-primary)';
    }

    this.dom.toastNotification.classList.add('active');
    
    setTimeout(() => {
      this.dom.toastNotification.classList.remove('active');
    }, 2800);
  }

  // --- Utility functions ---
  formatReadableDate(dateString) {
    if (!dateString || dateString === 'Recently') return 'Recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  truncateText(text, length) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  async copyToClipboard(video) {
    const text = `${window.location.origin}${window.location.pathname}?video=${video.id}&platform=${video.platform}`;
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied watch link to clipboard', true);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  }
}

// Instantiate global app controller
window.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  
  // Handle sharing deep link query parameters if any (e.g. ?video=123&platform=youtube)
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('video');
  const platform = urlParams.get('platform');
  
  if (videoId && platform) {
    // Wait for mockVideos library load
    setTimeout(() => {
      // Find matching mock or build generic video schema
      let matched = window.mockVideos.find(v => v.id === videoId && v.platform === platform);
      if (!matched) {
        matched = {
          id: videoId,
          platform: platform,
          title: 'Shared Video Link',
          description: 'Custom shared playback link from S.S. Platform.',
          thumbnail: platform === 'youtube' ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '',
          channelName: 'External Creator',
          uploadDate: 'Recently',
          duration: '3:00',
          views: '100K',
          category: 'Shared',
          matchScore: '98% Match',
          year: '2026',
          rating: 'PG'
        };
      }
      window.appController.openPlayer(matched);
    }, 1200);
  }
});

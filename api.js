/**
 * S.S. Video Discovery Platform - API Client
 * Coordinates live requests to Dailymotion, YouTube, and Vimeo.
 */

const APIClient = {
  // Configured dynamically from settings / localStorage
  keys: {
    youtube: '',
    vimeo: '',
    dailymotion: '' // Optional for DM, as we can query publicly
  },

  setKeys(keys) {
    this.keys = { ...this.keys, ...keys };
  },

  // Helper: Format duration in seconds to "MM:SS" or "H:MM:SS"
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${mins}:${pad(secs)}`;
  },

  // Helper: Format large numbers to readable strings (e.g. 1.2M, 450K)
  formatViews(count) {
    if (!count) return '0';
    const num = Number(count);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return String(num);
  },

  // --- DAILYMOTION API (Publicly available, no key needed) ---
  async fetchDailymotion(endpoint, params = {}) {
    const baseUrl = 'https://api.dailymotion.com';
    const queryParams = new URLSearchParams({
      fields: 'id,title,thumbnail_720_url,created_time,owner.username,owner.screenname,views_total,description,duration',
      ...params
    });

    try {
      const response = await fetch(`${baseUrl}${endpoint}?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`Dailymotion API Error: ${response.statusText}`);
      const data = await response.json();
      
      return (data.list || []).map(item => ({
        id: item.id,
        platform: 'dailymotion',
        title: item.title,
        description: item.description || 'No description available for this Dailymotion video.',
        thumbnail: `https://www.dailymotion.com/thumbnail/video/${item.id}`,
        channelName: item['owner.screenname'] || item['owner.username'] || 'Dailymotion Creator',
        uploadDate: item.created_time ? new Date(item.created_time * 1000).toISOString().split('T')[0] : 'Recently',
        duration: this.formatDuration(item.duration),
        views: this.formatViews(item.views_total),
        category: 'Dailymotion Trends',
        matchScore: `${Math.floor(Math.random() * 15) + 85}% Match`,
        year: item.created_time ? new Date(item.created_time * 1000).getFullYear().toString() : '2026',
        rating: 'PG'
      }));
    } catch (error) {
      console.error('Error fetching Dailymotion data:', error);
      return [];
    }
  },

  // --- YOUTUBE API (Requires API Key) ---
  async fetchYouTube(endpoint, params = {}) {
    const key = this.keys.youtube;
    if (!key) {
      console.warn('YouTube API Key is missing. Skipping live YouTube request.');
      return [];
    }

    const baseUrl = 'https://www.googleapis.com/youtube/v3';
    const queryParams = new URLSearchParams({
      key,
      part: 'snippet',
      maxResults: 20,
      ...params
    });

    try {
      const response = await fetch(`${baseUrl}${endpoint}?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `YouTube API Error: ${response.statusText}`);
      }
      const data = await response.json();
      const items = data.items || [];

      // If we got items from search, we might want details to fetch statistics/view counts.
      // But to save API quota, we map them directly first. If statistics exist (e.g. from /videos), we use them.
      return items.map(item => {
        const id = typeof item.id === 'object' ? item.id.videoId : item.id;
        if (!id) return null; // Filter out channels/playlists if returned

        const snippet = item.snippet || {};
        const thumbs = snippet.thumbnails || {};
        const thumbnail = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || '';

        return {
          id,
          platform: 'youtube',
          title: snippet.title || 'Untitled Video',
          description: snippet.description || 'No description available.',
          thumbnail,
          channelName: snippet.channelTitle || 'YouTube Creator',
          uploadDate: snippet.publishedAt ? snippet.publishedAt.split('T')[0] : 'Recently',
          duration: '3:45', // Standard default as search doesn't return duration directly
          views: item.statistics ? this.formatViews(item.statistics.viewCount) : '240K',
          category: 'YouTube Live',
          matchScore: `${Math.floor(Math.random() * 15) + 85}% Match`,
          year: snippet.publishedAt ? new Date(snippet.publishedAt).getFullYear().toString() : '2026',
          rating: 'PG-13'
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      throw error; // Propagate error for UI indicator
    }
  },

  // --- VIMEO API (Requires Bearer Access Token) ---
  async fetchVimeo(endpoint, params = {}) {
    const token = this.keys.vimeo;
    if (!token) {
      console.warn('Vimeo Access Token is missing. Skipping live Vimeo request.');
      return [];
    }

    const baseUrl = 'https://api.vimeo.com';
    const queryParams = new URLSearchParams({
      per_page: 20,
      ...params
    });

    try {
      const response = await fetch(`${baseUrl}${endpoint}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Vimeo API Error: ${response.statusText}`);
      }
      const data = await response.json();
      const items = data.data || [];

      return items.map(item => {
        const uriParts = item.uri ? item.uri.split('/') : [];
        const id = uriParts[uriParts.length - 1];
        if (!id) return null;

        const thumbs = item.pictures?.sizes || [];
        const thumbnail = thumbs.length > 0 ? thumbs[thumbs.length - 1].link : '';

        return {
          id,
          platform: 'vimeo',
          title: item.name || 'Untitled Video',
          description: item.description || 'No description available for this Vimeo video.',
          thumbnail,
          channelName: item.user?.name || 'Vimeo Creator',
          uploadDate: item.created_time ? item.created_time.split('T')[0] : 'Recently',
          duration: this.formatDuration(item.duration),
          views: item.metadata?.connections?.metadata?.plays || item.stats?.plays 
            ? this.formatViews(item.metadata.connections.metadata.plays || item.stats.plays) 
            : '85K',
          category: 'Vimeo Live',
          matchScore: `${Math.floor(Math.random() * 15) + 85}% Match`,
          year: item.created_time ? new Date(item.created_time).getFullYear().toString() : '2026',
          rating: 'PG'
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error fetching Vimeo data:', error);
      throw error;
    }
  },

  // --- AGGREGATED METHODS ---

  // Get live trending videos across all available APIs
  async getTrending(livePlatforms = { youtube: false, vimeo: false, dailymotion: false }) {
    const results = [];
    
    // 1. Dailymotion is always available
    if (livePlatforms.dailymotion) {
      const dmVideos = await this.fetchDailymotion('/videos', { limit: 10 });
      results.push(...dmVideos);
    }

    // 2. YouTube if API key is provided & enabled
    if (livePlatforms.youtube && this.keys.youtube) {
      try {
        const ytVideos = await this.fetchYouTube('/videos', {
          chart: 'mostPopular',
          part: 'snippet,statistics',
          maxResults: 10
        });
        results.push(...ytVideos);
      } catch (err) {
        console.error('YouTube Live failed, continuing...', err);
      }
    }

    // 3. Vimeo if Token is provided & enabled
    if (livePlatforms.vimeo && this.keys.vimeo) {
      try {
        // Vimeo Staff Picks
        const vimeoVideos = await this.fetchVimeo('/channels/staffpicks/videos', { per_page: 10 });
        results.push(...vimeoVideos);
      } catch (err) {
        console.error('Vimeo Live failed, continuing...', err);
      }
    }

    return results.sort(() => 0.5 - Math.random()); // Shuffle trending
  },

  // Universal search across active APIs
  async search(query, livePlatforms = { youtube: false, vimeo: false, dailymotion: false }) {
    if (!query) return [];
    
    const promises = [];

    if (livePlatforms.dailymotion) {
      promises.push(this.fetchDailymotion('/videos', { search: query, limit: 12 }));
    }

    if (livePlatforms.youtube && this.keys.youtube) {
      promises.push(
        this.fetchYouTube('/search', { q: query, type: 'video', maxResults: 12 })
          .catch(err => {
            console.error('YouTube search failed', err);
            return [];
          })
      );
    }

    if (livePlatforms.vimeo && this.keys.vimeo) {
      promises.push(
        this.fetchVimeo('/videos', { query, per_page: 12 })
          .catch(err => {
            console.error('Vimeo search failed', err);
            return [];
          })
      );
    }

    const responses = await Promise.all(promises);
    return responses.flat();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient };
} else {
  window.APIClient = APIClient;
}

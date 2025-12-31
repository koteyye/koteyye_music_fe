import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Track, PlayerState } from '../types';
import { tracksAPI, userAPI } from '../api/client';

export const usePlayerStore = defineStore('player', () => {
  // State
  const currentTrack = ref<Track | null>(null);
  const isPlaying = ref(false);
  const volume = ref(1);
  const progress = ref(0);
  const duration = ref(0);

  // Queue state
  const queue = ref<Track[]>([]);
  const originalQueue = ref<Track[]>([]);
  const currentIndex = ref(-1);
  const isShuffled = ref(false);
  const isExpanded = ref(false);

  // Audio element
  let audio: HTMLAudioElement | null = null;

  // Analytics tracking
  let playTrackingTimer: number | null = null;
  const PLAY_THRESHOLD_SECONDS = 30;
  const hasRecordedPlay = ref(false);

  // Sync state
  const isInitialized = ref(false);
  const serverSyncEnabled = ref(false);
  let syncTimer: number | null = null;
  let volumeDebounceTimer: number | null = null;
  let progressSyncTimer: number | null = null;
  const VOLUME_DEBOUNCE_MS = 2000;
  const PROGRESS_SYNC_INTERVAL_MS = 30000;

  // Computed
  const progressPercent = computed(() => {
    if (duration.value === 0) return 0;
    return (progress.value / duration.value) * 100;
  });

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedProgress = computed(() => formatTime(progress.value));
  const formattedDuration = computed(() => formatTime(duration.value));

  // Initialize audio element
  const initializeAudio = () => {
    if (audio) {
      audio.pause();
      audio = null;
    }

    audio = new Audio();
    audio.volume = volume.value;

    // Time update event
    audio.addEventListener('timeupdate', () => {
      if (audio) {
        progress.value = audio.currentTime;
        duration.value = audio.duration || 0;
      }
    });

    // Ended event
    audio.addEventListener('ended', () => {
      isPlaying.value = false;
      hasRecordedPlay.value = false;
      clearPlayTracking();
      // Auto-next track when current track ends
      nextTrack();
    });

    // Error event
    audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
      isPlaying.value = false;
      hasRecordedPlay.value = false;
      clearPlayTracking();
    });
  };

  // Play tracking for analytics
  const startPlayTracking = () => {
    clearPlayTracking();
    hasRecordedPlay.value = false;

    if (currentTrack.value) {
      playTrackingTimer = window.setTimeout(async () => {
        if (isPlaying.value && currentTrack.value && !hasRecordedPlay.value) {
          try {
            await tracksAPI.recordPlay(currentTrack.value.id);
            hasRecordedPlay.value = true;
            console.log(`Play recorded for track: ${currentTrack.value.title}`);
          } catch (error) {
            console.error('Failed to record play:', error);
          }
        }
      }, PLAY_THRESHOLD_SECONDS * 1000);
    }
  };

  const clearPlayTracking = () => {
    if (playTrackingTimer !== null) {
      clearTimeout(playTrackingTimer);
      playTrackingTimer = null;
    }
  };

  // Actions
  const playTrack = (track: Track) => {
    // Check if it's the same track
    if (currentTrack.value?.id === track.id) {
      togglePlay();
      return;
    }

    // Update current index in queue if track is from queue
    const trackIndex = queue.value.findIndex(t => t.id === track.id);
    if (trackIndex !== -1) {
      currentIndex.value = trackIndex;
    }

    // Clear previous tracking
    clearPlayTracking();

    // Set new track
    currentTrack.value = track;
    progress.value = 0;
    hasRecordedPlay.value = false;

    // Initialize audio if needed
    if (!audio) {
      initializeAudio();
    }

    if (audio) {
      const streamUrl = tracksAPI.getStreamUrl(track.id);
      console.log('Setting audio source to:', streamUrl);
      
      // Сначала проверим доступность URL через fetch
      fetch(streamUrl)
        .then(response => {
          console.log('Stream URL response:', response.status, response.statusText);
          if (!response.ok) {
            console.warn('Stream URL not accessible, trying legacy endpoint');
            return fetch(tracksAPI.getLegacyStreamUrl(track.id));
          }
          return response;
        })
        .then(response => {
          if (response && !response.ok) {
            console.warn('Legacy URL also not accessible:', response.status);
            const legacyUrl = tracksAPI.getLegacyStreamUrl(track.id);
            console.log('Using legacy URL anyway:', legacyUrl);
            audio.src = legacyUrl;
          } else {
            audio.src = streamUrl;
          }
          
          return audio.play();
        })
        .then(() => {
          isPlaying.value = true;
          startPlayTracking();
        })
        .catch((error) => {
          console.error('Failed to play track:', error);
          console.error('Stream URL was:', streamUrl);
          
          // Последняя попытка с legacy URL
          const legacyUrl = tracksAPI.getLegacyStreamUrl(track.id);
          console.log('Last attempt with legacy URL:', legacyUrl);
          audio.src = legacyUrl;
          audio.play()
            .then(() => {
              console.log('Legacy URL worked!');
              isPlaying.value = true;
              startPlayTracking();
            })
            .catch(legacyError => {
              console.error('Legacy URL also failed:', legacyError);
              isPlaying.value = false;
            });
        });
    }
  };

  const togglePlay = () => {
    if (!audio || !currentTrack.value) return;

    if (isPlaying.value) {
      audio.pause();
      isPlaying.value = false;
      clearPlayTracking();
    } else {
      audio.play()
        .then(() => {
          isPlaying.value = true;
          startPlayTracking();
        })
        .catch((error) => {
          console.error('Failed to resume playback:', error);
          isPlaying.value = false;
        });
    }
  };

  const seek = (seconds: number) => {
    if (!audio) return;

    audio.currentTime = seconds;
    progress.value = seconds;
  };

  const seekByPercent = (percent: number) => {
    if (duration.value === 0) return;
    const seconds = (percent / 100) * duration.value;
    seek(seconds);
  };

  const setVolume = (newVolume: number) => {
    volume.value = Math.max(0, Math.min(1, newVolume));
    if (audio) {
      audio.volume = volume.value;
    }
  };

  const stop = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      progress.value = 0;
    }
    isPlaying.value = false;
    clearPlayTracking();
    hasRecordedPlay.value = false;
  };

  // Cleanup on store destruction
  // Queue management actions
  const setQueue = (tracks: Track[], startTrackId?: string) => {
    queue.value = [...tracks];
    originalQueue.value = [...tracks];
    
    if (startTrackId) {
      const startIndex = tracks.findIndex(track => track.id === startTrackId);
      if (startIndex !== -1) {
        currentIndex.value = startIndex;
        playTrack(tracks[startIndex]);
      }
    } else if (tracks.length > 0) {
      currentIndex.value = 0;
    }
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const toggleShuffle = () => {
    if (queue.value.length === 0) return;

    if (!isShuffled.value) {
      // Включаем shuffle
      const currentTrackObj = currentTrack.value;
      
      if (currentTrackObj) {
        // Убираем текущий трек из списка для перемешивания
        const tracksWithoutCurrent = queue.value.filter(track => track.id !== currentTrackObj.id);
        const shuffledTracks = shuffleArray(tracksWithoutCurrent);
        
        // Ставим текущий трек первым
        queue.value = [currentTrackObj, ...shuffledTracks];
        currentIndex.value = 0;
      } else {
        queue.value = shuffleArray(queue.value);
        currentIndex.value = 0;
      }
      
      isShuffled.value = true;
    } else {
      // Выключаем shuffle
      const currentTrackObj = currentTrack.value;
      queue.value = [...originalQueue.value];
      
      if (currentTrackObj) {
        const originalIndex = originalQueue.value.findIndex(track => track.id === currentTrackObj.id);
        if (originalIndex !== -1) {
          currentIndex.value = originalIndex;
        }
      }
      
      isShuffled.value = false;
    }
  };

  const nextTrack = () => {
    if (queue.value.length === 0) return;
    
    currentIndex.value = (currentIndex.value + 1) % queue.value.length;
    const nextTrack = queue.value[currentIndex.value];
    
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };

  const prevTrack = () => {
    if (queue.value.length === 0) return;
    
    currentIndex.value = currentIndex.value <= 0 ? queue.value.length - 1 : currentIndex.value - 1;
    const prevTrack = queue.value[currentIndex.value];
    
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };

  const playRandom = () => {
    if (!isShuffled.value) {
      toggleShuffle();
    }
    nextTrack();
  };

  // LocalStorage helpers
  const STORAGE_KEY = 'koteyye_player_state';
  
  const saveToLocalStorage = () => {
    if (!currentTrack.value) return;
    
    const state = {
      track: currentTrack.value,
      position: progress.value,
      volume: volume.value,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };
  
  const loadFromLocalStorage = (): { track: Track; position: number; volume: number } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      // Check if data is not too old (24 hours)
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return {
        track: state.track,
        position: state.position,
        volume: state.volume
      };
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  };

  // Validation helpers
  const validateUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };
  
  const validatePlayerStateData = (trackId: string, position: number, volumeLevel: number): boolean => {
    // Check UUID format
    if (!validateUUID(trackId)) {
      console.error('Track ID must be a valid UUID:', trackId);
      return false;
    }
    
    // Check position
    if (typeof position !== 'number' || position < 0) {
      console.error('Position must be a non-negative number:', position);
      return false;
    }
    
    // Check volume (0-100)
    const volumeInt = Math.round(volumeLevel);
    if (!Number.isInteger(volumeInt) || volumeInt < 0 || volumeInt > 100) {
      console.error('Volume must be an integer between 0 and 100:', volumeLevel);
      return false;
    }
    
    return true;
  };

  // Check if server sync is available
  const checkServerSyncAvailability = async () => {
    // Just assume server sync is available and handle errors gracefully
    // No test calls to avoid sending invalid data
    serverSyncEnabled.value = true;
  };

  // Pending state for batching
  let pendingState: Omit<PlayerState, 'updated_at'> | null = null;
  let batchTimer: number | null = null;
  
  // Batch updates to prevent too frequent requests
  const scheduleServerSync = (immediate = false) => {
    if (!currentTrack.value || !isInitialized.value || !serverSyncEnabled.value) return;
    
    // Convert volume from 0-1 to 0-100 for API
    const volumePercent = Math.round(volume.value * 100);
    
    // Validate data before scheduling
    if (!validatePlayerStateData(currentTrack.value.id, progress.value, volumePercent)) {
      return;
    }
    
    pendingState = {
      track_id: currentTrack.value.id,
      position: Math.max(0, progress.value), // Ensure non-negative
      volume: volumePercent
    };
    
    if (immediate) {
      flushServerSync();
      return;
    }
    
    // Batch updates - flush after 2 seconds
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = window.setTimeout(() => {
      flushServerSync();
    }, 2000);
  };
  
  // Actually send the request to server
  const flushServerSync = async () => {
    if (!pendingState || !serverSyncEnabled.value) return;
    
    const stateToSend = { ...pendingState };
    pendingState = null;
    
    try {
      // console.log('Syncing player state:', stateToSend);
      await userAPI.savePlayerState(stateToSend);
      // console.log('✅ Player state synced successfully');
    } catch (error: any) {
      // Handle different types of errors gracefully
      if (error?.response?.status === 404) {
        // Disable server sync if endpoint is not available
        serverSyncEnabled.value = false;
        // console.log('Player state sync not available on server');
        return;
      }
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        // Client error - likely invalid data
        console.error('❌ Player state sync failed - client error:', error?.response?.data?.error || error.message);
        return;
      }
      if (error?.response?.status >= 500) {
        // Server error
        console.error('❌ Player state sync failed - server error:', error?.response?.data?.error || error.message);
        return;
      }
      // Network or other errors
      console.error('❌ Player state sync failed:', error.message);
    }
  };

  // Legacy method for immediate sync (keeping for compatibility)
  const saveToServer = async (immediate = false) => {
    scheduleServerSync(immediate);
  };

  // Restore player state
  const restoreState = async (track: Track, position: number, volumeLevel: number) => {
    try {
      // Set track without starting playback
      currentTrack.value = track;
      volume.value = volumeLevel;
      progress.value = position;
      hasRecordedPlay.value = false;
      
      // Initialize audio if needed
      if (!audio) {
        initializeAudio();
      }
      
      if (audio) {
        audio.src = tracksAPI.getStreamUrl(track.id);
        audio.volume = volumeLevel;
        
        // Wait for metadata to load, then set position
        audio.addEventListener('loadedmetadata', () => {
          if (audio) {
            audio.currentTime = position;
            duration.value = audio.duration || 0;
          }
        }, { once: true });
        
        // Handle errors gracefully
        audio.addEventListener('error', () => {
          // Keep track visible even if audio fails
        }, { once: true });
        
        // Preload but don't play
        audio.preload = 'metadata';
        audio.load();
      }
    } catch (error) {
      console.error('Error in restoreState:', error);
      // Keep the track even if audio fails
      currentTrack.value = track;
    } finally {
      isInitialized.value = true;
    }
  };

  // Initialize from localStorage first, then server will override if needed
  const initializeFromStorage = async () => {
    if (isInitialized.value) return; // Already initialized
    
    const stored = loadFromLocalStorage();
    if (stored) {
      await restoreState(stored.track, stored.position, stored.volume);
    } else {
      isInitialized.value = true;
    }
    
    // Setup watchers and sync after initialization
    if (!syncTimer) {
      await checkServerSyncAvailability();
      setupProgressSync();
      setupUnloadHandler();
    }
  };

  const cleanup = () => {
    clearPlayTracking();
    
    // Clear all timers
    if (syncTimer) clearTimeout(syncTimer);
    if (batchTimer) clearTimeout(batchTimer);
    if (volumeDebounceTimer) clearTimeout(volumeDebounceTimer);
    if (progressSyncTimer) clearInterval(progressSyncTimer);
    
    // Flush any pending state immediately
    if (pendingState) {
      flushServerSync();
    }
    
    if (audio) {
      audio.pause();
      audio = null;
    }
    
    // Don't reset track state - keep it for when user returns
    // Only stop playback and clear audio
    isPlaying.value = false;
  };
  
  // Full cleanup for app shutdown
  const fullCleanup = () => {
    cleanup();
    
    // Reset all state
    currentTrack.value = null;
    progress.value = 0;
    duration.value = 0;
    queue.value = [];
    originalQueue.value = [];
    currentIndex.value = -1;
    isShuffled.value = false;
    isInitialized.value = false;
  };

  // Watch volume changes and apply to audio
  watch(volume, (newVolume) => {
    if (audio) {
      audio.volume = newVolume;
    }
    
    // Save to localStorage immediately
    saveToLocalStorage();
    
    // Debounce server sync for volume changes
    if (volumeDebounceTimer) clearTimeout(volumeDebounceTimer);
    volumeDebounceTimer = window.setTimeout(() => {
      scheduleServerSync();
    }, VOLUME_DEBOUNCE_MS);
  });
  
  // Watch current track changes
  watch(currentTrack, (newTrack) => {
    if (newTrack && isInitialized.value) {
      // Save to server immediately when track changes
      scheduleServerSync(true);
    }
    saveToLocalStorage();
  });
  
  // Watch progress changes
  watch(progress, () => {
    saveToLocalStorage();
  });
  
  // Watch isPlaying to sync on pause
  watch(isPlaying, (playing) => {
    if (!playing && isInitialized.value) {
      // Save immediately when paused
      scheduleServerSync(true);
    }
  });
  
  // Set up periodic progress sync
  const setupProgressSync = () => {
    if (progressSyncTimer) clearInterval(progressSyncTimer);
    progressSyncTimer = window.setInterval(() => {
      if (isPlaying.value && isInitialized.value) {
        scheduleServerSync();
      }
    }, PROGRESS_SYNC_INTERVAL_MS);
  };
  
  // Set up page unload handler
  const setupUnloadHandler = () => {
    const handleBeforeUnload = () => {
      // Flush any pending state immediately on page unload
      if (pendingState) {
        flushServerSync();
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        scheduleServerSync(true);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };
  
  // Full initialization (used internally)
  const initialize = async () => {
    await initializeFromStorage();
  };
  
  // Update current track (for likes, plays count sync)
  const updateCurrentTrack = (updatedTrack: Track) => {
    if (currentTrack.value && currentTrack.value.id === updatedTrack.id) {
      currentTrack.value = { ...currentTrack.value, ...updatedTrack };
    }
    
    // Also update in queue if present
    const queueIndex = queue.value.findIndex(t => t.id === updatedTrack.id);
    if (queueIndex !== -1) {
      queue.value[queueIndex] = { ...queue.value[queueIndex], ...updatedTrack };
    }
    
    const originalQueueIndex = originalQueue.value.findIndex(t => t.id === updatedTrack.id);
    if (originalQueueIndex !== -1) {
      originalQueue.value[originalQueueIndex] = { ...originalQueue.value[originalQueueIndex], ...updatedTrack };
    }
  };

  // Initialize manually when needed (from Home.vue)
  // Don't auto-initialize to prevent conflicts with navigation

  return {
    // State
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    queue,
    originalQueue,
    currentIndex,
    isShuffled,
    isExpanded,

    // Computed
    progressPercent,
    formattedProgress,
    formattedDuration,

    // Actions
    playTrack,
    togglePlay,
    seek,
    seekByPercent,
    setVolume,
    stop,
    cleanup,
    formatTime,

    // Queue actions
    setQueue,
    toggleShuffle,
    nextTrack,
    prevTrack,
    playRandom,
    
    // Sync actions
    restoreState,
    initializeFromStorage,
    initialize,
    saveToServer,
    fullCleanup,
    isInitialized,
    updateCurrentTrack,
    
    // Player UI actions
    toggleExpand: () => {
      isExpanded.value = !isExpanded.value;
    },
  };
});

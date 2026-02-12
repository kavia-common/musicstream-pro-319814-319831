import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Minimal, self-contained Spotify-like frontend shell.
 * This intentionally uses local mock data and local state to provide a usable UI
 * even before backend integration is available.
 */

/** @typedef {"home"|"search"|"library"} ActiveView */

/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} album
 * @property {number} durationSec
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string[]} trackIds
 */

const formatTime = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Builds a stable list of mock tracks. (No randomization to keep UI predictable.)
 * @returns {Track[]}
 */
function getMockTracks() {
  return [
    { id: "t1", title: "Midnight Drive", artist: "Neon Skyline", album: "After Hours", durationSec: 213 },
    { id: "t2", title: "Ocean Bloom", artist: "Luna Waves", album: "Tides", durationSec: 189 },
    { id: "t3", title: "Soft Focus", artist: "City Lights", album: "Blur", durationSec: 201 },
    { id: "t4", title: "Voltage", artist: "Static Hearts", album: "Circuit", durationSec: 174 },
    { id: "t5", title: "Golden Hour", artist: "Sunroom", album: "Warmth", durationSec: 220 },
    { id: "t6", title: "Night Market", artist: "Paper Lanterns", album: "Neon Streets", durationSec: 206 },
    { id: "t7", title: "Rain On Glass", artist: "Slow Signals", album: "Reflections", durationSec: 232 },
    { id: "t8", title: "Satellite", artist: "Orchard Nine", album: "Signals", durationSec: 196 },
    { id: "t9", title: "Hollow Moon", artist: "Aurora Echo", album: "Phases", durationSec: 240 },
  ];
}

/**
 * @returns {Playlist[]}
 */
function getMockPlaylists() {
  return [
    { id: "p1", name: "Liked Songs", trackIds: ["t1", "t5", "t7"] },
    { id: "p2", name: "Daily Mix 1", trackIds: ["t2", "t3", "t8"] },
    { id: "p3", name: "Chill Nights", trackIds: ["t7", "t9", "t3"] },
    { id: "p4", name: "Workout", trackIds: ["t4", "t1", "t6"] },
  ];
}

// PUBLIC_INTERFACE
function App() {
  /** @type {[ActiveView, Function]} */
  const [activeView, setActiveView] = useState("home");

  const [theme, setTheme] = useState("dark");

  const [query, setQuery] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("p1");

  /** @type {[Track|null, Function]} */
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock player state (UI only)
  const [volume, setVolume] = useState(0.8);
  const [progressSec, setProgressSec] = useState(0);

  const tracks = useMemo(() => getMockTracks(), []);
  const playlists = useMemo(() => getMockPlaylists(), []);

  const trackById = useMemo(() => {
    const map = new Map();
    tracks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tracks]);

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) ?? playlists[0],
    [playlists, selectedPlaylistId]
  );

  const selectedPlaylistTracks = useMemo(() => {
    if (!selectedPlaylist) return [];
    return selectedPlaylist.trackIds.map((id) => trackById.get(id)).filter(Boolean);
  }, [selectedPlaylist, trackById]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tracks.filter((t) => {
      const haystack = `${t.title} ${t.artist} ${t.album}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, tracks]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Fake playback progression for UI (no audio streaming in this frontend template yet)
  useEffect(() => {
    if (!isPlaying || !nowPlaying) return undefined;

    const tick = window.setInterval(() => {
      setProgressSec((prev) => {
        const next = prev + 1;
        if (next >= nowPlaying.durationSec) {
          // Stop at end (keeps behavior simple until real audio arrives)
          window.clearInterval(tick);
          setIsPlaying(false);
          return nowPlaying.durationSec;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [isPlaying, nowPlaying]);

  useEffect(() => {
    // Reset progress when track changes
    setProgressSec(0);
  }, [nowPlaying?.id]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const playTrack = (track) => {
    setNowPlaying(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!nowPlaying) return;
    setIsPlaying((p) => !p);
  };

  const seekTo = (value01) => {
    if (!nowPlaying) return;
    const next = Math.floor(clamp01(value01) * nowPlaying.durationSec);
    setProgressSec(next);
  };

  const skip = (direction) => {
    // direction: -1 prev, +1 next
    const list = activeView === "library" ? selectedPlaylistTracks : tracks;
    if (!list.length) return;

    const currentIndex = nowPlaying ? list.findIndex((t) => t.id === nowPlaying.id) : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + list.length) % list.length;
    setNowPlaying(list[nextIndex]);
    setIsPlaying(true);
  };

  const content = (() => {
    if (activeView === "home") {
      return (
        <>
          <div className="pageHeader">
            <h1 className="pageTitle">Home</h1>
            <p className="pageSubtitle">Trending, new releases, and recommendations (mock data).</p>
          </div>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Trending</h2>
            </div>
            <div className="cardGrid">
              {tracks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  className="mediaCard"
                  onClick={() => playTrack(t)}
                  aria-label={`Play ${t.title} by ${t.artist}`}
                >
                  <div className="mediaArt" aria-hidden="true">
                    <div className="mediaArtInner">{t.title.slice(0, 1)}</div>
                  </div>
                  <div className="mediaMeta">
                    <div className="mediaTitle">{t.title}</div>
                    <div className="mediaSub">{t.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Recommended</h2>
            </div>
            <div className="list">
              {tracks.slice(3).map((t) => (
                <TrackRow key={t.id} track={t} onPlay={() => playTrack(t)} />
              ))}
            </div>
          </section>
        </>
      );
    }

    if (activeView === "search") {
      return (
        <>
          <div className="pageHeader">
            <h1 className="pageTitle">Search</h1>
            <p className="pageSubtitle">Find songs, artists, and albums (local filtering).</p>
          </div>

          <div className="searchBarWrap">
            <label className="srOnly" htmlFor="searchInput">
              Search
            </label>
            <input
              id="searchInput"
              className="searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to listen to?"
              autoComplete="off"
            />
          </div>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Results</h2>
            </div>
            <div className="list">
              {query.trim().length === 0 ? (
                <div className="emptyState">
                  <div className="emptyTitle">Start typing to search</div>
                  <div className="emptySub">Try “moon”, “drive”, or “ocean”.</div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyTitle">No results</div>
                  <div className="emptySub">Try a different search term.</div>
                </div>
              ) : (
                searchResults.map((t) => <TrackRow key={t.id} track={t} onPlay={() => playTrack(t)} />)
              )}
            </div>
          </section>
        </>
      );
    }

    // library
    return (
      <>
        <div className="pageHeader">
          <h1 className="pageTitle">Your Library</h1>
          <p className="pageSubtitle">Playlists (mock) and recently played.</p>
        </div>

        <section className="section">
          <div className="sectionHeader">
            <h2 className="sectionTitle">{selectedPlaylist?.name ?? "Playlist"}</h2>
            <div className="sectionActions">
              <button className="btn btnSecondary" onClick={() => playTrack(selectedPlaylistTracks[0])} disabled={!selectedPlaylistTracks.length}>
                Play
              </button>
            </div>
          </div>

          <div className="list">
            {selectedPlaylistTracks.length === 0 ? (
              <div className="emptyState">
                <div className="emptyTitle">No tracks</div>
                <div className="emptySub">This playlist is empty.</div>
              </div>
            ) : (
              selectedPlaylistTracks.map((t) => <TrackRow key={t.id} track={t} onPlay={() => playTrack(t)} />)
            )}
          </div>
        </section>
      </>
    );
  })();

  return (
    <div className="App spotifyShell">
      <div className="layout">
        <aside className="sidebar" aria-label="Sidebar navigation">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">
              ♫
            </div>
            <div className="brandText">
              <div className="brandName">MusicStream</div>
              <div className="brandTag">Spotify-style clone</div>
            </div>
          </div>

          <nav className="nav">
            <button
              className={`navItem ${activeView === "home" ? "active" : ""}`}
              onClick={() => setActiveView("home")}
              aria-current={activeView === "home" ? "page" : undefined}
            >
              Home
            </button>
            <button
              className={`navItem ${activeView === "search" ? "active" : ""}`}
              onClick={() => setActiveView("search")}
              aria-current={activeView === "search" ? "page" : undefined}
            >
              Search
            </button>
            <button
              className={`navItem ${activeView === "library" ? "active" : ""}`}
              onClick={() => setActiveView("library")}
              aria-current={activeView === "library" ? "page" : undefined}
            >
              Your Library
            </button>
          </nav>

          <div className="sidebarSection">
            <div className="sidebarSectionTitle">Playlists</div>
            <div className="playlistList" role="list">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  className={`playlistItem ${selectedPlaylistId === p.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPlaylistId(p.id);
                    setActiveView("library");
                  }}
                  role="listitem"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebarFooter">
            <button className="btn btnTertiary" onClick={toggleTheme} aria-label="Toggle theme">
              Theme: {theme === "dark" ? "Dark" : "Light"}
            </button>
            <div className="hintText">Backend integration will replace mock data later.</div>
          </div>
        </aside>

        <main className="main" aria-label="Main content">
          <div className="topbar">
            <div className="topbarLeft">
              <div className="pill">Free</div>
              <div className="topbarTitle">{activeView === "home" ? "Home" : activeView === "search" ? "Search" : "Library"}</div>
            </div>

            <div className="topbarRight">
              <button className="btn btnSecondary" onClick={() => alert("Auth flow not wired yet.")}>
                Log in
              </button>
              <button className="btn" onClick={() => alert("Signup flow not wired yet.")}>
                Sign up
              </button>
            </div>
          </div>

          <div className="content">{content}</div>
        </main>
      </div>

      <footer className="player" aria-label="Audio player">
        <div className="playerLeft">
          {nowPlaying ? (
            <>
              <div className="playerArt" aria-hidden="true">
                <div className="playerArtInner">{nowPlaying.title.slice(0, 1)}</div>
              </div>
              <div className="playerMeta">
                <div className="playerTitle">{nowPlaying.title}</div>
                <div className="playerSub">
                  {nowPlaying.artist} • {nowPlaying.album}
                </div>
              </div>
            </>
          ) : (
            <div className="playerMeta">
              <div className="playerTitle">Nothing playing</div>
              <div className="playerSub">Pick a track to start listening.</div>
            </div>
          )}
        </div>

        <div className="playerCenter">
          <div className="playerControls">
            <button className="iconBtn" onClick={() => skip(-1)} disabled={!tracks.length} aria-label="Previous track">
              ◀◀
            </button>
            <button className="playBtn" onClick={togglePlay} disabled={!nowPlaying} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <button className="iconBtn" onClick={() => skip(1)} disabled={!tracks.length} aria-label="Next track">
              ▶▶
            </button>
          </div>

          <div className="timeline">
            <div className="timeText">{nowPlaying ? formatTime(progressSec) : "0:00"}</div>
            <input
              className="range"
              type="range"
              min={0}
              max={1000}
              value={
                nowPlaying && nowPlaying.durationSec
                  ? Math.floor((progressSec / nowPlaying.durationSec) * 1000)
                  : 0
              }
              onChange={(e) => seekTo(Number(e.target.value) / 1000)}
              disabled={!nowPlaying}
              aria-label="Seek"
            />
            <div className="timeText">{nowPlaying ? formatTime(nowPlaying.durationSec) : "0:00"}</div>
          </div>
        </div>

        <div className="playerRight">
          <div className="volumeWrap">
            <div className="volIcon" aria-hidden="true">
              🔊
            </div>
            <input
              className="range"
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(clamp01(Number(e.target.value) / 100))}
              aria-label="Volume"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Track row component used in lists.
 * @param {{track: Track, onPlay: Function}} props
 */
function TrackRow({ track, onPlay }) {
  return (
    <div className="trackRow">
      <div className="trackMain">
        <button className="trackPlay" onClick={onPlay} aria-label={`Play ${track.title}`}>
          ▶
        </button>
        <div className="trackText">
          <div className="trackTitle">{track.title}</div>
          <div className="trackSub">
            {track.artist} • {track.album}
          </div>
        </div>
      </div>
      <div className="trackRight">
        <div className="trackDur">{formatTime(track.durationSec)}</div>
      </div>
    </div>
  );
}

export default App;

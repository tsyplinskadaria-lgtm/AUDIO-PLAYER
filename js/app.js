(() => {
    "use strict";
    const audio = document.getElementById("audio");
    const title = document.getElementById("title");
    const artist = document.getElementById("artist");
    const titlePhoto = document.getElementById("titlePhoto");
    const artistPhoto = document.getElementById("artistPhoto");
    const cover = document.getElementById("cover");
    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const progressContainer = document.getElementById("progressContainer");
    const progress = document.getElementById("progress");
    const currentEl = document.getElementById("current");
    const durationEl = document.getElementById("duration");
    const playlistBtn = document.getElementById("playlistBtn");
    const playlist = document.getElementById("playlist");
    const player = document.getElementById("player");
    const playlistTracks = document.getElementById("playlistTracks");
    const coverWrap = document.getElementById("coverWrap");
    const playlistHandle = document.querySelector(".playlist__handle");
    const tracksElements = document.querySelectorAll(".tracks-data__item");
    const tracks = [ ...tracksElements ].map((t => ({
        title: t.dataset.title,
        artist: t.dataset.artist,
        src: t.dataset.src,
        cover: t.dataset.cover,
        customTime: t.dataset.time?.trim() || "",
        duration: 0
    })));
    let currentTrack = 0;
    let isPlaying = false;
    function formatTime(time) {
        if (!time || isNaN(time)) return "00:00";
        const hours = Math.floor(time / 3600);
        const min = Math.floor(time % 3600 / 60);
        const sec = Math.floor(time % 60);
        if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    function safeLoad(src) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = src;
        audio.load();
    }
    function loadTrack(index) {
        const track = tracks[index];
        artist.innerHTML = track.artist.replace(" ", "<br>");
        title.textContent = track.title;
        artistPhoto.innerHTML = track.artist.replace(" ", "<br>");
        titlePhoto.textContent = track.title;
        cover.src = track.cover;
        safeLoad(track.src);
        audio.onloadedmetadata = () => {
            const dur = audio.duration;
            if (!isNaN(dur)) {
                track.duration = dur;
                durationEl.textContent = formatTime(dur);
                renderPlaylist();
            }
        };
    }
    function playTrack() {
        const tryPlay = () => {
            const p = audio.play();
            if (p !== void 0) p.catch((() => {}));
        };
        if (audio.readyState < 2) audio.oncanplay = () => {
            tryPlay();
            audio.oncanplay = null;
        }; else tryPlay();
        isPlaying = true;
        player.classList.add("playing");
    }
    function pauseTrack() {
        audio.pause();
        isPlaying = false;
        player.classList.remove("playing");
    }
    playBtn.addEventListener("click", (() => {
        isPlaying ? pauseTrack() : playTrack();
    }));
    nextBtn.addEventListener("click", (() => {
        currentTrack = (currentTrack + 1) % tracks.length;
        loadTrack(currentTrack);
        playTrack();
    }));
    prevBtn.addEventListener("click", (() => {
        currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrack);
        playTrack();
    }));
    audio.addEventListener("timeupdate", (() => {
        if (!audio.duration || isSeeking) return;
        updateProgressUI(audio.currentTime);
    }));
    function updateProgressUI(time) {
        const percent = time / audio.duration * 100;
        progress.style.width = `${percent}%`;
        thumb.style.left = `${percent}%`;
        currentEl.textContent = formatTime(time);
        durationEl.textContent = formatTime(audio.duration);
    }
    let isSeeking = false;
    function seek(e) {
        if (!audio.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        const seekTime = percent * audio.duration;
        progress.style.width = `${percent * 100}%`;
        thumb.style.left = `${percent * 100}%`;
        currentEl.textContent = formatTime(seekTime);
        audio.currentTime = seekTime;
    }
    function startSeek(e) {
        isSeeking = true;
        seek(e);
        document.addEventListener("mousemove", seek);
        document.addEventListener("touchmove", seek);
        document.addEventListener("mouseup", stopSeek);
        document.addEventListener("touchend", stopSeek);
    }
    function stopSeek() {
        isSeeking = false;
        document.removeEventListener("mousemove", seek);
        document.removeEventListener("touchmove", seek);
        document.removeEventListener("mouseup", stopSeek);
        document.removeEventListener("touchend", stopSeek);
    }
    progressContainer.addEventListener("mousedown", startSeek);
    progressContainer.addEventListener("touchstart", startSeek, {
        passive: true
    });
    function renderPlaylist() {
        playlistTracks.innerHTML = "";
        tracks.forEach(((track, index) => {
            const item = document.createElement("div");
            item.classList.add("playlist-track");
            item.innerHTML = `\n      <img src="${track.cover}" alt="">\n\n      <div class="playlist-track__info">\n\n        <div class="playlist-track__content">\n\n          \x3c!-- СПОЧАТКУ ARTIST --\x3e\n          <div class="playlist-track__title">\n            ${track.artist}\n          </div>\n\n          \x3c!-- ПОТІМ TITLE --\x3e\n          <div class="playlist-track__artist">\n            ${track.title}\n          </div>\n\n        </div>\n\n        <div class="playlist-track__time">\n          ${track.customTime || (track.duration ? formatTime(track.duration) : "00:00")}\n        </div>\n\n      </div>\n    `;
            item.addEventListener("click", (() => {
                currentTrack = index;
                loadTrack(currentTrack);
                playTrack();
            }));
            playlistTracks.appendChild(item);
        }));
    }
    playlistBtn.addEventListener("click", (() => {
        playlist.classList.contains("active") ? closePlaylist() : openPlaylist();
    }));
    function openPlaylist() {
        playlist.classList.add("active");
        player.classList.add("playlist-open");
        coverWrap.classList.add("active");
        playlist.style.height = "";
    }
    function closePlaylist() {
        playlist.classList.remove("active");
        player.classList.remove("playlist-open");
        coverWrap.classList.remove("active");
        playlist.style.height = "0px";
    }
    let startY = 0;
    let startHeight = 0;
    let isDragging = false;
    playlistHandle.addEventListener("touchstart", startDrag);
    playlistHandle.addEventListener("mousedown", startDrag);
    function startDrag(e) {
        isDragging = true;
        playlist.style.transition = "none";
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        startHeight = playlist.offsetHeight;
        document.addEventListener("touchmove", onDrag);
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("touchend", stopDrag);
        document.addEventListener("mouseup", stopDrag);
    }
    function onDrag(e) {
        if (!isDragging) return;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        let newHeight = startHeight + (startY - y);
        newHeight = Math.max(0, Math.min(window.innerHeight, newHeight));
        playlist.style.height = `${newHeight}px`;
    }
    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        playlist.style.transition = "height .25s ease";
        const h = playlist.offsetHeight;
        if (h < 100) closePlaylist(); else if (h < window.innerHeight * .5) {
            playlist.classList.add("active");
            player.classList.add("playlist-open");
            coverWrap.classList.add("active");
            playlist.style.height = "";
        } else {
            playlist.classList.add("active");
            player.classList.add("playlist-open");
            coverWrap.classList.add("active");
            playlist.style.height = "100vh";
        }
        document.removeEventListener("touchmove", onDrag);
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("touchend", stopDrag);
        document.removeEventListener("mouseup", stopDrag);
    }
    audio.addEventListener("ended", (() => {
        currentTrack = (currentTrack + 1) % tracks.length;
        loadTrack(currentTrack);
        playTrack();
    }));
    loadTrack(currentTrack);
    window["FLS"] = true;
})();
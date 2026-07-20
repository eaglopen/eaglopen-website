/* =====================================================
   EAGLOPEN — Lite YouTube Embed
   Click-to-play facade: shows a poster + play button and
   only injects the YouTube iframe once the user engages.
   Keeps pages fast while videos feel native to the design.
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const facades = document.querySelectorAll("[data-yt-id]");

  facades.forEach((facade) => {
    const videoId = facade.dataset.ytId;
    const videoTitle = facade.dataset.ytTitle || "YouTube video";
    const stage = facade.querySelector(".yt-lite-stage");
    const playBtn = facade.querySelector(".yt-lite-play");
    if (!videoId || !stage || !playBtn) return;

    const activate = () => {
      if (facade.classList.contains("is-playing")) return;
      facade.classList.add("is-playing");

      const iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(videoId) +
        "?autoplay=1&rel=0&modestbranding=1&color=white";
      iframe.title = videoTitle;
      iframe.loading = "lazy";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.className = "yt-lite-iframe";
      stage.appendChild(iframe);
      iframe.focus();
    };

    playBtn.addEventListener("click", activate);
    facade.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target === facade) {
        e.preventDefault();
        activate();
      }
    });
  });
});
// FABLE 5: I FINISHED THIS FILE

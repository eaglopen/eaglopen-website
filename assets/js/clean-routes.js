/* Keeps legacy static links compatible while presenting Cloudflare Pages clean URLs. */
(() => {
  // VS Code Live Server is a simple static server and does not process the
  // Cloudflare Pages `_redirects` file. Keep local navigation on .html files.
  if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return;

  const routes = {
    "index.html": "/",
    "about.html": "/about",
    "algolab.html": "/algolab",
    "algolab-2026-participants.html": "/algolab-2026-participants",
    "community.html": "/community",
    "contact.html": "/contact",
    "media.html": "/media",
    "news.html": "/news",
    "programs.html": "/programs",
    "research.html": "/research",
  };

  document.querySelectorAll("a[href], form[action]").forEach((element) => {
    const attribute = element.tagName === "FORM" ? "action" : "href";
    const value = element.getAttribute(attribute);
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(value)) return;

    const match = value.match(/^(.+?\.html)([?#].*)?$/i);
    if (!match) return;

    const cleanPath = routes[match[1].replace(/^\.\//, "")];
    if (cleanPath) element.setAttribute(attribute, `${cleanPath}${match[2] || ""}`);
  });
})();

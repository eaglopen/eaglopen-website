/* Shared AlgoLab 2026 announcement for the News page and homepage. */
(() => {
  const announcement = {
    date: "August 2026",
    category: "NEWS / ALGOLAB 2026",
    title: "EAGLOPEN AlgoLab 2026 Officially Kicks Off at ASTU",
    summary: "EAGLOPEN AlgoLab 2026 has officially kicked off at the ASTU ICT Smart Center, bringing together students from across Ethiopia both in person and online for an exciting journey through Python, C++, AI & Machine Learning, and Aerospace Fundamentals.",
    images: [
      { src: "assets/images/news/algolab%202026/im1.jpg", alt: "Students participating in EAGLOPEN AlgoLab 2026" },
      { src: "assets/images/news/algolab%202026/im2.jpg", alt: "AlgoLab students learning together at ASTU" },
      { src: "assets/images/news/algolab%202026/im3.jpg", alt: "Students working during an AlgoLab technology session" },
      { src: "assets/images/news/algolab%202026/im4.jpg", alt: "EAGLOPEN AlgoLab learning activity" },
    ],
  };

  const slides = announcement.images.map((image, index) => `<div class="highlight-slide${index === 0 ? " active" : ""}"><img src="${image.src}" alt="${image.alt}"${index ? ' loading="lazy"' : ""} /></div>`).join("");

  document.querySelectorAll("[data-algolab-news]").forEach((target) => {
    const isHome = target.dataset.algolabNews === "home";
    target.innerHTML = `<section class="home-news-spotlight fade-in" ${isHome ? 'aria-label="Latest announcement"' : 'id="algolab-2026" aria-label="AlgoLab 2026 announcement"'}><div class="container"><div class="home-news-card"><div class="home-news-image highlight-image-slider" data-algolab-slider>${slides}<span class="home-news-badge">${isHome ? "Latest News" : "News / AlgoLab 2026"}</span></div><div class="home-news-content"><span class="news-meta">${announcement.date} · ${isHome ? "Announcement" : announcement.category}</span><h2>${announcement.title}</h2><p>${announcement.summary}</p><div><a href="algolab.html" class="btn-primary">Read More <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div></div></div></section>`;
  });

  document.querySelectorAll("[data-algolab-slider]").forEach((carousel) => {
    const slides = carousel.querySelectorAll(".highlight-slide");
    if (slides.length < 2) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 5000);
  });
})();

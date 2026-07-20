/* ============================================================
   EAGLOPEN — ALGOLAB SORTING VISUALIZER
   Interactive sorting algorithm playground for the AlgoLab page.
   ============================================================ */
(function () {
  "use strict";

  var stage = document.getElementById("al-viz-stage");
  if (!stage) return;

  var runBtn = document.getElementById("al-viz-run");
  var shuffleBtn = document.getElementById("al-viz-shuffle");
  var algoBtns = Array.prototype.slice.call(document.querySelectorAll(".al-viz-algo"));
  var comparisonsEl = document.getElementById("al-viz-comparisons");
  var swapsEl = document.getElementById("al-viz-swaps");
  var complexityEl = document.getElementById("al-viz-complexity");
  var statusEl = document.getElementById("al-viz-status");
  var titleEl = document.getElementById("al-viz-title");

  var BAR_COUNT = 36;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STEP_MS = reducedMotion ? 0 : 28;

  var META = {
    bubble: { label: "bubble_sort.py", complexity: "O(n\u00b2)" },
    insertion: { label: "insertion_sort.py", complexity: "O(n\u00b2)" },
    quick: { label: "quick_sort.py", complexity: "O(n log n)" },
    merge: { label: "merge_sort.py", complexity: "O(n log n)" }
  };

  var values = [];
  var bars = [];
  var currentAlgo = "bubble";
  var running = false;
  var comparisons = 0;
  var swaps = 0;

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function shuffledValues() {
    var arr = [];
    for (var i = 0; i < BAR_COUNT; i++) {
      arr.push(Math.round(8 + (92 * i) / (BAR_COUNT - 1)));
    }
    for (var j = arr.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = arr[j];
      arr[j] = arr[k];
      arr[k] = tmp;
    }
    return arr;
  }

  function render() {
    stage.innerHTML = "";
    bars = values.map(function (v) {
      var bar = document.createElement("div");
      bar.className = "al-viz-bar";
      bar.style.height = v + "%";
      stage.appendChild(bar);
      return bar;
    });
  }

  function setHeights() {
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.height = values[i] + "%";
    }
  }

  function clearHighlights() {
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.remove("is-active", "is-swap");
    }
  }

  function updateStats() {
    comparisonsEl.textContent = String(comparisons);
    swapsEl.textContent = String(swaps);
  }

  function mark(indices, cls) {
    clearHighlights();
    for (var i = 0; i < indices.length; i++) {
      var b = bars[indices[i]];
      if (b) b.classList.add(cls);
    }
  }

  async function compareStep(i, j) {
    comparisons++;
    updateStats();
    mark([i, j], "is-active");
    await sleep(STEP_MS);
  }

  async function swapStep(i, j) {
    swaps++;
    updateStats();
    var tmp = values[i];
    values[i] = values[j];
    values[j] = tmp;
    setHeights();
    mark([i, j], "is-swap");
    await sleep(STEP_MS);
  }

  async function writeStep(i, v) {
    swaps++;
    updateStats();
    values[i] = v;
    setHeights();
    mark([i], "is-swap");
    await sleep(STEP_MS);
  }

  /* ---------- Algorithms ---------- */

  async function bubbleSort() {
    var n = values.length;
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        await compareStep(j, j + 1);
        if (values[j] > values[j + 1]) {
          await swapStep(j, j + 1);
        }
      }
      bars[n - i - 1].classList.add("is-sorted");
    }
  }

  async function insertionSort() {
    var n = values.length;
    for (var i = 1; i < n; i++) {
      var key = values[i];
      var j = i - 1;
      while (j >= 0) {
        await compareStep(j, j + 1);
        if (values[j] <= key) break;
        await writeStep(j + 1, values[j]);
        j--;
      }
      await writeStep(j + 1, key);
    }
  }

  async function quickSort(lo, hi) {
    if (lo >= hi) return;
    var pivot = values[hi];
    var i = lo - 1;
    for (var j = lo; j < hi; j++) {
      await compareStep(j, hi);
      if (values[j] < pivot) {
        i++;
        if (i !== j) await swapStep(i, j);
      }
    }
    if (i + 1 !== hi) await swapStep(i + 1, hi);
    await quickSort(lo, i);
    await quickSort(i + 2, hi);
  }

  async function mergeSort(lo, hi) {
    if (hi - lo < 1) return;
    var mid = Math.floor((lo + hi) / 2);
    await mergeSort(lo, mid);
    await mergeSort(mid + 1, hi);

    var merged = [];
    var a = lo;
    var b = mid + 1;
    while (a <= mid && b <= hi) {
      await compareStep(a, b);
      if (values[a] <= values[b]) {
        merged.push(values[a++]);
      } else {
        merged.push(values[b++]);
      }
    }
    while (a <= mid) merged.push(values[a++]);
    while (b <= hi) merged.push(values[b++]);

    for (var i = 0; i < merged.length; i++) {
      await writeStep(lo + i, merged[i]);
    }
  }

  /* ---------- Controls ---------- */

  function setDisabled(disabled) {
    runBtn.disabled = disabled;
    shuffleBtn.disabled = disabled;
    for (var i = 0; i < algoBtns.length; i++) {
      algoBtns[i].disabled = disabled;
    }
  }

  function resetStats() {
    comparisons = 0;
    swaps = 0;
    updateStats();
  }

  function shuffle() {
    values = shuffledValues();
    render();
    resetStats();
    statusEl.textContent = "ready\u2026";
  }

  async function celebrate() {
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.remove("is-active", "is-swap");
      bars[i].classList.add("is-sorted");
      if (!reducedMotion && i % 3 === 0) await sleep(12);
    }
  }

  async function run() {
    if (running) return;
    running = true;
    setDisabled(true);
    resetStats();
    statusEl.textContent = "running " + currentAlgo + "_sort\u2026";

    if (currentAlgo === "bubble") await bubbleSort();
    else if (currentAlgo === "insertion") await insertionSort();
    else if (currentAlgo === "quick") await quickSort(0, values.length - 1);
    else await mergeSort(0, values.length - 1);

    clearHighlights();
    await celebrate();
    statusEl.textContent = "sorted in " + comparisons + " comparisons \u2713";
    setDisabled(false);
    running = false;
  }

  for (var i = 0; i < algoBtns.length; i++) {
    algoBtns[i].addEventListener("click", function () {
      if (running) return;
      currentAlgo = this.getAttribute("data-algo");
      for (var j = 0; j < algoBtns.length; j++) {
        algoBtns[j].classList.remove("is-active");
      }
      this.classList.add("is-active");
      complexityEl.innerHTML = META[currentAlgo].complexity;
      titleEl.textContent = META[currentAlgo].label + " \u2014 EAGLOPEN";
      shuffle();
    });
  }

  runBtn.addEventListener("click", run);
  shuffleBtn.addEventListener("click", function () {
    if (!running) shuffle();
  });

  shuffle();
})();

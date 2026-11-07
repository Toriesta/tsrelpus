/* 天枢 Tsrelpus — static site interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress ---------- */
  var progress = document.querySelector(".progress i");
  function onScroll() {
    if (!progress) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.width = (p * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- reveal on scroll (fails open: nothing is hidden without JS) ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function staggerIndex(el) {
    if (!el.parentElement) return 0;
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains("reveal");
    });
    return Math.min(sibs.indexOf(el), 6);
  }

  if (!reduceMotion && "IntersectionObserver" in window && revealItems.length) {
    revealItems.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.92) {
        el.style.opacity = "0";
        el.style.transform = "translateY(22px)";
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var anim = el.animate(
          [
            { opacity: 0, transform: "translateY(22px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 680,
            easing: "cubic-bezier(.16,1,.3,1)",
            delay: staggerIndex(el) * 70,
            fill: "both"
          }
        );
        anim.onfinish = function () {
          el.style.opacity = "";
          el.style.transform = "";
        };
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealItems.forEach(function (el) { io.observe(el); });
  }

  /* ---------- active section in header nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a, .menu-panel a"));
  if (navLinks.length && "IntersectionObserver" in window) {
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        if (id === "contact") {
          navLinks.forEach(function (a) { a.classList.remove("is-active"); });
          return;
        }
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });

    ["services", "quote", "work", "process", "faq", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sectionIO.observe(s);
    });
  }

  /* ---------- quote calculator ---------- */
  var range = document.getElementById("quoteRange");
  if (range) {
    var timeRead = document.getElementById("timeRead");
    var secRead = document.getElementById("secRead");
    var totalNum = document.getElementById("totalNum");
    var breakdown = document.getElementById("breakdown");
    var tierNote = document.getElementById("tierNote");
    var deliveryTime = document.getElementById("deliveryTime");
    var deliveryNote = document.getElementById("deliveryNote");
    var presets = Array.prototype.slice.call(document.querySelectorAll(".preset"));
    var tiers = Array.prototype.slice.call(document.querySelectorAll('input[name="tier"]'));
    var quote = { sec: parseInt(range.value, 10) || 210, tier: 1 };

    function money(v) {
      var n = Math.round(v * 10) / 10;
      return Number.isInteger(n) ? String(n) : n.toFixed(1);
    }

    function mmss(sec) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function renderQuote() {
      var sec = quote.sec;
      var segs = Math.floor(sec / 90);
      var rem = sec % 90;
      var base = segs * 200 + rem * 2.5;
      var total = base * quote.tier;

      range.value = String(sec);
      timeRead.textContent = mmss(sec);
      secRead.textContent = sec + " 秒";
      totalNum.textContent = money(total);
      breakdown.textContent = rem > 0
        ? segs + " 段 × ¥200 + " + rem + " 秒 × ¥2.5"
        : segs + " 段 × ¥200";
      tierNote.textContent = quote.tier < 1
        ? "精简制作 · 标准价 ¥" + money(base) + " × 0.8"
        : "标准制作 · 含 AI 生成 / 剪辑 / 配音 / 配乐";

      if (sec <= 120) {
        deliveryTime.textContent = "约 24 小时";
        deliveryNote.textContent = "2 分钟内成片，从方向确认后计算";
      } else if (sec <= 240) {
        deliveryTime.textContent = "约 48 小时";
        deliveryNote.textContent = "2–4 分钟成片，从方向确认后计算";
      } else {
        deliveryTime.textContent = "微信沟通";
        deliveryNote.textContent = "超过 4 分钟，按档期确认";
      }

      var fill = (sec - 90) / 270 * 100;
      range.style.setProperty("--fill", fill.toFixed(2) + "%");

      presets.forEach(function (btn) {
        var on = parseInt(btn.getAttribute("data-sec"), 10) === sec;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    range.addEventListener("input", function () {
      quote.sec = parseInt(range.value, 10);
      renderQuote();
    });

    presets.forEach(function (btn) {
      btn.addEventListener("click", function () {
        quote.sec = parseInt(btn.getAttribute("data-sec"), 10);
        renderQuote();
      });
    });

    tiers.forEach(function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        quote.tier = parseFloat(input.value);
        renderQuote();
      });
    });

    renderQuote();
  }

  /* ---------- mobile menu ---------- */
  var menu = document.getElementById("mobileMenu");
  if (menu) {
    var menuLinks = Array.prototype.slice.call(menu.querySelectorAll(".menu-panel a"));
    var menuScrim = menu.querySelector(".menu-scrim");
    menuLinks.forEach(function (a) {
      a.addEventListener("click", function () { menu.open = false; });
    });
    if (menuScrim) {
      menuScrim.addEventListener("click", function () { menu.open = false; });
    }
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !menu.open) return;
      menu.open = false;
      var summary = menu.querySelector("summary");
      if (summary) summary.focus();
    });
  }

  /* ---------- copy WeChat id ---------- */
  var copyBtn = document.getElementById("copyBtn");
  var copyState = document.getElementById("copyState");
  if (copyBtn && copyState) {
    var resetTimer = null;
    copyBtn.addEventListener("click", function () {
      var code = copyBtn.getAttribute("data-copy") || "SimoHoia0523";
      function done() {
        copyState.textContent = "已复制 · 微信 " + code;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { copyState.textContent = ""; }, 2600);
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {
          copyState.textContent = "请手动复制：" + code;
        }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  /* ---------- QR scan sweep once ---------- */
  var qrBlock = document.querySelector(".qr-block");
  if (qrBlock && !reduceMotion && "IntersectionObserver" in window) {
    var qrIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        qrBlock.classList.add("seen");
        qrIO.disconnect();
      });
    }, { threshold: 0.3 });
    qrIO.observe(qrBlock);
  }
})();

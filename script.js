/* ============================================================
   PyGOD MODE — Learning System JavaScript
   ============================================================ */

'use strict';

// ─── DOM References ────────────────────────────────────────
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const progressCircle = document.getElementById('progressCircle');
const progressText = document.getElementById('progressText');
const sidebarProgressFill = document.getElementById('sidebarProgressFill');
const sidebarProgressLabel = document.getElementById('sidebarProgressLabel');
const scrollTopBtn = document.getElementById('scrollTop');
const resetBtn = document.getElementById('resetProgress');

// ─── State ─────────────────────────────────────────────────
const STORAGE_KEY = 'pygod_progress_v1';
const THEME_KEY = 'pygod_theme_v1';
const TOTAL_SECTIONS = 9;

let completedSections = new Set();

// ─── Init ──────────────────────────────────────────────────
function init() {
  loadProgress();
  loadTheme();
  bindEvents();
  updateProgress();
  observeSections();
  initSectionToggles();
  highlightActiveNav();
}

// ─── Theme ─────────────────────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    themeToggle.textContent = '☾';
  } else {
    themeToggle.textContent = '☀';
  }
}

function toggleTheme() {
  if (body.classList.contains('dark-mode')) {
    body.classList.replace('dark-mode', 'light-mode');
    themeToggle.textContent = '☾';
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    body.classList.replace('light-mode', 'dark-mode');
    themeToggle.textContent = '☀';
    localStorage.setItem(THEME_KEY, 'dark');
  }
}

// ─── Mobile Sidebar ────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ─── Section Collapse/Expand ───────────────────────────────
function initSectionToggles() {
  document.querySelectorAll('.section-header.collapsible').forEach(header => {
    header.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const body = document.getElementById(targetId);
      if (!body) return;

      const isCollapsed = body.classList.contains('collapsed');
      if (isCollapsed) {
        body.classList.remove('collapsed');
        this.classList.remove('collapsed');
      } else {
        body.classList.add('collapsed');
        this.classList.add('collapsed');
      }
    });
  });
}

// ─── Progress ──────────────────────────────────────────────
function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      completedSections = new Set(arr);

      // Restore checkboxes
      document.querySelectorAll('.section-check').forEach(cb => {
        const sec = cb.getAttribute('data-section');
        if (completedSections.has(sec)) {
          cb.checked = true;
          cb.closest('label').classList.add('checked');
        }
      });
    }
  } catch (e) {
    console.warn('Could not load progress:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedSections]));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

function updateProgress() {
  const count = completedSections.size;
  const pct = Math.round((count / TOTAL_SECTIONS) * 100);
  const circumference = 94.2;
  const offset = circumference - (pct / 100) * circumference;

  if (progressCircle) {
    progressCircle.style.strokeDashoffset = offset;
  }
  if (progressText) progressText.textContent = pct + '%';
  if (sidebarProgressFill) sidebarProgressFill.style.width = pct + '%';
  if (sidebarProgressLabel) sidebarProgressLabel.textContent = `${count} / ${TOTAL_SECTIONS} أقسام`;
}

// ─── Active Nav via IntersectionObserver ───────────────────
function observeSections() {
  const options = {
    root: null,
    rootMargin: `-${getTopbarHeight()}px 0px -60% 0px`,
    threshold: 0,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute('id');
        highlightActiveNav(sectionId);
      }
    });
  }, options);

  document.querySelectorAll('.content-section, .hero-section').forEach(s => {
    observer.observe(s);
  });
}

function getTopbarHeight() {
  const topbar = document.querySelector('.topbar');
  return topbar ? topbar.offsetHeight : 64;
}

function highlightActiveNav(sectionId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === '#' + sectionId) {
      link.classList.add('active');
    }
  });
}

// ─── Scroll Top ────────────────────────────────────────────
function handleScroll() {
  if (window.scrollY > 300) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
}

// ─── Search ────────────────────────────────────────────────
const searchIndex = buildSearchIndex();

function buildSearchIndex() {
  const index = [];

  document.querySelectorAll('.content-section').forEach(section => {
    const sectionId = section.getAttribute('id');
    const header = section.querySelector('h2');
    const sectionTitle = header ? header.textContent.trim() : sectionId;

    // Collect text nodes
    section.querySelectorAll('p, li, h3, h4, .concept-card, .type-desc, .cheat-card p, .tip-content p').forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 15) {
        index.push({
          sectionId,
          sectionTitle,
          text: text.substring(0, 120),
          element: el,
        });
      }
    });
  });

  return index;
}

function performSearch(query) {
  if (!query || query.trim().length < 2) {
    searchResults.style.display = 'none';
    return;
  }

  const q = query.trim().toLowerCase();
  const matches = searchIndex.filter(item =>
    item.text.toLowerCase().includes(q) ||
    item.sectionTitle.toLowerCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item" style="color:var(--text-muted)">لا توجد نتائج</div>';
    searchResults.style.display = 'block';
    return;
  }

  const html = matches.map(m => {
    const highlighted = m.text.replace(
      new RegExp(escapeRegex(query.trim()), 'gi'),
      match => `<mark>${match}</mark>`
    );
    return `
      <div class="search-result-item" onclick="goToSection('${m.sectionId}')">
        <div class="sr-section">${m.sectionTitle}</div>
        <div>${highlighted}</div>
      </div>`;
  }).join('');

  searchResults.innerHTML = html;
  searchResults.style.display = 'block';
}

function goToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    const offset = getTopbarHeight() + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });

    // Expand section if collapsed
    const body = el.querySelector('.section-body');
    const header = el.querySelector('.section-header');
    if (body && body.classList.contains('collapsed')) {
      body.classList.remove('collapsed');
      if (header) header.classList.remove('collapsed');
    }
  }
  searchResults.style.display = 'none';
  searchInput.value = '';
  if (window.innerWidth <= 900) closeSidebar();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Copy Code ─────────────────────────────────────────────
function copyCode(btn) {
  const wrap = btn.closest('.code-block-wrap');
  const code = wrap ? wrap.querySelector('.code-block') : null;
  if (!code) return;

  const text = code.innerText || code.textContent;
  // Clean up syntax classes
  const clean = text.replace(/\n\s*\n/g, '\n\n');

  navigator.clipboard.writeText(clean).then(() => {
    btn.textContent = '✓ تم';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'نسخ';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = clean;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ تم';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'نسخ';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ─── Toggle Answer (Interview) ─────────────────────────────
function toggleAnswer(questionEl) {
  const answer = questionEl.nextElementSibling;
  if (!answer) return;

  const isOpen = answer.style.display === 'block';
  answer.style.display = isOpen ? 'none' : 'block';
  questionEl.classList.toggle('open', !isOpen);
}

// ─── Exam Check ────────────────────────────────────────────
function checkAnswer(btn) {
  const qDiv = btn.closest('.exam-q');
  const correctAnswer = qDiv.getAttribute('data-answer');
  const input = qDiv.querySelector('.exam-input');
  const feedback = qDiv.querySelector('.exam-feedback');

  const userAnswer = input.value.trim();
  if (!userAnswer) {
    feedback.textContent = '← أدخل إجابة أولاً';
    feedback.className = 'exam-feedback wrong';
    return;
  }

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
      userAnswer === correctAnswer) {
    feedback.textContent = '✓ صح!';
    feedback.className = 'exam-feedback correct';
    input.style.borderColor = 'var(--green)';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  } else {
    feedback.textContent = `✗ غلط — الإجابة: ${correctAnswer}`;
    feedback.className = 'exam-feedback wrong';
    input.style.borderColor = 'var(--red)';
    // Shake
    input.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(0)' },
    ], { duration: 300 });
  }
}

// ─── Reset Progress ────────────────────────────────────────
function resetProgress() {
  if (!confirm('هتعيد التقدم من الأول؟')) return;

  completedSections.clear();
  localStorage.removeItem(STORAGE_KEY);
  updateProgress();

  document.querySelectorAll('.section-check').forEach(cb => {
    cb.checked = false;
    cb.closest('label').classList.remove('checked');
  });
}

// ─── Bind Events ───────────────────────────────────────────
function bindEvents() {
  // Theme
  themeToggle.addEventListener('click', toggleTheme);

  // Sidebar
  menuToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Nav links — smooth scroll + close sidebar on mobile
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.slice(1);
        goToSection(targetId);
      }
    });
  });

  // Scroll
  window.addEventListener('scroll', handleScroll, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Search
  searchInput.addEventListener('input', function () {
    performSearch(this.value);
  });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      searchResults.style.display = 'none';
      this.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) {
      searchResults.style.display = 'none';
    }
  });

  // Section checkboxes (progress tracking)
  document.querySelectorAll('.section-check').forEach(cb => {
    cb.addEventListener('change', function () {
      const sec = this.getAttribute('data-section');
      const label = this.closest('label');

      if (this.checked) {
        completedSections.add(sec);
        label.classList.add('checked');
        // Confetti micro-animation
        spawnConfetti(this);
      } else {
        completedSections.delete(sec);
        label.classList.remove('checked');
      }

      saveProgress();
      updateProgress();
    });
  });

  // Reset
  resetBtn.addEventListener('click', resetProgress);

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// ─── Confetti Micro-animation ──────────────────────────────
function spawnConfetti(el) {
  const rect = el.getBoundingClientRect();
  const colors = ['#00e5ff', '#7c3aed', '#22c55e', '#f59e0b'];

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 6px; height: 6px;
      background: ${colors[i % colors.length]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${rect.left + 8}px;
      top: ${rect.top}px;
    `;
    document.body.appendChild(particle);

    const angle = (i / 8) * Math.PI * 2;
    const speed = 40 + Math.random() * 40;

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${Math.cos(angle) * speed}px, ${Math.sin(angle) * speed - 30}px) scale(0)`,
        opacity: 0,
      },
    ], { duration: 600, easing: 'cubic-bezier(0,0.9,0.57,1)' }).onfinish = () => {
      particle.remove();
    };
  }
}

// ─── Run ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

// Expose global functions
window.copyCode = copyCode;
window.toggleAnswer = toggleAnswer;
window.checkAnswer = checkAnswer;

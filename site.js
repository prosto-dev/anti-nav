function setupSwitcher(container) {
  const list = container.querySelector('.switch-list');
  const tabs = [...list.querySelectorAll('button[aria-controls]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

  function activate(index) {
    tabs.forEach((tab, i) => {
      const selected = index === i;
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute('aria-selected', String(selected));
      panels[i].hidden = !selected;
    });
  }

  container.dataset.enhanced = '';
  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
      let next;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length;
      else return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
  activate(0);
}

function setupExercise() {
  const exercise = document.querySelector('[data-exercise]');
  const status = exercise.querySelector('.exercise-status');
  const button = exercise.querySelector('button');
  const stops = [...exercise.querySelectorAll('.exercise-track i')];
  const steps = [
    [status.textContent, 'Позначити «Я тут»'],
    ['Початкова точка відома. Адаптера немає, тому оберіть «Задана швидкість».', 'Обрати задану швидкість'],
    ['Встановіть орієнтовну швидкість, натисніть «Рушив» і підтверджуйте фактичний напрямок на поворотах.', 'Почати рух'],
    ['AntiNav оцінює пройдений шлях. На зупинці натисніть «Стоп», а для уточнення місця скористайтеся «Я тут».', 'Повторити вправу'],
  ];
  let step = 0;

  function showStep() {
    [status.textContent, button.textContent] = steps[step];
    exercise.style.setProperty('--progress', step / (steps.length - 1));
    stops.forEach((stop, index) => stop.toggleAttribute('aria-current', index === step));
  }

  exercise.dataset.active = '';
  showStep();
  button.hidden = false;
  button.addEventListener('click', () => {
    step = (step + 1) % steps.length;
    showStep();
  });
}

function setupScreenshotViewer() {
  const viewer = document.querySelector('.screenshot-viewer');
  if (typeof viewer.showModal !== 'function') return;
  const screenshots = [...document.querySelectorAll('[data-screenshot]')];
  const image = viewer.querySelector('img');
  const title = viewer.querySelector('#screenshot-title');
  const count = viewer.querySelector('.viewer-count');
  let current = 0;
  let trigger;

  function show(index) {
    current = (index + screenshots.length) % screenshots.length;
    const screenshot = screenshots[current];
    image.alt = screenshot.querySelector('img').alt;
    image.src = screenshot.href;
    title.textContent = screenshot.dataset.screenshot;
    count.textContent = `${current + 1} з ${screenshots.length}`;
  }

  screenshots.forEach((screenshot, index) => {
    screenshot.setAttribute('aria-haspopup', 'dialog');
    screenshot.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = screenshot;
      show(index);
      viewer.showModal();
    });
  });

  viewer.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => show(current + Number(button.dataset.direction)));
  });
  viewer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
}

async function showCurrentVersion() {
  const label = document.querySelector('#android-version');
  try {
    const url = 'https://api.github.com/repos/prosto-dev/anti-nav/releases/latest';
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    const release = await response.json();
    const version = release.tag_name.match(/^v(\d+\.\d+\.\d+)$/);
    const apk = release.assets.find((asset) => asset.name === 'AntiNav.apk');
    if (!version || !apk) return;
    const size = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(apk.size / 1000000);
    label.textContent = `Версія ${version[1]} · ${size} МБ`;
  } catch {
    // The download link always points to the latest release.
  }
}

document.querySelectorAll('[data-switcher]').forEach(setupSwitcher);
setupExercise();
setupScreenshotViewer();
showCurrentVersion();

function revealLinkedQuestion() {
  if (location.hash === '#faq-obd') document.getElementById('faq-obd').open = true;
}
window.addEventListener('hashchange', revealLinkedQuestion);
revealLinkedQuestion();

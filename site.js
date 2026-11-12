const versionLabel = document.querySelector('#android-version');

async function showCurrentVersion() {
  try {
    const url = 'https://api.github.com/repos/prosto-dev/anti-nav/releases/latest';
    const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(6500) });
    if (!response.ok) throw new Error('GitHub Releases unavailable');

    const release = await response.json();
    const apk = release.assets.find((asset) => asset.name === 'AntiNav.apk');
    const version = release.tag_name.match(/^v?(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)$/);
    if (!apk || !version) throw new Error('Android APK missing');

    const size = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 })
      .format(apk.size / 1000000);
    versionLabel.textContent = `Версія ${version[1]} · ${size} МБ`;
  } catch {
    versionLabel.textContent = 'Номер версії дивіться в деталях випуску.';
  }
}

showCurrentVersion();

function setupScreenshotViewer() {
  const viewer = document.querySelector('.screenshot-viewer');
  if (typeof viewer?.showModal !== 'function') return;

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
    title.textContent = screenshot.closest('figure').querySelector('figcaption').textContent;
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

setupScreenshotViewer();

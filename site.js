const versionLabel = document.querySelector('#android-version');

async function showCurrentVersion() {
  try {
    const url = 'https://api.github.com/repos/prosto-dev/antinav-site/releases/latest';
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

const guide = document.querySelector('#guide');
const canvas = guide.querySelector('canvas');
const ctx = canvas.getContext('2d');
const steps = [...guide.querySelectorAll('[data-step]')];
const description = guide.querySelector('#guide-description');
const replay = guide.querySelector('.replay');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const orange = '#ffae58';
const blue = '#a5dfef';
const sage = '#c7d8ae';
const border = '#526252';
const dark = '#151b16';
const points = [[39, 184], [76, 176], [116, 104], [144, 94], [211, 117], [235, 105], [270, 65]];
const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
const distance = lengths.reduce((total, value) => total + value, 0);

function line(pointsToDraw, color, width, closed = false) {
  ctx.beginPath();
  pointsToDraw.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  if (closed) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function disk(x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function check(x, y) {
  disk(x, y, 12, sage);
  line([[x - 5, y], [x - 1, y + 4], [x + 6, y - 5]], dark, 2);
}

function map() {
  for (let x = -108; x < 340; x += 27) line([[x, 0], [x + 120, 235]], '#3c4a3c', 1);
  for (let y = 4; y < 280; y += 27) line([[0, y + 24], [340, y - 37]], '#3c4a3c', 1);
  ctx.beginPath();
  ctx.moveTo(229, -12);
  ctx.bezierCurveTo(255, 71, 116, 125, 155, 173);
  ctx.quadraticCurveTo(184, 210, 145, 242);
  ctx.strokeStyle = '#3b5960';
  ctx.lineWidth = 20;
  ctx.stroke();
}

function routeAt(progress) {
  let remaining = distance * progress;
  let i = 0;
  while (i < lengths.length - 1 && remaining > lengths[i]) {
    remaining -= lengths[i];
    i++;
  }
  const [x, y] = points[i];
  const [nx, ny] = points[i + 1];
  const fraction = remaining / lengths[i];
  return { i, x: x + (nx - x) * fraction, y: y + (ny - y) * fraction, angle: Math.atan2(ny - y, nx - x) };
}

function download(progress) {
  ['#28372b', '#465d46', '#647e58'].forEach((color, i) => {
    const y = 106 - i * 18 - (1 - progress) * i * 20;
    line([[75, y], [161, y - 35], [247, y], [161, y + 35]], border, 2, true);
    ctx.fillStyle = color;
    ctx.fill();
  });
  line([[83, 179], [239, 179]], border, 7);
  line([[83, 179], [83 + 156 * progress, 179]], orange, 7);
  if (progress >= .98) check(239, 179);
}

function plan(progress) {
  map();
  line(points, dark, 8);
  const { i, x, y } = routeAt(progress);
  line([...points.slice(0, i + 1), [x, y]], orange, 4);
  [0, .5, 1].forEach((stop) => {
    const pin = routeAt(stop);
    disk(pin.x, pin.y, 10, dark);
    disk(pin.x, pin.y, 6, progress >= stop ? blue : border);
  });
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drive(progress) {
  map();
  line(points, orange, 5);
  const { x, y, angle } = routeAt(.09 + .79 * progress);
  disk(x, y, 22 + 8 * progress, '#a5dfef26');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = blue;
  roundedRect(-15, -8, 30, 16, 5);
  ctx.fill();
  ctx.fillStyle = '#34525d';
  ctx.fillRect(3, -5, 4, 10);
  ctx.fillRect(-8, -5, 4, 10);
  ctx.restore();
}

function record(progress) {
  roundedRect(59, 46, 215, 143, 14);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  disk(87, 75, 7 + progress * 9, '#ffae5833');
  disk(87, 75, 6, progress >= .9 ? sage : '#ffad98');
  line([[104, 75], [181, 75]], '#9fac9c', 5);
  [11, 21, 16, 32, 24, 45, 32, 48].forEach((height, i) => {
    const x = 89 + i * 20;
    const scale = Math.max(0, Math.min(1, (progress - i * .09) * 6));
    if (scale) line([[x, 156], [x, 156 - height * scale]], blue, 6);
  });
  if (progress >= .9) check(249, 166);
}

const scenes = [
  [download, 'Відкрийте «Офлайн-карти», виберіть область і дочекайтеся статусу «Завантажено».'],
  [plan, 'Позначте старт, фініш і проміжні зупинки на карті або введіть їх вручну.'],
  [drive, 'Оберіть режим ведення й натисніть «Рушив». За потреби уточніть позицію кнопкою «Я тут».'],
  [record, 'Почніть запис поїздки й збережіть її в розділі «Мої маршрути».'],
];

let active = 0;
let frame;

function draw(progress) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 340, 235);
  scenes[active][0](progress);
}

function play() {
  cancelAnimationFrame(frame);
  replay.hidden = reducedMotion.matches;
  if (reducedMotion.matches) {
    draw(1);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / 1550, 1);
    draw(1 - (1 - progress) ** 2);
    if (progress < 1) frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
}

steps.forEach((button, i) => button.addEventListener('click', () => {
  active = i;
  steps.forEach((step, index) => step.setAttribute('aria-pressed', String(i === index)));
  description.textContent = scenes[i][1];
  play();
}));
replay.addEventListener('click', play);
reducedMotion.addEventListener('change', play);
replay.hidden = reducedMotion.matches;
draw(1);
const observer = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  observer.disconnect();
  play();
}, { threshold: .25 });
observer.observe(canvas);

'use strict';

const STORAGE_KEY = 'stylemate-demo-v1';
const DEFAULT_ITEMS = ['shirt', 'blazer', 'jeans', 'sneakers'];

const state = {
  step: 1,
  scene: 'work',
  weather: 'mild',
  mood: 'clean',
  items: new Set(DEFAULT_ITEMS),
  photoDataUrl: '',
  photoName: '',
  history: loadHistory(),
  previousScreen: 'intro'
};

const stepMeta = {
  1: ['今天要去哪里？', '下一步：选择气质'],
  2: ['确定穿搭气质', '下一步：选择衣橱'],
  3: ['选择可用单品', '生成穿搭建议'],
  4: ['你的穿搭方案', '']
};

const itemNames = {
  shirt: '白衬衫',
  knit: '薄针织',
  blazer: '廓形西装',
  jeans: '直筒牛仔裤',
  skirt: '过膝半裙',
  trousers: '垂感西裤',
  sneakers: '白色球鞋',
  loafers: '乐福鞋'
};

const sceneRules = {
  work: {
    title: '松弛感通勤叠穿',
    summary: '用清爽内搭建立秩序，再用外套和鞋履补足完整度。',
    note: '袖口轻挽露出手腕，裤脚保持干净；包和腰带选同一深色，让视觉更收束。',
    score: 88,
    defaults: { top: 'shirt', outer: 'blazer', bottom: 'jeans', shoe: 'loafers' }
  },
  date: {
    title: '温柔但有重点的约会装',
    summary: '用柔软上装靠近面部，再把亮点留给流动的下装和精致鞋履。',
    note: '上半身保持轻盈，首饰只选一处；如果加外套，敞开穿能保留纵向线条。',
    score: 91,
    defaults: { top: 'knit', outer: 'blazer', bottom: 'skirt', shoe: 'loafers' }
  },
  weekend: {
    title: '轻松有层次的周末组合',
    summary: '把舒适单品放在主体位置，用干净配色避免造型显得随意。',
    note: '裤脚和鞋面之间留一点空隙；温差大时把针织搭在肩上，既实用也增加层次。',
    score: 93,
    defaults: { top: 'shirt', outer: 'knit', bottom: 'jeans', shoe: 'sneakers' }
  },
  interview: {
    title: '可信赖的专业轮廓',
    summary: '利落肩线搭配垂直下装，传达清晰、克制又有准备的状态。',
    note: '衣领、裤线和鞋面保持整洁；全身颜色控制在三种以内，重点会自然回到你本人。',
    score: 90,
    defaults: { top: 'shirt', outer: 'blazer', bottom: 'trousers', shoe: 'loafers' }
  }
};

const weatherNotes = {
  mild: '',
  hot: ' 偏热时把外套改为手持，优先选择透气上装。',
  cold: ' 偏冷时增加贴身打底，并让外层长度盖过腰线。'
};

const moodAdjustments = {
  clean: { titlePrefix: '', score: 0 },
  soft: { titlePrefix: '柔和', score: 1 },
  retro: { titlePrefix: '轻复古', score: -1 },
  street: { titlePrefix: '都市', score: 0 }
};

const screens = Array.from(document.querySelectorAll('[data-screen]'));
const steps = Array.from(document.querySelectorAll('[data-step]'));
const flowFooter = document.querySelector('[data-flow-footer]');
const photoInput = document.querySelector('#photo-input');

document.addEventListener('click', handleClick);
photoInput.addEventListener('change', handlePhotoSelection);
renderHistory();
restorePreferences();

function handleClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    runAction(actionTarget.dataset.action);
    return;
  }

  const choice = event.target.closest('[data-choice-group] button[data-value]');
  if (choice) {
    selectChoice(choice);
    return;
  }

  const closetItem = event.target.closest('.closet-item');
  if (closetItem) toggleClosetItem(closetItem);
}

function runAction(action) {
  const actions = {
    start: () => showFlow(1),
    next: goNext,
    back: goBack,
    'go-home': goHome,
    restart: restartFlow,
    'remove-photo': clearPhoto,
    'select-defaults': selectDefaults,
    'save-look': saveLook,
    'show-history': showHistory,
    'close-history': closeHistory,
    'clear-history': clearHistory
  };
  if (actions[action]) actions[action]();
}

function showScreen(name) {
  screens.forEach((screen) => screen.classList.toggle('is-hidden', screen.dataset.screen !== name));
  document.querySelector('.topbar').classList.toggle('is-hidden', name === 'flow');
  window.scrollTo(0, 0);
}

function showFlow(step) {
  state.step = step;
  showScreen('flow');
  renderStep();
}

function renderStep() {
  steps.forEach((step) => step.classList.toggle('is-hidden', Number(step.dataset.step) !== state.step));
  document.querySelector('[data-step-label]').textContent = `第 ${state.step} 步，共 4 步`;
  document.querySelector('[data-step-title]').textContent = stepMeta[state.step][0];
  document.querySelector('.progress-track').dataset.progressStep = String(state.step);
  flowFooter.classList.toggle('is-hidden', state.step === 4);
  if (state.step < 4) document.querySelector('[data-next-label]').textContent = stepMeta[state.step][1];
  if (state.step === 4) renderResult();
  window.scrollTo(0, 0);
}

function goNext() {
  if (state.step === 3 && state.items.size < 3) {
    document.querySelector('[data-validation]').classList.remove('is-hidden');
    return;
  }
  if (state.step < 4) {
    state.step += 1;
    savePreferences();
    renderStep();
  }
}

function goBack() {
  if (state.step === 1) {
    goHome();
    return;
  }
  state.step -= 1;
  renderStep();
}

function goHome() {
  state.previousScreen = 'intro';
  showScreen('intro');
}

function restartFlow() {
  state.step = 1;
  document.querySelector('[data-save-feedback]').classList.add('is-hidden');
  renderStep();
}

function selectChoice(choice) {
  const group = choice.closest('[data-choice-group]');
  group.querySelectorAll('button[data-value]').forEach((button) => button.classList.remove('is-selected'));
  choice.classList.add('is-selected');
  state[group.dataset.choiceGroup] = choice.dataset.value;
  savePreferences();
}

function toggleClosetItem(item) {
  const id = item.dataset.item;
  if (state.items.has(id)) state.items.delete(id);
  else state.items.add(id);
  item.classList.toggle('is-selected', state.items.has(id));
  document.querySelector('[data-selected-count]').textContent = String(state.items.size);
  document.querySelector('[data-validation]').classList.toggle('is-hidden', state.items.size >= 3);
  savePreferences();
}

function selectDefaults() {
  state.items = new Set(DEFAULT_ITEMS);
  renderCloset();
  savePreferences();
}

function renderCloset() {
  document.querySelectorAll('.closet-item').forEach((item) => {
    item.classList.toggle('is-selected', state.items.has(item.dataset.item));
  });
  document.querySelector('[data-selected-count]').textContent = String(state.items.size);
  document.querySelector('[data-validation]').classList.add('is-hidden');
}

function handlePhotoSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    state.photoDataUrl = String(reader.result || '');
    state.photoName = file.name;
    document.querySelector('[data-photo-image]').src = state.photoDataUrl;
    document.querySelector('[data-photo-name]').textContent = file.name;
    document.querySelector('[data-photo-empty]').classList.add('is-hidden');
    document.querySelector('[data-photo-preview]').classList.remove('is-hidden');
  });
  reader.readAsDataURL(file);
}

function clearPhoto() {
  state.photoDataUrl = '';
  state.photoName = '';
  photoInput.value = '';
  document.querySelector('[data-photo-image]').removeAttribute('src');
  document.querySelector('[data-photo-empty]').classList.remove('is-hidden');
  document.querySelector('[data-photo-preview]').classList.add('is-hidden');
}

function renderResult() {
  const look = buildLook();
  document.querySelector('[data-result-title]').textContent = look.title;
  document.querySelector('[data-result-summary]').textContent = look.summary;
  document.querySelector('[data-result-note]').textContent = look.note;
  document.querySelector('[data-score]').textContent = String(look.score);
  document.querySelector('[data-result-top]').textContent = look.top;
  document.querySelector('[data-result-outer]').textContent = look.outer;
  document.querySelector('[data-result-bottom]').textContent = look.bottom;
  document.querySelector('[data-result-shoe]').textContent = look.shoe;
  const photoWrap = document.querySelector('[data-result-photo-wrap]');
  photoWrap.classList.toggle('is-hidden', !state.photoDataUrl);
  if (state.photoDataUrl) document.querySelector('[data-result-photo]').src = state.photoDataUrl;
}

function buildLook() {
  const base = sceneRules[state.scene];
  const mood = moodAdjustments[state.mood];
  const picked = Array.from(state.items);
  const findByType = (type, fallback) => {
    const found = picked.find((id) => {
      const node = document.querySelector(`[data-item="${id}"]`);
      return node && node.dataset.type === type;
    });
    if (found) return found;
    if (state.items.has(fallback)) return fallback;
    return '暂缺，可沿用相近款';
  };

  const topId = findByType('top', base.defaults.top);
  const outerId = findByType('outer', base.defaults.outer);
  const bottomId = findByType('bottom', base.defaults.bottom);
  const shoeId = findByType('shoe', base.defaults.shoe);
  const name = (id) => itemNames[id] || id;

  return {
    title: mood.titlePrefix ? `${mood.titlePrefix} · ${base.title}` : base.title,
    summary: base.summary,
    note: base.note + weatherNotes[state.weather],
    score: Math.max(80, Math.min(96, base.score + mood.score + Math.min(2, state.items.size - 3))),
    top: name(topId),
    outer: name(outerId),
    bottom: name(bottomId),
    shoe: name(shoeId)
  };
}

function saveLook() {
  const look = buildLook();
  const entry = {
    id: String(Date.now()),
    title: look.title,
    items: [look.top, look.outer, look.bottom, look.shoe],
    score: look.score,
    createdAt: new Date().toISOString()
  };
  state.history = [entry, ...state.history].slice(0, 12);
  writeHistory();
  renderHistory();
  document.querySelector('[data-save-feedback]').classList.remove('is-hidden');
}

function showHistory() {
  const current = screens.find((screen) => !screen.classList.contains('is-hidden'));
  state.previousScreen = current ? current.dataset.screen : 'intro';
  renderHistory();
  showScreen('history');
}

function closeHistory() {
  showScreen(state.previousScreen === 'history' ? 'intro' : state.previousScreen);
}

function renderHistory() {
  const list = document.querySelector('[data-history-list]');
  const empty = document.querySelector('[data-history-empty]');
  const clearButton = document.querySelector('[data-action="clear-history"]');
  list.replaceChildren();

  state.history.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'history-card';

    const mark = document.createElement('span');
    mark.className = 'history-card-mark';
    mark.textContent = String(entry.score);

    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const items = document.createElement('p');
    items.textContent = entry.items.join(' · ');
    copy.append(title, items);

    const time = document.createElement('time');
    const date = new Date(entry.createdAt);
    time.dateTime = entry.createdAt;
    time.textContent = `${date.getMonth() + 1}/${date.getDate()}`;

    card.append(mark, copy, time);
    list.append(card);
  });

  const hasHistory = state.history.length > 0;
  empty.classList.toggle('is-hidden', hasHistory);
  clearButton.classList.toggle('is-hidden', !hasHistory);
  document.querySelector('[data-history-count]').textContent = String(state.history.length);
}

function clearHistory() {
  if (!window.confirm('确定清空当前小工具内的全部搭配记录吗？')) return;
  state.history = [];
  writeHistory();
  renderHistory();
}

function savePreferences() {
  const payload = {
    scene: state.scene,
    weather: state.weather,
    mood: state.mood,
    items: Array.from(state.items),
    history: state.history
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // 沙箱可能禁用或清理本地存储；流程仍可在当前会话中继续。
  }
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Array.isArray(saved.history) ? saved.history : [];
  } catch (error) {
    return [];
  }
}

function restorePreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (sceneRules[saved.scene]) state.scene = saved.scene;
    if (Object.prototype.hasOwnProperty.call(weatherNotes, saved.weather)) state.weather = saved.weather;
    if (Object.prototype.hasOwnProperty.call(moodAdjustments, saved.mood)) state.mood = saved.mood;
    if (Array.isArray(saved.items) && saved.items.length) state.items = new Set(saved.items.filter((id) => itemNames[id]));
  } catch (error) {
    // 使用默认偏好。
  }

  ['scene', 'weather', 'mood'].forEach((groupName) => {
    const group = document.querySelector(`[data-choice-group="${groupName}"]`);
    group.querySelectorAll('button[data-value]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.value === state[groupName]);
    });
  });
  renderCloset();
}

function writeHistory() {
  savePreferences();
}

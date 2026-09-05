"use strict";

const STORAGE_KEY = "stylemate-personalized-v2";
const TOTAL_QUESTIONS = 6;
const RESULT_STEP = 7;
const QUESTION_KEYS = ["scene", "weather", "activity", "mood", "color", "fit"];

const state = {
  step: 1,
  scene: "",
  weather: "",
  activity: "",
  mood: "",
  color: "",
  fit: "",
  photoDataUrl: "",
  photoName: "",
  history: loadHistory(),
  previousScreen: "intro",
};

const stepMeta = {
  1: ["场合", "下一步：气温"],
  2: ["气温", "下一步：行程"],
  3: ["行程", "下一步：气质"],
  4: ["气质", "下一步：配色"],
  5: ["配色", "下一步：版型"],
  6: ["版型", "生成完整搭配"],
  7: ["搭配完成", ""],
};

const sceneProfiles = {
  work: {
    title: "通勤叠穿",
    summary: "利落轮廓里留一点松弛，适合办公室与日常移动。",
    bag: "结构感腋下包",
  },
  date: {
    title: "约会造型",
    summary: "把视觉重点放在面部附近，柔和但不会显得刻意。",
    bag: "小号半月包",
  },
  weekend: {
    title: "周末轻装",
    summary: "轻便层次与舒适比例兼顾，适合散步和临时行程。",
    bag: "轻量托特包",
  },
  event: {
    title: "重要场合套装",
    summary: "清晰肩线和完整配色，让表达更有分量。",
    bag: "简洁手提包",
  },
};

const weatherProfiles = {
  hot: {
    outer: "轻薄短袖衬衫",
    note: "外层敞开穿，选择透气面料。",
  },
  warm: {
    outer: "轻量棉质外套",
    note: "保留可脱下的轻薄外层。",
  },
  mild: {
    outer: "廓形西装",
    note: "袖口轻挽，露出手腕更轻盈。",
  },
  cold: {
    outer: "长款羊毛外套",
    note: "用贴身打底减少厚重感。",
  },
};

const activityProfiles = {
  indoor: {
    shoe: "软皮乐福鞋",
    note: "鞋面保持简洁，适合久坐与室内移动。",
  },
  walking: {
    shoe: "轻量白色球鞋",
    note: "鞋底优先缓震，裤脚不要堆在鞋面。",
  },
  balanced: {
    shoe: "低跟短靴",
    note: "低跟兼顾步行和正式度。",
  },
};

const moodProfiles = {
  clean: {
    prefix: "清爽",
    top: "挺括白衬衫",
    detail: "保持线条干净，只留一个视觉重点。",
  },
  soft: {
    prefix: "柔和",
    top: "奶油色细针织",
    detail: "让柔软材质靠近面部，整体更亲和。",
  },
  retro: {
    prefix: "轻复古",
    top: "焦糖色翻领针织",
    detail: "用经典领型和暖色小面积定调。",
  },
  street: {
    prefix: "都市",
    top: "短款灰色卫衣",
    detail: "上短下长，保留宽松但清晰的轮廓。",
  },
};

const colorProfiles = {
  candy: {
    name: "亮色点睛",
    accessory: "橙色镜框",
    note: "亮色控制在两处，其余用基础色连接。",
    image: "./assets/images/stylemate-flat-look.png",
    imageAlt: "蓝色外套与明亮配饰组成的平面穿搭插画",
  },
  neutral: {
    name: "中性色",
    accessory: "银色细框眼镜",
    note: "用深浅层次代替强烈色差。",
    image: "./assets/images/stylemate-flat-look.png",
    imageAlt: "利落外套、长裤与简洁配饰组成的平面穿搭插画",
  },
  soft: {
    name: "低饱和",
    accessory: "雾蓝丝巾",
    note: "相邻颜色保持相近明度，画面更柔和。",
    image: "./assets/images/stylemate-flat-look-soft.png",
    imageAlt: "薄荷色开衫、粉色半裙与白色球鞋组成的平面穿搭插画",
  },
  contrast: {
    name: "大胆撞色",
    accessory: "亮色几何耳饰",
    note: "让撞色集中在上半身和配饰之间。",
    image: "./assets/images/stylemate-flat-look-bold.png",
    imageAlt: "橙色夹克、蓝色针织与黄色短靴组成的平面穿搭插画",
  },
};

const fitProfiles = {
  tall: {
    bottom: "高腰直筒西裤",
    note: "腰线提高两指，裤长刚好覆盖鞋面。",
  },
  relaxed: {
    bottom: "垂感阔腿裤",
    note: "上装轻收，下装保留垂直空间。",
  },
  waist: {
    bottom: "高腰 A 字半裙",
    note: "把最窄处留在腰线上方，比例更清楚。",
  },
  easy: {
    bottom: "直筒牛仔裤",
    note: "不强调曲线，用顺直裤线保持精神。",
  },
};

const screens = Array.from(document.querySelectorAll("[data-screen]"));
const steps = Array.from(document.querySelectorAll("[data-step]"));
const flowFooter = document.querySelector("[data-flow-footer]");
const photoInput = document.querySelector("#photo-input");

document.addEventListener("click", handleClick);
photoInput.addEventListener("change", handlePhotoSelection);
renderHistory();
restorePreferences();

function handleClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    runAction(actionTarget.dataset.action);
    return;
  }

  const choice = event.target.closest("[data-choice-group] button[data-value]");
  if (choice) selectChoice(choice);
}

function runAction(action) {
  const actions = {
    start: startFlow,
    next: goNext,
    back: goBack,
    "go-home": goHome,
    restart: restartFlow,
    "remove-photo": clearPhoto,
    "save-look": saveLook,
    "show-history": showHistory,
    "close-history": closeHistory,
    "clear-history": clearHistory,
  };
  if (actions[action]) actions[action]();
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-hidden", screen.dataset.screen !== name);
  });
  document
    .querySelector(".topbar")
    .classList.toggle("is-hidden", name !== "intro");
  window.scrollTo(0, 0);
}

function showFlow(step) {
  state.step = step;
  showScreen("flow");
  renderStep();
}

function renderStep() {
  steps.forEach((step) => {
    step.classList.toggle(
      "is-hidden",
      Number(step.dataset.step) !== state.step,
    );
  });

  const isResult = state.step === RESULT_STEP;
  document
    .querySelector('[data-screen="flow"]')
    .classList.toggle("is-result-view", isResult);
  document.querySelector("[data-step-label]").textContent = isResult
    ? "完成"
    : `${state.step} / ${TOTAL_QUESTIONS}`;
  document.querySelector("[data-step-title]").textContent =
    stepMeta[state.step][0];

  const progressValue = Math.min(state.step, TOTAL_QUESTIONS);
  const progress = document.querySelector(".progress-track");
  progress.dataset.progressStep = String(progressValue);
  const nativeProgress = document.querySelector("[data-progress-native]");
  nativeProgress.value = progressValue;
  nativeProgress.textContent = `${progressValue} / ${TOTAL_QUESTIONS}`;

  flowFooter.classList.toggle("is-hidden", isResult);
  if (!isResult) {
    document.querySelector("[data-next-label]").textContent =
      stepMeta[state.step][1];
  }
  updateStepAvailability();
  if (isResult) renderResult();
  window.scrollTo(0, 0);
}

function goNext() {
  if (state.step < RESULT_STEP) {
    const answerKey = QUESTION_KEYS[state.step - 1];
    if (!answerKey || !state[answerKey]) return;

    state.step += 1;
    savePreferences();
    renderStep();
  }
}

function startFlow() {
  resetAnswers();
  clearPhoto();
  showFlow(1);
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
  state.previousScreen = "intro";
  showScreen("intro");
}

function restartFlow() {
  resetAnswers();
  state.step = 1;
  clearPhoto();
  document.querySelector("[data-save-feedback]").classList.add("is-hidden");
  renderStep();
}

function selectChoice(choice) {
  const group = choice.closest("[data-choice-group]");
  group.querySelectorAll("button[data-value]").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  choice.classList.add("is-selected");
  choice.setAttribute("aria-pressed", "true");
  state[group.dataset.choiceGroup] = choice.dataset.value;
  document.querySelector("[data-save-feedback]").classList.add("is-hidden");
  savePreferences();
  updateStepAvailability();
}

function updateStepAvailability() {
  if (state.step === RESULT_STEP) return;

  const answerKey = QUESTION_KEYS[state.step - 1];
  const hasAnswer = Boolean(answerKey && state[answerKey]);
  const nextButton = document.querySelector('[data-action="next"]');
  const hint = document.querySelector("[data-flow-hint]");

  if (nextButton) nextButton.disabled = !hasAnswer;
  if (hint) hint.classList.toggle("is-hidden", hasAnswer);
}

function resetAnswers() {
  QUESTION_KEYS.forEach((key) => {
    state[key] = "";
  });

  document
    .querySelectorAll("[data-choice-group] button[data-value]")
    .forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
}

function handlePhotoSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.photoDataUrl = String(reader.result || "");
    state.photoName = file.name;
    document.querySelector("[data-photo-image]").src = state.photoDataUrl;
    document.querySelector("[data-photo-name]").textContent = file.name;
    document.querySelector("[data-photo-empty]").classList.add("is-hidden");
    document
      .querySelector("[data-photo-preview]")
      .classList.remove("is-hidden");
  });
  reader.readAsDataURL(file);
}

function clearPhoto() {
  state.photoDataUrl = "";
  state.photoName = "";
  photoInput.value = "";
  document.querySelector("[data-photo-image]").removeAttribute("src");
  document.querySelector("[data-photo-empty]").classList.remove("is-hidden");
  document.querySelector("[data-photo-preview]").classList.add("is-hidden");
}

function buildLook() {
  const scene = sceneProfiles[state.scene];
  const weather = weatherProfiles[state.weather];
  const activity = activityProfiles[state.activity];
  const mood = moodProfiles[state.mood];
  const color = colorProfiles[state.color];
  const fit = fitProfiles[state.fit];

  return {
    title: `${mood.prefix}${scene.title}`,
    summary: `${scene.summary} 配色选择“${color.name}”。`,
    top: mood.top,
    outer: weather.outer,
    bottom: fit.bottom,
    shoe: activity.shoe,
    bag: scene.bag,
    accessory: color.accessory,
    note: `${fit.note}${weather.note}${activity.note}${mood.detail}${color.note}`,
    image: color.image,
    imageAlt: color.imageAlt,
    palette: state.color,
  };
}

function renderResult() {
  const look = buildLook();

  document.querySelector("[data-result-title]").textContent = look.title;
  document.querySelector("[data-result-summary]").textContent = look.summary;
  document.querySelector("[data-result-note]").textContent = look.note;
  document.querySelector("[data-result-top]").textContent = look.top;
  document.querySelector("[data-result-outer]").textContent = look.outer;
  document.querySelector("[data-result-bottom]").textContent = look.bottom;
  document.querySelector("[data-result-shoe]").textContent = look.shoe;
  document.querySelector("[data-result-bag]").textContent = look.bag;
  document.querySelector("[data-result-accessory]").textContent =
    look.accessory;
  document.querySelector("[data-result-image]").src = look.image;
  document.querySelector("[data-result-image]").alt = look.imageAlt;
  document.querySelector("[data-result-visual]").dataset.palette = look.palette;

  const photoWrap = document.querySelector("[data-result-photo-wrap]");
  photoWrap.classList.toggle("is-hidden", !state.photoDataUrl);
  if (state.photoDataUrl) {
    document.querySelector("[data-result-photo]").src = state.photoDataUrl;
  }
}

function saveLook() {
  const look = buildLook();
  const entry = {
    id: String(Date.now()),
    title: look.title,
    items: [
      look.top,
      look.outer,
      look.bottom,
      look.shoe,
      look.bag,
      look.accessory,
    ],
    createdAt: new Date().toISOString(),
  };
  state.history = [entry, ...state.history].slice(0, 12);
  writeHistory();
  renderHistory();
  document.querySelector("[data-save-feedback]").classList.remove("is-hidden");
}

function showHistory() {
  const current = screens.find(
    (screen) => !screen.classList.contains("is-hidden"),
  );
  state.previousScreen = current ? current.dataset.screen : "intro";
  renderHistory();
  showScreen("history");
}

function closeHistory() {
  showScreen(
    state.previousScreen === "history" ? "intro" : state.previousScreen,
  );
}

function renderHistory() {
  const list = document.querySelector("[data-history-list]");
  const empty = document.querySelector("[data-history-empty]");
  const clearButton = document.querySelector('[data-action="clear-history"]');
  list.replaceChildren();

  state.history.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "history-card";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const items = document.createElement("p");
    items.textContent = entry.items.join(" · ");
    copy.append(title, items);

    const time = document.createElement("time");
    const date = new Date(entry.createdAt);
    time.dateTime = entry.createdAt;
    time.textContent = `${date.getMonth() + 1}/${date.getDate()}`;

    card.append(copy, time);
    list.append(card);
  });

  const hasHistory = state.history.length > 0;
  empty.classList.toggle("is-hidden", hasHistory);
  clearButton.classList.toggle("is-hidden", !hasHistory);
  document.querySelector("[data-history-count]").textContent = String(
    state.history.length,
  );
}

function clearHistory() {
  if (!window.confirm("确定清空全部搭配记录吗？")) return;
  state.history = [];
  writeHistory();
  renderHistory();
}

function savePreferences() {
  const payload = { history: state.history };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // 当前会话仍可继续。
  }
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return Array.isArray(saved.history) ? saved.history : [];
  } catch (error) {
    return [];
  }
}

function restorePreferences() {
  resetAnswers();
}

function writeHistory() {
  savePreferences();
}

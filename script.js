const defaultSiteData = {
  window: {
    kicker: "Window",
    title: "今日心情 / 今日天空",
    blocks: [
      {
        heading: "今日心情",
        text: "像一盏放在办公桌上的暖台灯，可以慢慢整理，也可以什么都不急。"
      },
      {
        heading: "今日天空",
        text: "窗外会跟着台灯切换：灯亮时是安静星空，灯调亮后是柔和日出。"
      }
    ]
  },
  bed: {
    kicker: "Bed",
    title: "碎碎念和日常短句",
    blocks: [
      {
        heading: "床边短句",
        items: ["今天也可以慢慢来。", "把没想清楚的事情先放在枕头旁边。", "柔软不是退后，是给自己留一点呼吸。"]
      }
    ]
  },
  desk: {
    kicker: "Desk",
    title: "我的网页项目 / 小工具",
    blocks: [
      {
        heading: "正在整理",
        items: ["个人网站第一版", "灵感便利贴小工具", "图片收藏角落"]
      },
      {
        heading: "想做的东西",
        text: "一些轻量、安静、有一点陪伴感的网页小玩具。"
      }
    ]
  },
  computer: {
    kicker: "Computer",
    title: "作品展示",
    blocks: [
      {
        heading: "展示柜",
        text: "这里之后可以放网页作品、设计稿、视频、生成图项目，或者任何想认真收藏起来的东西。"
      }
    ]
  },
  photos: {
    kicker: "Photo wall",
    title: "图片作品 / 生成图 / 照片收藏",
    blocks: [
      {
        heading: "照片墙",
        items: ["一张夜晚房间氛围图", "几张喜欢的颜色参考", "未来的 Warma 换装记录"]
      }
    ]
  },
  notes: {
    kicker: "Sticky notes",
    title: "灵感记录 / 随手想法",
    blocks: [
      {
        heading: "便利贴",
        items: ["把首页做成真正能逛的小房间。", "每个角落都留一点未完成感。", "灯光切换时，房间像换了一种心情。"]
      }
    ]
  },
  wardrobe: {
    kicker: "Wardrobe",
    title: "Warma 换装图鉴",
    blocks: [
      {
        heading: "衣柜里暂时有",
        items: ["奶白色居家裙", "粉白小披肩", "深蓝星星发夹"]
      },
      {
        heading: "下一步",
        text: "之后可以把不同服装插画放进 assets 文件夹，再在这里做成图鉴。"
      }
    ]
  },
  drawer: {
    kicker: "Secret drawer",
    title: "隐藏彩蛋",
    blocks: [
      {
        heading: "你拉开了抽屉",
        text: "里面有一张小纸条：这里还没整理完，但已经给你留了位置。"
      }
    ]
  },
  warmaQuotes: [
    "欢迎来到留白的小房间。",
    "今天也可以慢慢来。",
    "你发现了一个没整理完的小角落。",
    "灯一直亮着，欢迎进来坐坐。",
    "要看看今天的灵感吗？"
  ]
};

let siteData = cloneData(defaultSiteData);
let drawerClickCount = 0;
let drawerClickTimer = null;
let drawerOpenTimer = null;
let outfitIndex = 0;
let hoverLayerName = null;

const warmaOutfits = [
  {
    name: "正常衣服",
    layer: "assets/layer-warma-normal.png",
    quote: "换回平时的衣服，继续在床边看雨。"
  },
  {
    name: "睡衣",
    layer: "assets/layer-warma-pajamas.png",
    quote: "睡衣模式，今天适合早点休息。"
  },
  {
    name: "居家轻便服",
    layer: "assets/layer-warma-lounge.png",
    quote: "换成居家轻便服，房间还是暖暖的。"
  }
];

const layerLabels = {
  warma: "Warma",
  lamp: "台灯 · 切换昼夜",
  drawer: "秘密抽屉",
  computer: "作品电脑",
  desk: "项目书桌",
  notes: "灵感便利贴",
  photos: "照片墙"
};

const hitOrder = ["warma", "lamp", "drawer", "computer", "desk", "notes", "photos"];
const hitAlphaThreshold = 20;

const modal = document.querySelector("#contentModal");
const modalTitle = document.querySelector("#modalTitle");
const modalKicker = document.querySelector("#modalKicker");
const modalContent = document.querySelector("#modalContent");
const closeModalButton = document.querySelector(".close-modal");
const speechBubble = document.querySelector("#speechBubble");
const developerPanel = document.querySelector("#developerPanel");
const dataEditor = document.querySelector("#dataEditor");
const developerStatus = document.querySelector("#developerStatus");
const room = document.querySelector("#room");
const roomFadeLayer = document.querySelector("#roomFadeLayer");
const hitCanvas = document.querySelector("#hitCanvas");
const hitContext = hitCanvas.getContext("2d", { willReadFrequently: true });
const hitLabel = document.querySelector("#hitLabel");
const bgNight = document.querySelector("#bgNight");
const bgDay = document.querySelector("#bgDay");
const warmaLayer = document.querySelector("#warmaLayer");
const objectLayers = Array.from(document.querySelectorAll(".object-layer"));
const layerMap = Object.fromEntries(objectLayers.map((layer) => [layer.dataset.layer, layer]));

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderBlocks(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return '<div class="content-block"><p>这里还空着，等一枚新的灵感入住。</p></div>';
  }

  return blocks.map((block) => {
    const heading = block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : "";
    const text = block.text ? `<p>${escapeHtml(block.text)}</p>` : "";
    const items = Array.isArray(block.items)
      ? `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";

    return `<div class="content-block">${heading}${text}${items}</div>`;
  }).join("");
}

function openPanel(panelName) {
  const data = siteData[panelName];
  if (!data) return;

  modalKicker.textContent = data.kicker || "Room corner";
  modalTitle.textContent = data.title || "未命名角落";
  modalContent.innerHTML = renderBlocks(data.blocks);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  closeModalButton.focus();
}

function closePanel() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function showSpeech(text) {
  speechBubble.textContent = text;
  speechBubble.classList.add("show");
  window.clearTimeout(showSpeech.hideTimer);
  showSpeech.hideTimer = window.setTimeout(() => {
    speechBubble.classList.remove("show");
  }, 3600);
}

function showRandomWarmaQuote() {
  const quotes = Array.isArray(siteData.warmaQuotes) && siteData.warmaQuotes.length
    ? siteData.warmaQuotes
    : defaultSiteData.warmaQuotes;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  showSpeech(quote);
}

function activeBackgroundUrl() {
  return document.body.classList.contains("day-mode") ? bgDay.currentSrc || bgDay.src : bgNight.currentSrc || bgNight.src;
}

function crossfadeRoomBackground(updateBackground, previousUrl = activeBackgroundUrl()) {
  roomFadeLayer.style.backgroundImage = `url("${previousUrl}")`;
  roomFadeLayer.style.transition = "none";
  roomFadeLayer.style.opacity = "1";
  roomFadeLayer.offsetWidth;
  updateBackground();
  window.requestAnimationFrame(() => {
    roomFadeLayer.style.transition = "opacity 820ms ease";
    roomFadeLayer.style.opacity = "0";
  });
}

function cycleWarmaOutfit() {
  outfitIndex = (outfitIndex + 1) % warmaOutfits.length;
  const outfit = warmaOutfits[outfitIndex];
  warmaLayer.style.opacity = "0";
  window.setTimeout(() => {
    warmaLayer.src = outfit.layer;
    warmaLayer.onload = () => {
      warmaLayer.style.opacity = "1";
    };
  }, 160);
  showSpeech(outfit.quote);
}

function toggleDayMode() {
  crossfadeRoomBackground(() => {
    document.body.classList.toggle("day-mode");
  });
  const isDay = document.body.classList.contains("day-mode");
  showSpeech(isDay ? "台灯调亮了，窗外慢慢变成日出。" : "台灯重新亮起，窗外回到安静星空。");
}

function handleDrawerSecret() {
  drawerClickCount += 1;
  window.clearTimeout(drawerClickTimer);
  window.clearTimeout(drawerOpenTimer);
  drawerClickTimer = window.setTimeout(() => {
    drawerClickCount = 0;
  }, 1600);

  if (drawerClickCount >= 5) {
    drawerClickCount = 0;
    openDeveloperPanel();
    return;
  }

  drawerOpenTimer = window.setTimeout(() => {
    if (drawerClickCount > 0 && drawerClickCount < 5) {
      openPanel("drawer");
      drawerClickCount = 0;
    }
  }, 420);
}

function getRoomImageCoordinates(event) {
  const rect = room.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const baseImage = bgNight.complete && bgNight.naturalWidth ? bgNight : objectLayers.find((img) => img.complete && img.naturalWidth);
  const naturalWidth = baseImage?.naturalWidth || 1920;
  const naturalHeight = baseImage?.naturalHeight || 1080;

  return {
    cssX: x,
    cssY: y,
    imageX: Math.round((x / rect.width) * naturalWidth),
    imageY: Math.round((y / rect.height) * naturalHeight),
    naturalWidth,
    naturalHeight
  };
}

function pixelAlphaAt(image, imageX, imageY, naturalWidth, naturalHeight) {
  if (!image || !image.complete || !image.naturalWidth) return 0;
  if (imageX < 0 || imageY < 0 || imageX >= naturalWidth || imageY >= naturalHeight) return 0;

  hitCanvas.width = naturalWidth;
  hitCanvas.height = naturalHeight;
  hitContext.clearRect(0, 0, naturalWidth, naturalHeight);

  try {
    hitContext.drawImage(image, 0, 0, naturalWidth, naturalHeight);
    return hitContext.getImageData(imageX, imageY, 1, 1).data[3];
  } catch {
    return 0;
  }
}

function detectLayerAt(event) {
  const point = getRoomImageCoordinates(event);

  for (const name of hitOrder) {
    const layer = layerMap[name];
    const alpha = pixelAlphaAt(layer, point.imageX, point.imageY, point.naturalWidth, point.naturalHeight);
    if (alpha > hitAlphaThreshold) {
      return { name, ...point };
    }
  }

  if (isBedFallbackHit(point)) {
    return { name: "bed", ...point };
  }

  return null;
}

function isBedFallbackHit(point) {
  const x = point.imageX / point.naturalWidth;
  const y = point.imageY / point.naturalHeight;
  return x >= 0.02 && x <= 0.68 && y >= 0.72 && y <= 0.98;
}

function setHoveredLayer(name, point) {
  if (hoverLayerName === name) return;
  objectLayers.forEach((layer) => layer.classList.toggle("is-hovered", layer.dataset.layer === name));
  hoverLayerName = name;

  if (!name) {
    hitLabel.classList.remove("is-visible");
    return;
  }

  hitLabel.textContent = layerLabels[name] || "可互动角落";
  if (point) {
    hitLabel.style.left = `${point.cssX}px`;
    hitLabel.style.top = `${point.cssY}px`;
  }
  hitLabel.classList.add("is-visible");
}

function handleLayerClick(event) {
  const hit = detectLayerAt(event);
  if (!hit) return;

  if (hit.name === "lamp") {
    toggleDayMode();
    return;
  }

  if (hit.name === "warma") {
    cycleWarmaOutfit();
    return;
  }

  if (hit.name === "drawer") {
    handleDrawerSecret();
    return;
  }

  openPanel(hit.name);
}

function openDeveloperPanel() {
  dataEditor.value = JSON.stringify(siteData, null, 2);
  developerStatus.textContent = "开发者面板已打开，可以编辑 JSON 后应用。";
  developerPanel.classList.add("is-open");
  developerPanel.setAttribute("aria-hidden", "false");
  dataEditor.focus();
}

function closeDeveloperPanel() {
  developerPanel.classList.remove("is-open");
  developerPanel.setAttribute("aria-hidden", "true");
}

function applyEditorData() {
  try {
    const parsed = JSON.parse(dataEditor.value);
    siteData = parsed;
    developerStatus.textContent = "修改已应用。现在点击房间物品会使用新数据。";
    showSpeech("数据已经悄悄更新好了。");
  } catch (error) {
    developerStatus.textContent = `JSON 格式有问题：${error.message}`;
  }
}

async function exportEditorData() {
  const json = JSON.stringify(siteData, null, 2);
  dataEditor.value = json;
  dataEditor.select();

  try {
    await navigator.clipboard.writeText(json);
    developerStatus.textContent = "当前 JSON 已放进剪贴板，也显示在编辑框里。";
  } catch {
    developerStatus.textContent = "当前 JSON 已显示在编辑框里，可以手动复制。";
  }
}

function importEditorData() {
  applyEditorData();
}

function resetEditorData() {
  siteData = cloneData(defaultSiteData);
  dataEditor.value = JSON.stringify(siteData, null, 2);
  developerStatus.textContent = "已重置为默认数据。";
  showSpeech("房间恢复到了最初的样子。");
}

function preloadImages() {
  [
    "assets/layer-bg-night.png",
    "assets/layer-bg-day.png",
    ...warmaOutfits.map((outfit) => outfit.layer),
    ...objectLayers.map((layer) => layer.getAttribute("src"))
  ].forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}

room.addEventListener("click", handleLayerClick);
room.addEventListener("mousemove", (event) => {
  const hit = detectLayerAt(event);
  setHoveredLayer(hit?.name || null, hit);
});
room.addEventListener("mouseleave", () => setHoveredLayer(null));

const enterButton = document.querySelector("[data-action='enter']");
const randomButton = document.querySelector("[data-action='random-room']");
const drawerButton = document.querySelector("[data-action='drawer']");

enterButton?.addEventListener("click", () => {
  room.scrollIntoView({ behavior: "smooth", block: "center" });
  showSpeech("灯一直亮着，欢迎进来坐坐。");
});

randomButton?.addEventListener("click", () => {
  const panels = ["window", "bed", "desk", "computer", "photos", "notes"];
  openPanel(panels[Math.floor(Math.random() * panels.length)]);
});

drawerButton?.addEventListener("click", handleDrawerSecret);
closeModalButton.addEventListener("click", closePanel);
document.querySelector("#closeDeveloper").addEventListener("click", closeDeveloperPanel);
document.querySelector("#applyData").addEventListener("click", applyEditorData);
document.querySelector("#exportData").addEventListener("click", exportEditorData);
document.querySelector("#importData").addEventListener("click", importEditorData);
document.querySelector("#resetData").addEventListener("click", resetEditorData);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closePanel();
});

developerPanel.addEventListener("click", (event) => {
  if (event.target === developerPanel) closeDeveloperPanel();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closePanel();
  closeDeveloperPanel();
});

window.addEventListener("load", () => {
  preloadImages();
  room.classList.add("is-ready");
  window.setTimeout(() => showSpeech(defaultSiteData.warmaQuotes[0]), 600);
});
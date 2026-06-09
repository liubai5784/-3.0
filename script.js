const STORAGE_KEY = "liubai-room-config";

const defaultRoomConfig = {
  site: {
    eyebrow: "A warm little personal room",
    title: "留白的小房间",
    subtitle: "这里放着一些灵感、碎碎念、作品和没整理完的小心事。"
  },
  layers: {
    bgNight: "assets/layer-bg-night.png",
    bgDay: "assets/layer-bg-day.png",
    photos: "assets/layer-photos.png",
    notes: "assets/layer-notes.png",
    desk: "assets/layer-desk-items.png",
    computer: "assets/layer-computer.png",
    lamp: "assets/layer-lamp.png"
  },
  outfits: [
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
  ],
  panels: {
    window: {
      kicker: "Window",
      title: "今日心情 / 今日天空",
      blocks: [
        { heading: "今日心情", text: "像一盏放在办公桌上的暖台灯，可以慢慢整理，也可以什么都不急。" },
        { heading: "今日天空", text: "窗外会跟着台灯切换：灯亮时是安静星空，灯调亮后是柔和日出。" }
      ]
    },
    bed: {
      kicker: "Bed",
      title: "碎碎念和日常短句",
      blocks: [
        { heading: "床边短句", items: ["今天也可以慢慢来。", "把没想清楚的事情先放在枕头旁边。", "柔软不是退后，是给自己留一点呼吸。"] }
      ]
    },
    desk: {
      kicker: "Desk",
      title: "我的网页项目 / 小工具",
      blocks: [
        { heading: "正在整理", items: ["个人网站第一版", "灵感便利贴小工具", "图片收藏角落"] },
        { heading: "想做的东西", text: "一些轻量、安静、有一点陪伴感的网页小玩具。" }
      ]
    },
    computer: {
      kicker: "Computer",
      title: "作品展示",
      blocks: [
        { heading: "展示柜", text: "这里之后可以放网页作品、设计稿、视频、生成图项目，或者任何想认真收藏起来的东西。" }
      ]
    },
    photos: {
      kicker: "Photo wall",
      title: "图片作品 / 生成图 / 照片收藏",
      blocks: [
        { heading: "照片墙", items: ["一张夜晚房间氛围图", "几张喜欢的颜色参考", "未来的 Warma 换装记录"] }
      ]
    },
    notes: {
      kicker: "Sticky notes",
      title: "灵感记录 / 随手想法",
      blocks: [
        { heading: "便利贴", items: ["把首页做成真正能逛的小房间。", "每个角落都留一点未完成感。", "灯光切换时，房间像换了一种心情。"] }
      ]
    }
  },
  warmaQuotes: [
    "欢迎来到留白的小房间。",
    "今天也可以慢慢来。",
    "你发现了一个没整理完的小角落。",
    "灯一直亮着，欢迎进来坐坐。",
    "要看看今天的灵感吗？"
  ]
};

let roomConfig = loadRoomConfig();
let siteData = roomConfig.panels;
let outfitIndex = 0;
let hoverLayerName = null;

const layerLabels = {
  warma: "Warma",
  lamp: "台灯 · 切换昼夜",
  computer: "作品电脑",
  desk: "项目书桌",
  notes: "灵感便利贴",
  photos: "照片墙"
};

const hitOrder = ["warma", "lamp", "computer", "desk", "notes", "photos"];
const hitAlphaThreshold = 20;

const modal = document.querySelector("#contentModal");
const modalTitle = document.querySelector("#modalTitle");
const modalKicker = document.querySelector("#modalKicker");
const modalContent = document.querySelector("#modalContent");
const closeModalButton = document.querySelector(".close-modal");
const speechBubble = document.querySelector("#speechBubble");
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

function mergeConfig(base, override) {
  if (!override || typeof override !== "object") return cloneData(base);
  const merged = cloneData(base);
  if (override.site) merged.site = { ...merged.site, ...override.site };
  if (override.layers) merged.layers = { ...merged.layers, ...override.layers };
  if (Array.isArray(override.outfits)) merged.outfits = override.outfits;
  if (override.panels) merged.panels = { ...merged.panels, ...override.panels };
  if (Array.isArray(override.warmaQuotes)) merged.warmaQuotes = override.warmaQuotes;
  return merged;
}

function loadRoomConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return mergeConfig(defaultRoomConfig, saved);
  } catch {
    return cloneData(defaultRoomConfig);
  }
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

function applyConfigToPage() {
  document.title = roomConfig.site.title || "留白的小房间";
  document.querySelector("#siteEyebrow").textContent = roomConfig.site.eyebrow || "";
  document.querySelector("#site-title").textContent = roomConfig.site.title || "留白的小房间";
  document.querySelector("#siteSubtitle").textContent = roomConfig.site.subtitle || "";

  bgNight.src = roomConfig.layers.bgNight;
  bgDay.src = roomConfig.layers.bgDay;
  layerMap.photos.src = roomConfig.layers.photos;
  layerMap.notes.src = roomConfig.layers.notes;
  layerMap.desk.src = roomConfig.layers.desk;
  layerMap.computer.src = roomConfig.layers.computer;
  layerMap.lamp.src = roomConfig.layers.lamp;
  warmaLayer.src = roomConfig.outfits[0]?.layer || "assets/layer-warma-normal.png";
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
  const quotes = Array.isArray(roomConfig.warmaQuotes) && roomConfig.warmaQuotes.length
    ? roomConfig.warmaQuotes
    : defaultRoomConfig.warmaQuotes;
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
  const outfits = roomConfig.outfits.length ? roomConfig.outfits : defaultRoomConfig.outfits;
  outfitIndex = (outfitIndex + 1) % outfits.length;
  const outfit = outfits[outfitIndex];
  warmaLayer.style.opacity = "0";
  window.setTimeout(() => {
    warmaLayer.src = outfit.layer;
    warmaLayer.onload = () => {
      warmaLayer.style.opacity = "1";
    };
  }, 160);
  showSpeech(outfit.quote || outfit.name || "换装完成。");
}

function toggleDayMode() {
  crossfadeRoomBackground(() => {
    document.body.classList.toggle("day-mode");
  });
  const isDay = document.body.classList.contains("day-mode");
  showSpeech(isDay ? "台灯调亮了，窗外慢慢变成日出。" : "台灯重新亮起，窗外回到安静星空。");
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

  openPanel(hit.name);
}

function preloadImages() {
  [
    roomConfig.layers.bgNight,
    roomConfig.layers.bgDay,
    ...roomConfig.outfits.map((outfit) => outfit.layer),
    ...objectLayers.map((layer) => layer.getAttribute("src"))
  ].forEach((src) => {
    if (!src) return;
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

enterButton?.addEventListener("click", () => {
  room.scrollIntoView({ behavior: "smooth", block: "center" });
  showSpeech("灯一直亮着，欢迎进来坐坐。");
});

randomButton?.addEventListener("click", () => {
  const panels = ["window", "bed", "desk", "computer", "photos", "notes"];
  openPanel(panels[Math.floor(Math.random() * panels.length)]);
});

closeModalButton.addEventListener("click", closePanel);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closePanel();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closePanel();
});

window.addEventListener("load", () => {
  applyConfigToPage();
  preloadImages();
  room.classList.add("is-ready");
  window.setTimeout(() => showSpeech(roomConfig.warmaQuotes[0] || defaultRoomConfig.warmaQuotes[0]), 600);
});

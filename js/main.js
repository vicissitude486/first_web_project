/* ==========================================================
   main.js —— 主页交互逻辑（版本二）

   1. 封面 Enter 进入主页 / 回到封面
   2. 亮色 / 暗色主题切换（localStorage 记住选择）
   3. 左侧导航跟随滚动高亮
   4. 回到顶部按钮
   5. 背景音乐：进入主页自动播放，右上角音符按钮可关闭
   ========================================================== */

var root = document.documentElement;
var body = document.body;

var enterBtn = document.getElementById("enterBtn");
var toCoverBtn = document.getElementById("toCover");
var themeBtn = document.getElementById("themeToggle");
var backTop = document.getElementById("backTop");
var bgm = document.getElementById("bgm");
var musicBtn = document.getElementById("musicBtn");
var musicTip = document.getElementById("musicTip");
var musicTipText = document.getElementById("musicTipText");
var musicTipBtn = document.getElementById("musicTipBtn");


/* ---------- 1. 封面 Enter ---------- */

function enterSite() {
    body.classList.add("is-entered");
    body.classList.remove("is-locked");
    window.scrollTo({ top: 0, behavior: "instant" });
    updateActiveLink();
    updateBackTop();
    // 必须在这个点击事件里同步调用，浏览器才允许出声音；
    // 上次关过就先不响，用户点右上角音符随时能开
    if (musicOn) {
        playMusic();
    }
}

function backToCover() {
    body.classList.remove("is-entered");
    body.classList.add("is-locked");
    window.scrollTo({ top: 0, behavior: "instant" });
    pauseMusic();
}

enterBtn.addEventListener("click", enterSite);
toCoverBtn.addEventListener("click", backToCover);

// 在封面页按键盘 Enter 也能进（呼应按钮名字）
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !body.classList.contains("is-entered")) {
        enterSite();
    }
});


/* ---------- 2. 主题切换 ---------- */

var savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
}

function updateThemeBtn() {
    var isDark = root.getAttribute("data-theme") === "dark";
    themeBtn.textContent = isDark ? "日间" : "夜间";
    themeBtn.setAttribute("aria-label", isDark ? "切换到亮色主题" : "切换到暗色主题");
}

updateThemeBtn();

themeBtn.addEventListener("click", function () {
    var isDark = root.getAttribute("data-theme") === "dark";

    if (isDark) {
        root.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
    } else {
        root.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    }

    updateThemeBtn();
});


/* ---------- 3. 导航高亮 ---------- */

var sections = document.querySelectorAll(".content section[id]");
var navItems = document.querySelectorAll(".side-nav a.nav-item");

function updateActiveLink() {
    var currentId = "";

    // 从上往下扫，最后一个"顶部已经滚过 120px"的区块就是当前区块
    sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= 120) {
            currentId = section.id;
        }
    });

    navItems.forEach(function (item) {
        var isActive = item.getAttribute("href") === "#" + currentId;
        item.classList.toggle("active", isActive);
    });
}


/* ---------- 4. 回到顶部 ---------- */

function updateBackTop() {
    backTop.classList.toggle("show", window.scrollY > 400);
}

backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
});


/* ---------- 两个效果共用同一个滚动监听 ---------- */

window.addEventListener("scroll", function () {
    updateActiveLink();
    updateBackTop();
});

window.addEventListener("resize", function () {
    updateActiveLink();
});

updateActiveLink();
updateBackTop();


/* ---------- 5. 背景音乐 ---------- */

// 用 sessionStorage 而不是 localStorage：关掉音乐只对"这一次打开的标签页"有效，
// 下次重新打开页面依然会自动播放 —— 否则一旦关过一次，以后就再也不响了
var musicOn = sessionStorage.getItem("music") !== "off";

var MUSIC_VOLUME = 0.45;   // 背景音乐不用太响，别盖过页面本身
var fadeTimer = null;
var musicFileError = false;   // 音频文件根本没加载到（比如没和 index.html 放一起）

// 按钮状态永远跟着"现在到底有没有在响"，而不是跟着偏好走，
// 这样被浏览器拦下来时，用户能一眼看出还没播，点一下就能开
function updateMusicBtn() {
    var playing = !bgm.paused;

    musicBtn.classList.toggle("paused", !playing);

    var label = playing ? "关闭背景音乐" : "开启背景音乐";
    musicBtn.setAttribute("aria-label", label);
    musicBtn.title = label;
}

// 出问题时才出现的提示条：把原因直接写在页面上，不用去猜
function showMusicTip(text) {
    musicTipText.textContent = text;
    musicTip.hidden = false;
}

function hideMusicTip() {
    musicTip.hidden = true;
}

// 播放和暂停时浏览器会派发事件，用它来同步按钮，避免按钮和实际状态说不一致
bgm.addEventListener("play", function () {
    hideMusicTip();
    updateMusicBtn();
});

bgm.addEventListener("pause", updateMusicBtn);

// 连文件都找不到时要明说，否则用户只会看到一个点了也没反应的按钮
bgm.addEventListener("error", function () {
    musicFileError = true;
    musicTipBtn.textContent = "知道了";
    showMusicTip("没找到 bgm.mp3，请确认它和 index.html 在同一文件夹");
});

// 音量从 0 慢慢升上来，突然出现会吓人
function fadeInVolume() {
    clearInterval(fadeTimer);

    var start = Date.now();

    fadeTimer = setInterval(function () {
        var progress = (Date.now() - start) / 1300;

        if (progress >= 1) {
            bgm.volume = MUSIC_VOLUME;
            clearInterval(fadeTimer);
            return;
        }

        bgm.volume = MUSIC_VOLUME * progress;
    }, 40);
}

function playMusic() {
    // 已经在响了就别重复调，否则浏览器会返回一个 rejected 的 play()，
    // 被当成"播放失败"误报
    if (!bgm.paused || musicFileError) {
        return;
    }

    bgm.volume = 0;

    var result = bgm.play();

    // 新版浏览器 play() 返回 Promise；被拦时会 reject，这里兜住不让控制台报错
    if (result && result.catch) {
        result.then(fadeInVolume).catch(function () {
            // 封面阶段被拦是正常的（还没点过任何东西），不打扰用户；
            // 进了主页还播不了，就必须让用户看见"点一下就能播"
            if (body.classList.contains("is-entered")) {
                showMusicTip("浏览器拦下了自动播放，点右边开始");
            }
        });
    } else {
        fadeInVolume();
    }
}

function pauseMusic() {
    clearInterval(fadeTimer);
    bgm.pause();
}

musicBtn.addEventListener("click", function () {
    // 看实际状态决定开还是关，而不是简单把偏好取反 ——
    // 否则"被浏览器拦过"或"上次关了"时会卡在点了没反应的状态
    if (bgm.paused) {
        musicOn = true;
        playMusic();
    } else {
        musicOn = false;
        pauseMusic();
    }

    sessionStorage.setItem("music", musicOn ? "on" : "off");
});

// 提示条上的按钮：这一下是真实的用户手势，一定能把音乐放起来
musicTipBtn.addEventListener("click", function () {
    if (musicFileError) {
        hideMusicTip();
        return;
    }

    musicOn = true;
    sessionStorage.setItem("music", "on");
    playMusic();
});

// 兜底：浏览器只认"用户真的动过"，所以页面上任何一次点击或按键都趁机试一次。
// 这样即使第一次被拦，用户随手点一下页面，音乐就会起来。
function tryStartMusic(event) {
    var el = event.target;

    // 点的是音乐按钮 / 提示条按钮时交给它们自己处理，
    // 否则会出现"刚关掉又被这里打开"的打架
    if (el && el.closest && el.closest("#musicBtn, #musicTipBtn")) {
        return;
    }

    if (musicOn) {
        playMusic();
    }
}

document.addEventListener("click", tryStartMusic, true);
document.addEventListener("keydown", tryStartMusic, true);
document.addEventListener("touchstart", tryStartMusic, true);

// 页面刚打开就先试一次：浏览器允许就直接响，不允许会安静地失败，
// 等用户第一次动手时再由上面的兜底接上
if (musicOn) {
    playMusic();
}

updateMusicBtn();

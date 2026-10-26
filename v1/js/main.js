/* ==========================================================
   main.js —— 主页的交互逻辑

   Round 2：亮色 / 暗色主题切换（localStorage 记住选择）
   Round 3：导航栏跟随滚动高亮 + 回到顶部按钮
   ========================================================== */

/* ---------- Round 2：主题切换 ---------- */

var root = document.documentElement;
var themeBtn = document.getElementById("themeToggle");

// 打开页面时，先读上次记住的主题
var savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
}

// 让按钮上的字跟着当前主题变化
function updateThemeBtn() {
    var isDark = root.getAttribute("data-theme") === "dark";
    themeBtn.textContent = isDark ? "日间" : "夜间";
    themeBtn.setAttribute("aria-label", isDark ? "切换到亮色主题" : "切换到暗色主题");
}

updateThemeBtn();

// 点击按钮：切换主题 + 存进 localStorage
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


/* ---------- Round 3：导航高亮 ---------- */

var sections = document.querySelectorAll(".card section[id]");
var navLinks = document.querySelectorAll(".nav-links a");

function updateActiveLink() {
    var currentId = "";

    // 从上往下扫，最后一个"顶部已经滚过导航栏"的区块就是当前区块
    sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= 100) {
            currentId = section.id;
        }
    });

    navLinks.forEach(function (link) {
        var isActive = link.getAttribute("href") === "#" + currentId;
        link.classList.toggle("active", isActive);
    });
}


/* ---------- Round 3：回到顶部 ---------- */

var backTop = document.getElementById("backTop");

function updateBackTop() {
    // 滚动超过 400px 才出现
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

// 刚打开页面时先执行一次，避免状态不对
updateActiveLink();
updateBackTop();


/* ---------- Round 4：手机端汉堡菜单 ---------- */

var navToggle = document.getElementById("navToggle");
var navMenu = document.getElementById("navMenu");

function setMenu(open) {
    navMenu.classList.toggle("open", open);
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

navToggle.addEventListener("click", function () {
    setMenu(!navMenu.classList.contains("open"));
});

// 点了菜单里的某个链接后，自动收起菜单
navMenu.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        setMenu(false);
    }
});

// 窗口拉宽回桌面尺寸时，把移动端的菜单状态清掉
window.addEventListener("resize", function () {
    if (window.innerWidth > 800) {
        setMenu(false);
    }
});

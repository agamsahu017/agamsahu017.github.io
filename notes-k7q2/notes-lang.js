// Private notes: English / Hindi switch. Every page has a <div class="en"> and a
// <div class="hi"> copy; this sets <html lang> and adds the button to the top bar.
// The choice is shared with the courses through the "kodivo-lang" key.
(function () {
  var KEY = "kodivo-lang";
  function getLang() {
    try {
      var fromUrl = new URLSearchParams(location.search).get("lang");
      if (fromUrl === "hi" || fromUrl === "en") localStorage.setItem(KEY, fromUrl);
      return localStorage.getItem(KEY) === "hi" ? "hi" : "en";
    } catch (e) {
      return new URLSearchParams(location.search).get("lang") === "hi" ? "hi" : "en";
    }
  }
  document.documentElement.lang = getLang(); // set early so the wrong copy never flashes

  function addButton() {
    var nav = document.querySelector("nav.top");
    if (!nav) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-btn";
    function show(lang) {
      document.documentElement.lang = lang;
      btn.textContent = lang === "hi" ? "English" : "हिंदी";
      btn.setAttribute("aria-label", lang === "hi" ? "Switch to English" : "हिंदी में पढ़ें");
    }
    btn.addEventListener("click", function () {
      var next = document.documentElement.lang === "hi" ? "en" : "hi";
      try { localStorage.setItem(KEY, next); } catch (e) {}
      show(next);
    });
    nav.appendChild(btn);
    show(document.documentElement.lang === "hi" ? "hi" : "en");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
  else addButton();
})();

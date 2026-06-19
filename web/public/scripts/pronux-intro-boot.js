try {
  var p = location.pathname;
  var q = location.search || "";
  if (/^\/(pt-BR|en)\/?$/.test(p) || p === "/") {
    if (/[?&]intro=0(?:&|$)/.test(q)) return;
    document.documentElement.setAttribute("data-pronux-intro-pending", "");
    setTimeout(function () {
      var r = document.documentElement;
      if (
        r.hasAttribute("data-pronux-intro-pending") &&
        !r.hasAttribute("data-pronux-intro")
      ) {
        r.removeAttribute("data-pronux-intro-pending");
      }
    }, 12000);
  }
} catch (e) {
  /* ignore */
}

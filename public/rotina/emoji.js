/* Local Twemoji assets; see emoji/LICENSE-GRAPHICS. No network dependency. */
(function () {
  "use strict";
  var choices = [["⭐", "Estrela"], ["🪥", "Escovar dentes"], ["🧼", "Sabão"], ["🚽", "Banheiro"], ["🚿", "Banho"], ["🍎", "Maçã"], ["🥛", "Copo de leite"], ["🍽️", "Refeição"], ["📚", "Livros"], ["✏️", "Lápis"], ["🎨", "Pintar"], ["🧮", "Contar"], ["🎒", "Mochila"], ["😊", "Feliz"], ["😢", "Triste"], ["😠", "Bravo"], ["😌", "Calmo"], ["⚽", "Bola"], ["🎵", "Música"], ["🛝", "Parquinho"], ["🏠", "Casa"], ["✨", "Brilhos"], ["🛏️", "Cama"], ["😴", "Dormir"], ["🚌", "Ônibus"], ["🏫", "Escola"], ["👕", "Camiseta"], ["🧥", "Casaco"], ["👟", "Tênis"], ["🥪", "Sanduíche"], ["🍌", "Banana"], ["🍪", "Biscoito"], ["🧃", "Suco"], ["🖍️", "Giz de cera"], ["✂️", "Tesoura"], ["🧩", "Quebra-cabeça"], ["🎲", "Dado"], ["📖", "Ler"], ["🖥️", "Computador"], ["🚶", "Caminhar"], ["🧘", "Meditar"], ["👏", "Palmas"], ["🤝", "Aperto de mãos"], ["🙋", "Levantar a mão"], ["😮", "Surpreso"], ["😨", "Com medo"], ["🤒", "Doente"], ["❤️", "Coração"], ["✅", "Concluído"], ["❌", "Não"], ["⏰", "Despertador"], ["☀️", "Sol"], ["🌙", "Lua"], ["🟢", "Verde"], ["🟡", "Amarelo"], ["🔴", "Vermelho"], ["📝", "Anotar"], ["🖨️", "Imprimir"], ["🗑️", "Lixeira"]];
  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function code(emoji) {
    return Array.from(emoji).filter(function (c) { return c.codePointAt(0) !== 0xfe0f; }).map(function (c) { return c.codePointAt(0).toString(16); }).join("-");
  }
  var localExtras = Object.create(null);
  function emo(emoji) {
    emoji = emoji || "⭐";
    // Unsupported saved emojis remain native, without requesting nonexistent files.
    if (!localExtras[code(emoji)] && !choices.some(function (item) { return code(item[0]) === code(emoji); })) return '<span aria-hidden="true">' + escape(emoji) + '</span>';
    return '<img class="emo-img" src="emoji/' + code(emoji) + '.svg" alt="" aria-hidden="true" width="40" height="40" loading="lazy" data-emoji="' + escape(emoji) + '">';
  }
  document.addEventListener("error", function (event) {
    var image = event.target;
    if (!image.matches || !image.matches("img.emo-img")) return;
    var fallback = document.createElement("span");
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = image.getAttribute("data-emoji") || "⭐";
    image.parentNode.replaceChild(fallback, image);
  }, true);
  function select(grid, index, focus) {
    var buttons = grid.querySelectorAll('[role="radio"]');
    grid.dataset.emoji = choices[index][0];
    var input = document.getElementById(grid.id + "-livre");
    if (input) { input.value = ""; input.removeAttribute("aria-invalid"); }
    var error = document.getElementById(grid.id + "-erro"); if (error) error.textContent = "";
    preview(grid);
    buttons.forEach(function (button, i) {
      button.setAttribute("aria-checked", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    if (focus && buttons[index]) buttons[index].focus();
  }
  function reset(grid) { select(grid, 0, false); }
  function preview(grid) {
    var view = document.getElementById(grid.id + "-preview");
    if (view) { view.innerHTML = emo(grid.dataset.emoji); view.setAttribute("aria-label", "Emoji escolhido: " + grid.dataset.emoji); }
  }
  function initLivre(grid) {
    var input = document.getElementById(grid.id + "-livre"), error = document.getElementById(grid.id + "-erro");
    if (!input || !error) return;
    input.addEventListener("input", function () {
      if (!input.value.trim()) { reset(grid); return; }
      var parts = typeof Intl !== "undefined" && Intl.Segmenter
        ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(input.value), function (s) { return s.segment; })
        : Array.from(input.value);
      var emoji = parts.find(function (part) { return /\p{Extended_Pictographic}/u.test(part); });
      if (!emoji) { error.textContent = "Digite ou cole um emoji válido."; input.setAttribute("aria-invalid", "true"); return; }
      error.textContent = ""; input.removeAttribute("aria-invalid"); grid.dataset.emoji = emoji;
      grid.querySelectorAll('[role="radio"]').forEach(function (button, i) { button.setAttribute("aria-checked", "false"); button.tabIndex = i === 0 ? 0 : -1; });
      preview(grid);
      var codigo = code(emoji);
      if (choices.some(function (item) { return code(item[0]) === codigo; }) || localExtras[codigo]) return;
      var image = new Image();
      image.onload = function () { localExtras[codigo] = true; if (grid.dataset.emoji === emoji) preview(grid); };
      image.onerror = function () { /* Preserve the native emoji fallback. */ };
      image.src = "emoji/" + codigo + ".svg";
    });
  }
  function init(grid) {
    choices.forEach(function (item, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "emoji-choice";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", item[1]);
      button.innerHTML = emo(item[0]);
      button.addEventListener("click", function () { select(grid, index, true); });
      button.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % choices.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + choices.length - 1) % choices.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = choices.length - 1;
        else return;
        event.preventDefault(); select(grid, next, true);
      });
      grid.appendChild(button);
    });
    initLivre(grid); reset(grid);
  }
  // Replace decorative UI emojis too, without altering labels or button behavior.
  function decorate(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest("script,style,textarea,input,.emoji-grid")) nodes.push(node);
    }
    var pattern = new RegExp(choices.map(function (item) { return item[0]; }).sort(function (a, b) { return b.length - a.length; }).join("|"), "gu");
    nodes.forEach(function (text) {
      pattern.lastIndex = 0;
      if (!pattern.test(text.nodeValue)) return;
      var holder = document.createElement("span");
      pattern.lastIndex = 0;
      holder.innerHTML = escape(text.nodeValue).replace(pattern, emo);
      text.parentNode.replaceChild(holder, text);
    });
  }
  window.RotinaEmoji = { emo: emo, code: code, init: init, reset: reset, decorate: decorate, choices: choices };
})();

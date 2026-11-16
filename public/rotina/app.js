(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var emo = window.RotinaEmoji.emo;
  document.querySelectorAll(".emoji-grid").forEach(window.RotinaEmoji.init);
  window.RotinaEmoji.decorate(document.body);
  var KEY = "rotina-tea-v1";
  var ALUNOS = ["Ana — 2º A", "Bruno — 3º B", "Caio — 1º C", "Turma 2º A"];

  var padrao = {
    rotina: null,
    categorias: [
      { id: "higiene", nome: "Higiene", emoji: "🧼" },
      { id: "alimentacao", nome: "Alimentação", emoji: "🍎" },
      { id: "escola", nome: "Escola", emoji: "📚" },
      { id: "sentimentos", nome: "Sentimentos", emoji: "😊" },
      { id: "lazer", nome: "Lazer", emoji: "⚽" }
    ],
    pictos: [
      ["🪥", "Escovar dentes", "higiene"], ["🧼", "Lavar mãos", "higiene"], ["🚽", "Banheiro", "higiene"], ["🚿", "Banho", "higiene"],
      ["🍎", "Lanche", "alimentacao"], ["🥛", "Beber água", "alimentacao"], ["🍽️", "Almoço", "alimentacao"],
      ["📚", "Ler", "escola"], ["✏️", "Escrever", "escola"], ["🎨", "Pintar", "escola"], ["🧮", "Contar", "escola"], ["🎒", "Mochila", "escola"],
      ["😊", "Feliz", "sentimentos"], ["😢", "Triste", "sentimentos"], ["😠", "Bravo", "sentimentos"], ["😌", "Calmo", "sentimentos"],
      ["⚽", "Brincar", "lazer"], ["🎵", "Música", "lazer"], ["🛝", "Parquinho", "lazer"], ["🏠", "Ir para casa", "lazer"]
    ].map(function (p, i) { return { id: "p" + i, emoji: p[0], nome: p[1], cat: p[2] }; }),
    modelo: "pd", qtd: 5, slots: [null, null], registros: []
  };

  var st;
  try { st = JSON.parse(localStorage.getItem(KEY)) || padrao; } catch (e) { st = padrao; }
  var filtro = "todas", selecionado = null;
  var salvar = function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; window.RotinaEmoji.decorate(t); t.classList.add("on");
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function picto(id) { return st.pictos.find(function (p) { return p.id === id; }); }
  function rotuloSlot(i) {
    if (st.modelo === "pd") return i === 0 ? "Primeiro" : "Depois";
    return (i + 1) + "º";
  }

  // ---------- Rotina ----------
  function renderRotina() {
    var r = st.rotina;
    $("#rotina-atual").textContent = r ? "Rotina ativa: " + r.nome + " · " + r.aluno + " · " + r.horario : "Nenhuma rotina salva ainda.";
    if (r) { $("#aluno").value = r.aluno; $("#nome-rotina").value = r.nome; $("#horario").value = r.horario; }
  }
  $("#form-rotina").addEventListener("submit", function (e) {
    e.preventDefault();
    st.rotina = { aluno: $("#aluno").value, nome: $("#nome-rotina").value.trim(), horario: $("#horario").value };
    salvar(); renderRotina(); renderPeiAlunos(); toast("Rotina salva ✔");
  });

  // ---------- Modelo ----------
  function ajustarSlots() {
    var n = st.modelo === "pd" ? 2 : st.qtd;
    var s = st.slots.slice(0, n);
    while (s.length < n) s.push(null);
    st.slots = s;
  }
  document.querySelectorAll('input[name="modelo"]').forEach(function (r) {
    r.checked = r.value === st.modelo;
    r.addEventListener("change", function () { st.modelo = r.value; ajustarSlots(); salvar(); renderPrancha(); });
  });
  var qtd = $("#qtd-slots"); qtd.value = String(st.qtd);
  qtd.addEventListener("change", function () {
    st.qtd = +qtd.value; st.modelo = "lt";
    document.querySelector('input[value="lt"]').checked = true;
    ajustarSlots(); salvar(); renderPrancha();
  });

  // ---------- Prancha ----------
  function renderPrancha(alvo) {
    var box = alvo || $("#prancha");
    box.innerHTML = "";
    box.className = "prancha " + st.modelo;
    st.slots.forEach(function (pid, i) {
      var p = pid && picto(pid);
      var b = el("button", { type: "button", class: "slot" + (p ? " cheio" : ""), "data-i": i,
        "aria-label": rotuloSlot(i) + ": " + (p ? p.nome + ". Toque para escolher ou remover" : "vazio. Toque para escolher") });
      b.innerHTML = '<span class="rot">' + rotuloSlot(i) + "</span>" +
        (p ? '<span class="emo" aria-hidden="true">' + emo(p.emoji) + "</span><span>" + p.nome + "</span>" : "<span>＋ vazio</span>");
      box.appendChild(b);
    });
    if (!alvo) $("#montagem").classList.toggle("alvo", !!selecionado);
  }
  $("#prancha").addEventListener("click", function (e) {
    var b = e.target.closest(".slot"); if (!b) return;
    var i = +b.dataset.i;
    if (selecionado) {
      st.slots[i] = selecionado;
      toast(picto(selecionado).nome + " → " + rotuloSlot(i));
      selecionado = null;
    } else { abrirSlot(i); return; }
    salvar(); renderPrancha(); renderGaleria(); instrucao();
  });
  $("#limpar").addEventListener("click", function () { st.slots = st.slots.map(function () { return null; }); salvar(); renderPrancha(); });

  function instrucao() {
    $("#instrucao").textContent = selecionado
      ? "✔ " + picto(selecionado).nome + " selecionado. Agora toque em um espaço da prancha."
      : "Toque num espaço vazio para escolher o pictograma, ou escolha na galeria e depois toque no espaço";
  }

  // ---------- Galeria ----------
  function renderFiltros() {
    var f = $("#filtros"); f.innerHTML = "";
    [{ id: "todas", nome: "Todas", emoji: "✨" }].concat(st.categorias).forEach(function (c) {
      var b = el("button", { type: "button", class: "filtro", "data-c": c.id, "aria-pressed": String(filtro === c.id) }, emo(c.emoji) + " " + c.nome);
      f.appendChild(b);
    });
  }
  $("#filtros").addEventListener("click", function (e) {
    var b = e.target.closest(".filtro"); if (!b) return;
    filtro = b.dataset.c; renderFiltros(); renderGaleria();
  });
  function renderGaleria() {
    var g = $("#galeria"); g.innerHTML = "";
    var lista = st.pictos.filter(function (p) { return filtro === "todas" || p.cat === filtro; });
    if (!lista.length) { g.innerHTML = '<p class="hint">Nenhum pictograma nesta categoria ainda.</p>'; return; }
    lista.forEach(function (p) {
      var b = el("button", { type: "button", class: "picto", "data-id": p.id, "aria-pressed": String(selecionado === p.id) },
        '<span class="emo" aria-hidden="true">' + emo(p.emoji) + "</span><span>" + p.nome + "</span>");
      g.appendChild(b);
    });
  }
  $("#galeria").addEventListener("click", function (e) {
    var b = e.target.closest(".picto"); if (!b) return;
    selecionado = selecionado === b.dataset.id ? null : b.dataset.id;
    renderGaleria(); renderPrancha(); instrucao();
  });

  // ---------- Modais ----------
  var slotDialog = $("#modal-slot"), slotAtual = null, filtroSlot = "todas", abrirNovoDoSlot = false;
  function renderSlot() {
    var filtros = $("#slot-filtros"), grade = $("#slot-galeria");
    filtros.innerHTML = ""; grade.innerHTML = "";
    [{ id: "todas", nome: "Todas", emoji: "✨" }].concat(st.categorias).forEach(function (c) {
      var b = el("button", { type: "button", class: "filtro", "data-c": c.id, "aria-pressed": String(filtroSlot === c.id) });
      b.innerHTML = emo(c.emoji); b.appendChild(document.createTextNode(" " + c.nome)); filtros.appendChild(b);
    });
    st.pictos.filter(function (p) { return filtroSlot === "todas" || p.cat === filtroSlot; }).forEach(function (p) {
      var b = el("button", { type: "button", class: "picto", "data-id": p.id, "aria-pressed": String(st.slots[slotAtual] === p.id) });
      var imagem = el("span", { class: "emo", "aria-hidden": "true" }, emo(p.emoji));
      var nome = el("span", {}); nome.textContent = p.nome;
      b.appendChild(imagem); b.appendChild(nome); grade.appendChild(b);
    });
    if (!grade.children.length) { var vazio = el("p", { class: "hint" }); vazio.textContent = "Nenhum pictograma nesta categoria ainda."; grade.appendChild(vazio); }
    $("#slot-remover").hidden = !st.slots[slotAtual];
  }
  function abrirSlot(i) {
    slotAtual = i; filtroSlot = "todas";
    slotDialog.setAttribute("aria-label", "Escolher pictograma para o espaço " + (i + 1));
    $("#slot-posicao").textContent = "Espaço " + (i + 1) + " · " + rotuloSlot(i);
    renderSlot(); slotDialog.showModal();
    var primeiro = $("#slot-galeria .picto") || $("#slot-fechar"); primeiro.focus();
  }
  slotDialog.addEventListener("close", function () {
    var i = slotAtual; slotAtual = null;
    if (abrirNovoDoSlot) { abrirNovoDoSlot = false; abrirPicto(); return; }
    var slot = document.querySelector('#prancha .slot[data-i="' + i + '"]'); if (slot) slot.focus();
  });
  var foraSlot = false;
  function foraDoDialog(e) {
    var r = slotDialog.getBoundingClientRect();
    return e.target === slotDialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
  }
  slotDialog.addEventListener("pointerdown", function (e) { foraSlot = foraDoDialog(e); });
  slotDialog.addEventListener("click", function (e) { if (foraSlot && foraDoDialog(e)) slotDialog.close(); foraSlot = false; });
  $("#slot-fechar").addEventListener("click", function () { slotDialog.close(); });
  $("#slot-filtros").addEventListener("click", function (e) {
    var b = e.target.closest(".filtro"); if (!b) return;
    filtroSlot = b.dataset.c; renderSlot();
    var ativo = $("#slot-filtros [aria-pressed=true]"); if (ativo) ativo.focus();
  });
  $("#slot-galeria").addEventListener("click", function (e) {
    var b = e.target.closest(".picto"); if (!b || slotAtual === null) return;
    var p = picto(b.dataset.id); if (!p) return;
    st.slots[slotAtual] = p.id; salvar(); renderPrancha(); renderGaleria(); instrucao();
    toast(p.nome + " → " + rotuloSlot(slotAtual)); slotDialog.close();
  });
  $("#slot-remover").addEventListener("click", function () {
    if (slotAtual === null) return;
    var p = picto(st.slots[slotAtual]); st.slots[slotAtual] = null;
    salvar(); renderPrancha(); toast((p ? p.nome : "Pictograma") + " removido"); slotDialog.close();
  });
  $("#slot-adicionar").addEventListener("click", function () { abrirNovoDoSlot = true; slotDialog.close(); });
  document.querySelectorAll("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { var d = document.getElementById(b.dataset.open); d.showModal(); });
  });
  $("#form-categoria").addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "cancel") { e.target.reset(); window.RotinaEmoji.reset($("#cat-emoji")); return; }
    var nome = $("#cat-nome").value.trim(); if (!nome) return;
    var id = "c" + Date.now();
    var emoji = $("#cat-emoji").dataset.emoji || "⭐";
    st.categorias.push({ id: id, nome: nome, emoji: emoji });
    filtro = id; salvar(); renderFiltros(); renderGaleria();
    e.target.reset(); window.RotinaEmoji.reset($("#cat-emoji")); toast("Categoria “" + nome + "” criada");
  });

  // ---------- Novo pictograma ----------
  var NOVA = "__nova__";
  function resetPictoEmojis() {
    window.RotinaEmoji.reset($("#picto-emoji"));
    window.RotinaEmoji.reset($("#nova-cat-emoji"));
  }
  function toggleNovaCat() {
    var nova = $("#picto-cat").value === NOVA;
    $("#nova-cat").hidden = !nova;
    $("#nova-cat-nome").required = nova;
  }
  function abrirPicto() {
    var s = $("#picto-cat"); s.innerHTML = "";
    st.categorias.forEach(function (c) {
      var o = el("option", { value: c.id }); o.textContent = c.emoji + " " + c.nome; s.appendChild(o);
    });
    var o = el("option", { value: NOVA }); o.textContent = "＋ Criar nova categoria…"; s.appendChild(o);
    if (filtro !== "todas" && st.categorias.some(function (c) { return c.id === filtro; })) s.value = filtro;
    toggleNovaCat();
    $("#modal-picto").showModal();
    $("#picto-nome").focus();
  }
  $("#abrir-picto").addEventListener("click", abrirPicto);
  $("#picto-cat").addEventListener("change", toggleNovaCat);
  $("#form-picto").addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "cancel") { e.target.reset(); resetPictoEmojis(); toggleNovaCat(); return; }
    var nome = $("#picto-nome").value.trim();
    if (!nome) { e.preventDefault(); toast("Informe o nome do pictograma"); $("#picto-nome").focus(); return; }
    var emoji = $("#picto-emoji").dataset.emoji || "⭐";
    var cat = $("#picto-cat").value;
    if (cat === NOVA) {
      var cn = $("#nova-cat-nome").value.trim();
      if (!cn) { e.preventDefault(); toast("Informe o nome da nova categoria"); $("#nova-cat-nome").focus(); return; }
      if (st.categorias.some(function (c) { return c.nome.toLowerCase() === cn.toLowerCase(); })) {
        e.preventDefault(); toast("⚠ Já existe uma categoria “" + cn + "”"); $("#nova-cat-nome").focus(); return;
      }
      cat = "c" + Date.now();
      st.categorias.push({ id: cat, nome: cn, emoji: $("#nova-cat-emoji").dataset.emoji || "⭐" });
    }
    st.pictos.push({ id: "p" + Date.now() + Math.random().toString(36).slice(2, 6), emoji: emoji, nome: nome, cat: cat });
    filtro = cat; salvar(); renderFiltros(); renderGaleria();
    toast("Pictograma “" + nome + "” adicionado");
    e.target.reset(); resetPictoEmojis(); toggleNovaCat();
  });

  function renderPeiAlunos() {
    var c = $("#pei-alunos"); c.innerHTML = "";
    var atual = st.rotina && st.rotina.aluno;
    ALUNOS.forEach(function (a, i) {
      var l = el("label", { class: "chip-radio" });
      l.innerHTML = '<input type="radio" name="pei-aluno" required value="' + a + '"' + ((atual ? a === atual : i === 0) ? " checked" : "") + "><span>" + a + "</span>";
      c.appendChild(l);
    });
  }
  var armedI = null, armedH = null;
  function renderRegistros() {
    var ul = $("#pei-lista"); ul.innerHTML = "";
    armedI = null; clearTimeout(armedH);
    var inicio = Math.max(0, st.registros.length - 5);
    for (var i = st.registros.length - 1; i >= inicio; i--) {
      var r = st.registros[i];
      var quando = new Date(r.data).toLocaleString("pt-BR");
      ul.appendChild(el("li", { "data-i": i },
        '<div class="pei-txt"><strong>' + r.nivel + "</strong> · " + r.aluno +
        "<br><small>" + quando + "</small>" + (r.obs ? "<br>" + r.obs.replace(/</g, "&lt;") : "") + "</div>" +
        '<button class="btn btn-del" type="button" data-del="' + i + '" aria-label="Excluir registro de ' + r.aluno + ', ' + quando + '">🗑️ Excluir</button>'));
    }
    window.RotinaEmoji.decorate(ul);
    if (!st.registros.length) ul.innerHTML = '<li class="hint">Sem registros.</li>';
  }
  $("#pei-lista").addEventListener("click", function (e) {
    var b = e.target.closest("[data-del]"); if (!b) return;
    var i = +b.dataset.del;
    if (armedI !== i) {
      armedI = i;
      b.textContent = "Confirmar exclusão?";
      b.classList.add("confirmar");
      clearTimeout(armedH);
      armedH = setTimeout(function () { renderRegistros(); }, 5000);
      return;
    }
    var r = st.registros.splice(i, 1)[0];
    armedI = null; clearTimeout(armedH);
    salvar(); renderRegistros();
    toast("Registro de " + r.aluno + " excluído");
  });
  $("#form-pei").addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault(); // mantém o painel aberto
    var f = e.target;
    st.registros.push({ aluno: f["pei-aluno"].value, nivel: f.nivel.value, obs: $("#pei-obs").value.trim(), data: Date.now() });
    salvar();
    // Simula envio em segundo plano
    setTimeout(function () { toast("Registro sincronizado ✔"); }, 600);
    $("#pei-obs").value = "";
    f.querySelectorAll('input[name="nivel"]').forEach(function (r) { r.checked = false; });
    renderRegistros();
  });

  // ---------- Redimensionar painel ----------
  (function () {
    var painel = $("#painel-pei"), h = painel.querySelector(".resize-handle");
    var w = +localStorage.getItem(KEY + "-w"); if (w) painel.style.width = w + "px";
    function set(px) { px = Math.max(300, Math.min(window.innerWidth, px)); painel.style.width = px + "px"; localStorage.setItem(KEY + "-w", px); }
    h.addEventListener("pointerdown", function (e) {
      e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add("on");
      function mv(ev) { set(window.innerWidth - ev.clientX); }
      function up() { h.classList.remove("on"); h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); }
      h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up);
    });
    h.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") set(painel.offsetWidth + 20);
      if (e.key === "ArrowRight") set(painel.offsetWidth - 20);
    });
  })();

  // ---------- Relatório ----------
  $("#gerar-pdf").addEventListener("click", function () {
    var tipo = document.querySelector('input[name="rel"]:checked').value;
    var area = $("#print-area"); area.innerHTML = "";
    var r = st.rotina;
    if (tipo !== "mes") {
      area.appendChild(el("h1", {}, r ? r.nome + " — " + r.aluno + " (" + r.horario + ")" : "Prancha de rotina"));
      var p = el("div"); area.appendChild(p); renderPrancha(p);
    }
    if (tipo !== "prancha") {
      var agora = new Date();
      var regs = st.registros.filter(function (x) {
        var d = new Date(x.data);
        return tipo !== "mes" || (d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear());
      });
      area.appendChild(el("h2", {}, "Registros de comportamento (PEI)" + (tipo === "mes" ? " — " + agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "")));
      var rows = regs.map(function (x) {
        return "<tr><td>" + new Date(x.data).toLocaleString("pt-BR") + "</td><td>" + x.aluno + "</td><td>" + x.nivel + "</td><td>" + (x.obs || "").replace(/</g, "&lt;") + "</td></tr>";
      }).join("") || '<tr><td colspan="4">Sem registros.</td></tr>';
      area.appendChild(el("table", {}, "<thead><tr><th>Data</th><th>Aluno</th><th>Nível</th><th>Observações</th></tr></thead><tbody>" + rows + "</tbody>"));
    }
    // Lazy images must load before opening the print dialog.
    var images = Array.from(area.querySelectorAll("img.emo-img"));
    Promise.all(images.map(function (image) {
      image.loading = "eager";
      if (image.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    })).then(function () { window.print(); });
  });

  if (window.RotinaOffline) window.RotinaOffline.register();
  ajustarSlots(); renderRotina(); renderFiltros(); renderGaleria(); renderPrancha(); renderPeiAlunos(); renderRegistros(); instrucao();
})();

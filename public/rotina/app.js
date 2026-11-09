(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
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
    var t = $("#toast"); t.textContent = msg; t.classList.add("on");
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
        "aria-label": rotuloSlot(i) + ": " + (p ? p.nome + ". Toque para remover" : "vazio") });
      b.innerHTML = '<span class="rot">' + rotuloSlot(i) + "</span>" +
        (p ? '<span class="emo" aria-hidden="true">' + p.emoji + "</span><span>" + p.nome + "</span>" : "<span>＋ vazio</span>");
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
    } else if (st.slots[i]) {
      toast(picto(st.slots[i]).nome + " removido");
      st.slots[i] = null;
    } else { toast("Escolha um pictograma primeiro"); return; }
    salvar(); renderPrancha(); renderGaleria(); instrucao();
  });
  $("#limpar").addEventListener("click", function () { st.slots = st.slots.map(function () { return null; }); salvar(); renderPrancha(); });

  function instrucao() {
    $("#instrucao").textContent = selecionado
      ? "✔ " + picto(selecionado).nome + " selecionado. Agora toque em um espaço da prancha."
      : "Toque em um pictograma da galeria.";
  }

  // ---------- Galeria ----------
  function renderFiltros() {
    var f = $("#filtros"); f.innerHTML = "";
    [{ id: "todas", nome: "Todas", emoji: "✨" }].concat(st.categorias).forEach(function (c) {
      var b = el("button", { type: "button", class: "filtro", "data-c": c.id, "aria-pressed": String(filtro === c.id) }, c.emoji + " " + c.nome);
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
        '<span class="emo" aria-hidden="true">' + p.emoji + "</span><span>" + p.nome + "</span>");
      g.appendChild(b);
    });
  }
  $("#galeria").addEventListener("click", function (e) {
    var b = e.target.closest(".picto"); if (!b) return;
    selecionado = selecionado === b.dataset.id ? null : b.dataset.id;
    renderGaleria(); renderPrancha(); instrucao();
  });

  // ---------- Modais ----------
  document.querySelectorAll("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { var d = document.getElementById(b.dataset.open); d.showModal(); });
  });
  $("#form-categoria").addEventListener("submit", function (e) {
    if (e.submitter && e.submitter.value === "cancel") return;
    var nome = $("#cat-nome").value.trim(); if (!nome) return;
    var id = "c" + Date.now();
    var emoji = $("#cat-emoji").value.trim() || "⭐";
    st.categorias.push({ id: id, nome: nome, emoji: emoji });
    st.pictos.push({ id: "p" + Date.now(), emoji: emoji, nome: nome, cat: id });
    filtro = id; salvar(); renderFiltros(); renderGaleria();
    e.target.reset(); toast("Categoria “" + nome + "” criada");
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
    window.print();
  });

  ajustarSlots(); renderRotina(); renderFiltros(); renderGaleria(); renderPrancha(); renderPeiAlunos(); renderRegistros();
})();

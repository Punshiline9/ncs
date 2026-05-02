// ==================== VARIÁVEIS GLOBAIS ====================
let produtos = [];
let categorias = [];
let carrinho = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
  configurarCarrinho();
  configurarEventosGlobais();
  iniciarDropdowns();
});

function carregarDados() {
  Promise.all([
    fetch("produtos.json")
      .then((r) => r.json())
      .catch(() => []),
    fetch("categorias.json")
      .then((r) => r.json())
      .catch(() => []),
  ]).then(([produtosData, categoriasData]) => {
    produtos = produtosData;
    categorias = categoriasData;
    executarAcaoPorPagina();
  });
}

function executarAcaoPorPagina() {
  const path = window.location.pathname;
  if (path.includes("ofertas.html")) renderizarProdutosOfertas();
  else if (path.includes("novidades.html")) renderizarProdutosNovidades();
  else if (path.includes("categorias.html")) renderizarCategorias();
  else if (path.includes("produto.html")) renderizarProdutoDetalhe();
  else if (path.includes("contato.html")) configurarFormContato();
  else if (path.includes("search.html")) executarBusca();
  else renderizarDestaques();
  atualizarContadorCarrinho();
  atualizarMiniCarrinho();
}

// ==================== FUNÇÃO AUXILIAR PARA FALLBACK DE IMAGENS ====================
function getImageWithFallback(originalPath) {
  // Se já começa com "imagen/", extrai só o nome do arquivo
  const filename = originalPath.includes("imagen/") 
    ? originalPath.replace("imagen/", "") 
    : originalPath.split('/').pop();
  // Retorna uma string com o caminho original e o fallback via onerror
  return originalPath;
}

// No HTML, usaremos onerror para tentar primeiro a raiz, depois placeholder
function getImageTag(imgPath, altText) {
  // Extrai o nome do arquivo (ex: "fogo.jpg")
  const filename = imgPath.includes("imagen/") ? imgPath.replace("imagen/", "") : imgPath.split('/').pop();
  // Tenta carregar da pasta imagen, se falhar tenta raiz, se falhar placeholder
  return `<img src="${imgPath}" alt="${altText}" onerror="this.onerror=null; this.src='${filename}'; this.onerror=function(){this.src='https://via.placeholder.com/300?text=Sem+Imagem';}">`;
}

// ==================== RENDERIZAÇÃO DE PRODUTOS ====================
function renderizarDestaques() {
  const destaques = produtos.filter((p) => p.destaque === true);
  const container = document.getElementById("listaProdutos");
  if (container) renderizarGridProdutos(destaques, container);
}

function renderizarProdutosOfertas() {
  const ofertas = produtos.filter((p) => p.oferta === true);
  const container = document.getElementById("listaProdutosOfertas");
  if (container) renderizarGridProdutos(ofertas, container);
}

function renderizarProdutosNovidades() {
  const novidades = [...produtos].sort((a, b) => b.id - a.id).slice(0, 12);
  const container = document.getElementById("listaProdutosNovidades");
  if (container) renderizarGridProdutos(novidades, container);
}

function renderizarCategorias() {
  const container = document.getElementById("gridCategorias");
  if (!container) return;
  container.innerHTML = categorias
    .map(
      (cat) => `
    <a href="categoria.html?slug=${cat.slug}" class="categoria-card">
      <img src="${cat.imagem}" alt="${cat.nome}" onerror="this.onerror=null; this.src='${cat.imagem.split('/').pop()}'; this.onerror=function(){this.src='https://via.placeholder.com/80?text=Sem+Imagem';}">
      <h3>${cat.nome}</h3>
      <p>${cat.icone || "✨"}</p>
    </a>
  `,
    )
    .join("");
}

function renderizarGridProdutos(produtosArray, container) {
  if (!produtosArray.length) {
    container.innerHTML =
      '<p style="text-align:center;">Nenhum produto encontrado.</p>';
    return;
  }
  container.innerHTML = produtosArray
    .map(
      (prod) => {
        const filename = prod.imagem.includes("imagen/") ? prod.imagem.replace("imagen/", "") : prod.imagem.split('/').pop();
        return `
    <div class="produto">
      <img src="${prod.imagem}" alt="${prod.nome}" onerror="this.onerror=null; this.src='${filename}'; this.onerror=function(){this.src='https://via.placeholder.com/300?text=Sem+Imagem';}">
      <h3>${prod.nome}</h3>
      <div class="preco">${prod.preco.toFixed(2)} STD</div>
      <div class="estrelas">${"★".repeat(prod.avaliacao)}${"☆".repeat(5 - prod.avaliacao)}</div>
      <button class="btn-adicionar" data-id="${prod.id}">+ ADICIONAR AO CARRINHO</button>
      <a href="produto.html?id=${prod.id}" style="font-size:0.75rem;">Ver detalhes →</a>
    </div>
  `;
      }
    )
    .join("");
  document.querySelectorAll(".btn-adicionar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      adicionarAoCarrinho(parseInt(btn.dataset.id));
    });
  });
}

// ==================== PÁGINA PRODUTO DETALHE ====================
function renderizarProdutoDetalhe() {
  const id = parseInt(new URLSearchParams(window.location.search).get("id"));
  const produto = produtos.find((p) => p.id === id);
  if (!produto) {
    document.getElementById("produtoDetalhe").innerHTML =
      "<p>Produto não encontrado.</p>";
    return;
  }
  const filename = produto.imagem.includes("imagen/") ? produto.imagem.replace("imagen/", "") : produto.imagem.split('/').pop();
  const html = `
    <div class="produto-detalhes">
      <div class="produto-imagem-principal">
        <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.onerror=null; this.src='${filename}'; this.onerror=function(){this.src='https://via.placeholder.com/400?text=Sem+Imagem';}">
      </div>
      <div class="produto-info">
        <h1>${produto.nome}</h1>
        <div class="produto-preco">${produto.preco.toFixed(2)} STD</div>
        <div class="produto-avaliacao">${"★".repeat(produto.avaliacao)} (${produto.avaliacao} estrelas)</div>
        <p>${produto.descricao || "Produto de alta qualidade."}</p>
        <div class="btn-quantidade"><button id="menosQt">-</button><span id="quantidade">1</span><button id="maisQt">+</button></div>
        <button id="comprarAgora" class="btn-adicionar">COMPRAR AGORA</button>
      </div>
    </div>
  `;
  document.getElementById("produtoDetalhe").innerHTML = html;
  let qtd = 1;
  const menos = document.getElementById("menosQt");
  const mais = document.getElementById("maisQt");
  const qtdSpan = document.getElementById("quantidade");
  if (menos)
    menos.addEventListener("click", () => {
      if (qtd > 1) qtd--;
      qtdSpan.innerText = qtd;
    });
  if (mais)
    mais.addEventListener("click", () => {
      qtd++;
      qtdSpan.innerText = qtd;
    });
  const comprarAgora = document.getElementById("comprarAgora");
  if (comprarAgora)
    comprarAgora.addEventListener("click", () => {
      for (let i = 0; i < qtd; i++) adicionarAoCarrinho(produto.id);
      mostrarToast(`${qtd}x ${produto.nome} adicionado(s)!`);
    });
}

// ==================== CONTATO ====================
function configurarFormContato() {
  const form = document.getElementById("formContato");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const msg = document.getElementById("mensagem").value;
    const texto = `Nome: ${nome}\nE-mail: ${email}\nMensagem: ${msg}`;
    window.open(
      `https://wa.me/5511999999999?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
    form.reset();
    mostrarToast("Mensagem enviada! Responderemos em breve.");
  });
}

// ==================== BUSCA ====================
function executarBusca() {
  const termo = new URLSearchParams(window.location.search).get("q") || "";
  const resultados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(termo.toLowerCase()),
  );
  const container = document.getElementById("resultadosBusca");
  if (container) {
    if (resultados.length === 0)
      container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    else renderizarGridProdutos(resultados, container);
  }
}

// ==================== CARRINHO ====================
function carregarCarrinho() {
  const saved = localStorage.getItem("carrinhoNSC");
  carrinho = saved ? JSON.parse(saved) : [];
  atualizarContadorCarrinho();
  atualizarMiniCarrinho();
}

function salvarCarrinho() {
  localStorage.setItem("carrinhoNSC", JSON.stringify(carrinho));
  atualizarContadorCarrinho();
  atualizarMiniCarrinho();
}

function atualizarContadorCarrinho() {
  const total = carrinho.reduce((acc, item) => acc + item.qtd, 0);
  document
    .querySelectorAll("#contadorCarrinho")
    .forEach((el) => (el.innerText = total));
}

function adicionarAoCarrinho(id, qtd = 1) {
  const prod = produtos.find((p) => p.id == id);
  if (!prod) return;
  const existente = carrinho.find((item) => item.id == id);
  if (existente) existente.qtd += qtd;
  else
    carrinho.push({
      id: prod.id,
      nome: prod.nome,
      preco: prod.preco,
      imagem: prod.imagem,
      qtd,
    });
  salvarCarrinho();
  mostrarToast(`${prod.nome} adicionado!`);
  renderizarCarrinhoModal();
}

function removerItemCarrinho(id) {
  carrinho = carrinho.filter((item) => item.id != id);
  salvarCarrinho();
  renderizarCarrinhoModal();
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find((i) => i.id == id);
  if (item) {
    item.qtd += delta;
    if (item.qtd <= 0) removerItemCarrinho(id);
    else salvarCarrinho();
    renderizarCarrinhoModal();
  }
}

function renderizarCarrinhoModal() {
  const container = document.getElementById("itensCarrinho");
  const totalSpan = document.getElementById("totalCarrinho");
  if (!container) return;
  if (carrinho.length === 0) {
    container.innerHTML = '<p style="text-align:center">Carrinho vazio</p>';
    totalSpan.innerText = "0";
    return;
  }
  let html = "",
    total = 0;
  carrinho.forEach((item) => {
    total += item.preco * item.qtd;
    const filename = item.imagem.includes("imagen/") ? item.imagem.replace("imagen/", "") : item.imagem.split('/').pop();
    html += `
      <div class="item-carrinho">
        <img src="${item.imagem}" onerror="this.onerror=null; this.src='${filename}'; this.onerror=function(){this.src='https://via.placeholder.com/50';}">
        <div class="item-nome">${item.nome}</div>
        <div class="item-preco">${item.preco.toFixed(2)} STD</div>
        <div class="qtd-control">
          <button class="qtd-menos" data-id="${item.id}">-</button>
          <span>${item.qtd}</span>
          <button class="qtd-mais" data-id="${item.id}">+</button>
        </div>
        <button class="remover-item" data-id="${item.id}">❌</button>
      </div>
    `;
  });
  container.innerHTML = html;
  totalSpan.innerText = total.toFixed(2);
  document
    .querySelectorAll(".qtd-menos")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        alterarQuantidade(parseInt(btn.dataset.id), -1),
      ),
    );
  document
    .querySelectorAll(".qtd-mais")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        alterarQuantidade(parseInt(btn.dataset.id), 1),
      ),
    );
  document
    .querySelectorAll(".remover-item")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        removerItemCarrinho(parseInt(btn.dataset.id)),
      ),
    );
}

function finalizarCompra() {
  if (carrinho.length === 0) return mostrarToast("Carrinho vazio");
  let msg = "Olá! Gostaria de finalizar meu pedido:\n";
  let total = 0;
  carrinho.forEach((item) => {
    msg += `\n- ${item.nome} x${item.qtd} = ${(item.preco * item.qtd).toFixed(2)} STD`;
    total += item.preco * item.qtd;
  });
  msg += `\n\nTOTAL: ${total.toFixed(2)} STD`;
  window.open(
    `https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

function configurarCarrinho() {
  carregarCarrinho();
  const overlay = document.getElementById("carrinhoOverlay");
  const abrirBtn = document.getElementById("abrirCarrinhoBtn");
  const fecharBtn = document.getElementById("fecharCarrinhoBtn");
  const finalizarBtn = document.getElementById("finalizarCompraBtn");
  if (abrirBtn)
    abrirBtn.addEventListener("click", (e) => {
      e.preventDefault();
      renderizarCarrinhoModal();
      overlay.style.display = "flex";
    });
  if (fecharBtn)
    fecharBtn.addEventListener("click", () => (overlay.style.display = "none"));
  if (finalizarBtn) finalizarBtn.addEventListener("click", finalizarCompra);
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
}

// ==================== DROPDOWNS E MINI CARRINHO ====================
function iniciarDropdowns() {
  const items = document.querySelectorAll(".menu-item-dropdown");
  items.forEach((item) => {
    const trigger = item.querySelector("a.dropdown-trigger, a:first-child");
    if (trigger)
      trigger.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const content = item.querySelector(".dropdown-content");
          if (content) content.classList.toggle("active");
        }
      });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-item-dropdown"))
      document
        .querySelectorAll(".dropdown-content")
        .forEach((d) => d.classList.remove("active"));
  });
}

function atualizarMiniCarrinho() {
  const container = document.getElementById("miniCarrinhoItens");
  const totalSpan = document.getElementById("miniCarrinhoTotal");
  if (!container) return;
  const carrinhoAtual = JSON.parse(localStorage.getItem("carrinhoNSC") || "[]");
  if (carrinhoAtual.length === 0) {
    container.innerHTML = '<div class="mini-vazio">Carrinho vazio</div>';
    if (totalSpan) totalSpan.innerText = "0";
    return;
  }
  let html = "",
    total = 0;
  carrinhoAtual.forEach((item) => {
    total += item.preco * item.qtd;
    const filename = item.imagem.includes("imagen/") ? item.imagem.replace("imagen/", "") : item.imagem.split('/').pop();
    html += `<div class="mini-item">
      <img src="${item.imagem}" onerror="this.onerror=null; this.src='${filename}'; this.onerror=function(){this.src='https://via.placeholder.com/40';}">
      <div><strong>${item.nome}</strong><br>${item.preco.toFixed(2)} STD x ${item.qtd}</div>
    </div>`;
  });
  container.innerHTML = html;
  if (totalSpan) totalSpan.innerText = total.toFixed(2);
}

function finalizarCompraMini() {
  const carrinhoAtual = JSON.parse(localStorage.getItem("carrinhoNSC") || "[]");
  if (carrinhoAtual.length === 0) return mostrarToast("Carrinho vazio");
  let msg =
    "Olá! Pedido:\n" +
    carrinhoAtual
      .map((i) => `- ${i.nome} x${i.qtd} = ${(i.preco * i.qtd).toFixed(2)} STD`)
      .join("\n");
  const total = carrinhoAtual.reduce((s, i) => s + i.preco * i.qtd, 0);
  msg += `\nTotal: ${total.toFixed(2)} STD`;
  window.open(
    `https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

function configurarEventosGlobais() {
  const miniFinalizar = document.getElementById("miniFinalizarLink");
  if (miniFinalizar)
    miniFinalizar.addEventListener("click", (e) => {
      e.preventDefault();
      finalizarCompraMini();
    });
}

function mostrarToast(msg) {
  let toast = document.querySelector(".toast-notify");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notify";
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

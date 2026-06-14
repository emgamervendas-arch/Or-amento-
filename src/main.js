import * as XLSX from 'xlsx'
import './style.css'

const app = document.querySelector('#app')

// Histórico para controlar a navegação dos botões de voltar
const historicoTelas = []

// Estrutura de carrinho fluida para suportar Peças, Kits e PCs Completos
let carrinho = []

const dadosCliente = {
  nome: '',
  telefone: '',
  cidade: '',
  tipoFluxo: '' // 'pc-gamer', 'pc-trabalho', 'kit-upgrade', 'pecas-avulsas'
}

// Peças padrão de backup (todas iniciam com ativo: true)
const pecasPadrao = [
  { id: 1, categoria: 'cpu', nome: 'Ryzen 5 5600', preco: 750, custo: 650, quantidade: 10, socket: 'AM4', ativo: true },
  { id: 2, categoria: 'cpu', nome: 'Ryzen 7 7800X3D', preco: 2800, custo: 2500, quantidade: 5, socket: 'AM5', ativo: true },
  { id: 4, categoria: 'placamae', nome: 'B550M AM4', preco: 750, custo: 650, quantidade: 10, socket: 'AM4', ativo: true },
  { id: 7, categoria: 'gpu', nome: 'RTX 4060', preco: 1900, custo: 1750, quantidade: 6, ativo: true },
  { id: 10, categoria: 'ram', nome: '16GB DDR4', preco: 300, custo: 220, quantidade: 20, ativo: true },
  { id: 12, categoria: 'ssd', nome: '1TB NVMe', preco: 450, custo: 350, quantidade: 10, ativo: true },
  { id: 13, categoria: 'fonte', nome: 'Fonte 650W Corsair', preco: 390, custo: 310, quantidade: 8, ativo: true },
  { id: 14, categoria: 'gabinete', nome: 'RGB Gamer Mancer', preco: 350, custo: 250, quantidade: 9, ativo: true },
  { id: 20, categoria: 'kit-upgrade', nome: 'Kit Upgrade Ryzen 5 5600 + B550M + 16GB RAM', preco: 1650, custo: 1400, quantidade: 4, ativo: true },
  { id: 30, categoria: 'acessorios', nome: 'Mouse Gamer Logitech G203', preco: 150, custo: 90, quantidade: 15, ativo: true }
]

if (!localStorage.getItem('produtos')) {
  localStorage.setItem('produtos', JSON.stringify(pecasPadrao))
}

function obterProdutos() {
  return JSON.parse(localStorage.getItem('produtos')) || []
}

function buscarProdutos(categoriaAlvo) {
  const produtos = obterProdutos()
  return produtos.filter(p => 
    p.categoria && 
    p.categoria.toLowerCase() === categoriaAlvo.toLowerCase() && 
    p.ativo !== false && 
    p.ativo !== "false"
  )
}

// Funções utilitárias de limpeza e categorização inteligente
function limparNumero(valor) {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return valor;
  let str = String(valor).trim();
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function identificarCategoria(nomeProduto) {
  const nome = String(nomeProduto).toLowerCase();

  // PLACA MÃE PRIMEIRO
  if (
    nome.includes('placa mãe') ||
    nome.includes('placa mae') ||
    nome.includes('motherboard') ||
    nome.includes('b450') ||
    nome.includes('b550') ||
    nome.includes('b650') ||
    nome.includes('b760') ||
    nome.includes('a520') ||
    nome.includes('a620') ||
    nome.includes('h510') ||
    nome.includes('h610') ||
    nome.includes('z690') ||
    nome.includes('z790')
  ) return 'placamae';

  if (
    nome.includes('processador') ||
    nome.includes('ryzen') ||
    nome.includes('intel') ||
    nome.includes('core i')
  ) return 'cpu';

  if (
    nome.includes('rtx') ||
    nome.includes('gtx') ||
    nome.includes('radeon') ||
    nome.includes('rx ')
  ) return 'gpu';

  if (
    nome.includes('memória') ||
    nome.includes('memoria') ||
    nome.includes('ram')
  ) return 'ram';

  if (
    nome.includes('ssd') ||
    nome.includes('nvme')
  ) return 'ssd';

  if (nome.includes('fonte')) return 'fonte';

  if (nome.includes('gabinete')) return 'gabinete';

  return 'acessorios';
}

function extrairSocket(nomeProduto) {
  const nome = String(nomeProduto).toUpperCase();
  if (nome.includes('AM4')) return 'AM4';
  if (nome.includes('AM5')) return 'AM5';
  if (nome.includes('LGA1700') || nome.includes('1700')) return 'LGA1700';
  if (nome.includes('LGA1200') || nome.includes('1200')) return 'LGA1200';
  return '';
}

window.telaAnterior = telaAnterior
window.telaInicial = telaInicial

// --- CONTROLE DE NAVEGAÇÃO ---
function irParaTela(funcaoTela) {
  historicoTelas.push(funcaoTela)
  funcaoTela()
}

function telaAnterior() {
  if (historicoTelas.length > 1) {
    historicoTelas.pop()
    const anterior = historicoTelas[historicoTelas.length - 1]
    anterior()
  } else {
    telaInicial()
  }
}

// Ouvinte de teclado para o Admin (Configurado para F8)
function detectarAtalhoAdmin(e) {
  if (e.key === 'F8' && historicoTelas.length <= 1) {
    e.preventDefault();
    window.removeEventListener('keydown', detectarAtalhoAdmin);
    abrirAdmin();
  }
}

// --- TELA INICIAL ---
function telaInicial() {
  historicoTelas.length = 0
  historicoTelas.push(telaInicial)
  carrinho = []
  
  dadosCliente.nome = ''
  dadosCliente.telefone = ''
  dadosCliente.cidade = ''
  dadosCliente.tipoFluxo = ''

  app.innerHTML = `
  <div class="hero">
    <img src="/logo.png" class="logo" alt="Leal Tech">
    <h1>MONTE SEU COMPUTADOR<span>COM OS MELHORES PREÇOS</span></h1>
    <button id="btn-orcamento" class="btn-start">🚀 INICIAR ORÇAMENTO</button>
  </div>
  `
  document.getElementById('btn-orcamento').addEventListener('click', () => {
    window.removeEventListener('keydown', detectarAtalhoAdmin);
    irParaTela(telaRoteadorCategorias);
  });

  window.removeEventListener('keydown', detectarAtalhoAdmin);
  window.addEventListener('keydown', detectarAtalhoAdmin);
}

// --- ROTEADOR PRINCIPAL ---
function telaRoteadorCategorias() {
  app.innerHTML = `
  <div class="container-step" style="max-width: 900px;">
    <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
    <h1>O que você procura hoje?</h1>
    <p class="subtitulo-uso">Escolha uma das categorias fortes da nossa casa</p>
    
    <div class="categorias" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; gap: 16px; width: 100%;">
      <div class="card opcao-fluxo" data-fluxo="pc-gamer">
        <h3>🎮 PC Gamer</h3>
        <p>Computadores de alto desempenho para jogos e streaming</p>
      </div>
      <div class="card opcao-fluxo" data-fluxo="pc-trabalho">
        <h3>💼 PC Trabalho</h3>
        <p>Configurações focadas em office, engenharia, design e estudo</p>
      </div>
      <div class="card opcao-fluxo" data-fluxo="kit-upgrade">
        <h3>📦 Kit Upgrade</h3>
        <p>Combos prontos de Processador + Placa-Mãe + RAM</p>
      </div>
      <div class="card opcao-fluxo" data-fluxo="pecas-avulsas">
        <h3>🔌 Peças e Acessórios</h3>
        <p>Hardwares avulsos, mouses, teclados e periféricos</p>
      </div>
    </div>
  </div>
  `

  document.querySelectorAll('.opcao-fluxo').forEach(card => {
    card.addEventListener('click', () => {
      dadosCliente.tipoFluxo = card.dataset.fluxo

      if (dadosCliente.tipoFluxo === 'pc-gamer' || dadosCliente.tipoFluxo === 'pc-trabalho') {
        irParaTela(() => telaFluxoPC('cpu'))
      } else if (dadosCliente.tipoFluxo === 'kit-upgrade') {
        irParaTela(telaFluxoKitUpgrade)
      } else if (dadosCliente.tipoFluxo === 'pecas-avulsas') {
        irParaTela(telaFluxoPecasAvulsas)
      }
    })
  })
}

// --- ESTEIRA SEQUENCIAL COMPLETA ---
const sequenciaPecas = ['cpu', 'placamae', 'gpu', 'ram', 'ssd', 'fonte', 'gabinete']
const nomesCategorias = {
  cpu: 'Processador',
  placamae: 'Placa-Mãe',
  gpu: 'Placa de Vídeo',
  ram: 'Memória RAM',
  ssd: 'Armazenamento',
  fonte: 'Fonte de Alimentação',
  gabinete: 'Gabinete'
}

function telaFluxoPC(categoriaAtual) {
  let produtosBase = buscarProdutos(categoriaAtual);
  
  produtosBase = produtosBase.filter(p => {
    const nome = p.nome.toUpperCase();
    switch(categoriaAtual) {
      case 'cpu': return (nome.includes('PROCESSADOR') || nome.includes('RYZEN') || nome.includes('CORE I')) && !nome.includes('PLACA MÃE') && !nome.includes('COOLER');
      case 'placamae': return (nome.includes('PLACA MÃE') || nome.includes('PLACA-MÃE') || nome.includes('MOTHERBOARD'));
      case 'ram': return (nome.includes('MEMÓRIA') || nome.includes('MEMORIA DDR') || nome.includes('RAM')) && !nome.includes('SSD');
      case 'ssd': return (nome.includes('SSD') || nome.includes('NVME') || nome.includes('M.2'));
      case 'gpu': return (nome.includes('PLACA DE VÍDEO') || nome.includes('PLACA DE VIDEO') || nome.includes('RTX') || nome.includes('RX ') || nome.includes('GTX'));
      case 'fonte': return (nome.includes('FONTE') || nome.includes('WATS') || nome.includes('500W') || nome.includes('650W') || nome.includes('750W'));
      case 'gabinete': return (nome.includes('GABINETE'));
      default: return true;
    }
  });

  if (categoriaAtual === 'placamae') {
    const cpuSelecionada = carrinho.find(item => item.categoria === 'cpu');
    if (cpuSelecionada && cpuSelecionada.socket) {
      produtosBase = produtosBase.filter(p => !p.socket || p.socket.toUpperCase().trim() === cpuSelecionada.socket.toUpperCase().trim());
    }
  }

  const avancarParaProximaEtapa = () => {
    const indexAtual = sequenciaPecas.indexOf(categoriaAtual);
    if (indexAtual < sequenciaPecas.length - 1) {
      irParaTela(() => telaFluxoPC(sequenciaPecas[indexAtual + 1]));
    } else {
      irParaTela(telaDadosCliente);
    }
  };

  const renderizarLista = (termoBusca = "") => {
    const gridContainer = document.getElementById('grid-produtos');
    if (!gridContainer) return;

    let produtosFiltrados = produtosBase.filter(p => p.nome.toLowerCase().includes(termoBusca.toLowerCase()));
    produtosFiltrados = produtosFiltrados.slice(0, 9);

    if (produtosFiltrados.length === 0) {
      gridContainer.innerHTML = `<div class="card" style="grid-column: 1 / -1; height: 120px; color: #aaa;">Nenhum item correspondente nesta categoria</div>`;
      return;
    }

    gridContainer.innerHTML = produtosFiltrados.map(p => {
      const jaNoCarrinho = carrinho.some(item => item.id === p.id);
      return `
        <div class="card item-hardware" data-id="${p.id}" style="border: 2px solid ${jaNoCarrinho ? '#00ff88' : '#222'}; padding: 20px; cursor: pointer; background: #141414;">
          <div style="text-align: left; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 11px; background: #222; color: #ff7a00; font-weight: bold; text-transform: uppercase;">${nomesCategorias[categoriaAtual]}</span>
              ${p.socket ? `<span style="font-size: 11px; color: #00ff88; background: rgba(0,255,136,0.1); padding: 2px 6px; border-radius:4px;">${p.socket}</span>` : ''}
            </div>
            <h3 style="font-size: 15px; margin: 0; color: #fff;">${p.nome}</h3>
          </div>
        </div>
      `;
    }).join('');

    gridContainer.querySelectorAll('.item-hardware').forEach(card => {
      card.addEventListener('click', () => {
        const idProcurado = Number(card.getAttribute('data-id'));
        const produto = produtosBase.find(p => Number(p.id) === idProcurado);
        if (produto) {
          carrinho = carrinho.filter(i => i.categoria !== categoriaAtual && i.categoria !== 'kit-upgrade');
          carrinho.push(produto);
          avancarParaProximaEtapa();
        }
      });
    });
  };

  app.innerHTML = `
    <div class="container-step" style="max-width: 1000px; padding: 20px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1>Escolha o seu ${nomesCategorias[categoriaAtual]}</h1>
      <input type="text" id="busca-peca" placeholder="🔍 Toque para buscar..." style="width: 100%; padding: 14px; background: #141414; border: 1px solid #333; color: #fff; border-radius: 8px; box-sizing: border-box; margin-bottom: 20px;" />
      <div id="grid-produtos" style="display: grid !important; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; gap: 18px; width: 100%;"></div>
    </div>
  `;

  document.getElementById('busca-peca').addEventListener('input', (e) => renderizarLista(e.target.value));
  renderizarLista();
}

// --- FLUXO KIT UPGRADE ---
function telaFluxoKitUpgrade() {
  const kits = buscarProdutos('kit-upgrade')
  app.innerHTML = `
    <div class="container-step" style="max-width: 750px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1>Combos & Kits Upgrade</h1>
      <div class="categorias" style="grid-template-columns: 1fr !important; gap: 15px; width:100%;">
        ${kits.length === 0 ? '<p style="opacity:0.5;">Nenhum kit cadastrado ou disponível no momento.</p>' : kits.map(k => `
          <div class="card item-kit" data-id="${k.id}" style="height: 120px; padding: 20px; flex-direction: row; justify-content: space-between; align-items: center; cursor:pointer;">
            <div style="text-align: left;">
              <h3 style="font-size: 19px; color:#ff7a00; margin:0;">${k.nome}</h3>
              <p style="font-size: 16px; color:#00ff88; margin-top:5px; font-weight:bold;">R$ ${Number(k.preco).toFixed(2)}</p>
            </div>
            <span style="color:#00ff88; font-weight:bold;">📦 Disponível</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
  document.querySelectorAll('.item-kit').forEach(card => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id)
      const kit = obterProdutos().find(p => p.id === id)
      carrinho = [kit]
      irParaTela(telaDadosCliente)
    })
  })
}

// --- FLUXO PEÇAS AVULSAS ---
function telaFluxoPecasAvulsas() {
  const produtos = obterProdutos().filter(p => p.categoria !== 'kit-upgrade' && p.ativo !== false && p.ativo !== "false")
  app.innerHTML = `
    <div class="container-step" style="max-width: 850px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1>Catálogo de Peças e Periféricos</h1>
      <input id="buscaCatalogoDireto" placeholder="🔍 O que você procura?" style="margin-bottom: 20px; width:100%; padding:12px; background:#141414; border:1px solid #333; color:#fff; border-radius:8px;">
      <div id="listaGridDireta" class="categorias" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; gap: 14px; width:100%;"></div>
      <div style="width:100%; background:#111; border: 2px solid #ff7a00; border-radius:15px; padding:15px; margin-top:30px; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
        <h2 id="totalItensCarrinho" style="font-size:20px; margin:0; color:#fff;">0 itens selecionados</h2>
        <button id="btnAvancarCarrinho" class="btn-start" style="width:auto; margin:0; padding:12px 24px;">🛒 Concluir Separação</button>
      </div>
    </div>
  `
  const renderizarGrid = (itensFiltrados) => {
    const grid = document.getElementById('listaGridDireta')
    if (!grid) return
    grid.innerHTML = itensFiltrados.map(p => {
      const jaNoCarrinho = carrinho.some(item => item.id === p.id)
      return `
        <div class="card item-avulso-card" data-id="${p.id}" style="height: 150px; border-color: ${jaNoCarrinho ? '#00ff88' : '#222'}; text-align: left; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;">
          <div><h3 style="font-size: 15px; color:#fff; margin:0;">${p.nome}</h3></div>
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span style="color:#00ff88; font-weight:bold;">R$ ${Number(p.preco).toFixed(2)}</span>
            <span>${jaNoCarrinho ? '✓ OK' : '+ Adicionar'}</span>
          </div>
        </div>
      `
    }).join('')

    grid.querySelectorAll('.item-avulso-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id)
        const produto = obterProdutos().find(p => p.id === id)
        const index = carrinho.findIndex(item => item.id === id)
        if (index > -1) { carrinho.splice(index, 1) } else { carrinho.push(produto) }
        document.getElementById('totalItensCarrinho').innerText = `${carrinho.length} item(ns) selecionado(s)`
        renderizarGrid(itensFiltrados)
      })
    })
  }
  document.getElementById('buscaCatalogoDireto').addEventListener('input', (e) => {
    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(e.target.value.toLowerCase()))
    renderizarGrid(filtrados)
  })
  document.getElementById('btnAvancarCarrinho').addEventListener('click', () => {
    if (carrinho.length === 0) { alert('Selecione itens!'); return; }
    irParaTela(telaDadosCliente)
  })
  renderizarGrid(produtos)
}

function telaDadosCliente() {
  app.innerHTML = `
    <div class="container-step">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h2>Insira seus dados para concluir</h2>
      <input type="text" id="input-nome" placeholder="Seu Nome...">
      <input type="text" id="input-telefone" placeholder="Seu Telefone...">
      <input type="text" id="input-cidade" placeholder="Sua Cidade...">
      <button id="btnAvancarDados" class="btn-start" style="margin-top:20px;">Avançar</button>
    </div>
  `;
  document.getElementById('btnAvancarDados').addEventListener('click', () => {
    dadosCliente.nome = document.getElementById('input-nome').value.trim();
    dadosCliente.telefone = document.getElementById('input-telefone').value.trim();
    dadosCliente.cidade = document.getElementById('input-cidade').value.trim();
    if (!dadosCliente.nome || !dadosCliente.telefone || !dadosCliente.cidade) { alert('Preencha tudo!'); return; }
    irParaTela(telaResumo);
  });
}

function telaResumo() {
  const totalGeral = carrinho.reduce((acc, item) => acc + (item.preco || 0), 0);
  
  app.innerHTML = `
    <div class="container-step" style="max-width: 680px; padding: 20px;">
      <button class="btn-voltar" onclick="telaAnterior()" style="margin-bottom: 10px;">⬅ Voltar</button>
      <h1>Seu Orçamento Provisório</h1>
      
      <div class="resultado" style="width:100%; background: #111; padding: 20px; border-radius: 10px; border: 1px solid #ff7a00;">
        <div id="lista-carrinho-resumo">
          ${carrinho.map((item, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #222;">
              <span style="color: #fff;">✓ ${item.nome}</span>
              <button class="btn-deletar-item" data-index="${idx}" style="background: transparent; border:none; cursor:pointer; font-size: 18px;">🗑️</button>
            </div>
          `).join('')}
        </div>
        
        <h2 style="color:#00ff88; text-align:center; margin: 20px 0;">Total: R$ ${totalGeral.toFixed(2)}</h2>
        
        <button id="btn-enviar-final" style="width:100%; padding:14px; background:#00e676; border:none; font-weight:bold; cursor:pointer; border-radius:8px; margin-bottom: 10px; color:#000;">📲 Enviar Orçamento no WhatsApp</button>
        <button id="btn-novo-orcamento" style="width:100%; padding:10px; background:transparent; border: 1px solid #444; color: #fff; cursor:pointer; border-radius:8px;">🔄 Iniciar Novo Orçamento</button>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #333; font-size: 12px; color: #888; text-align: center;">
          <p>🚚 <strong>Entregamos para todo o Brasil!</strong></p>
          <p>💳 Aceitamos: Visa, Mastercard, Amex e PIX</p>
          <div style="margin-top: 10px; font-weight: bold; color: #ff7a00;">Loja parceira do BOADICA</div>
        </div>
      </div>
    </div>
  `;

  // Lógica para deletar item
  document.querySelectorAll('.btn-deletar-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      carrinho.splice(e.target.dataset.index, 1);
      telaResumo();
    });
  });

  // Botões de ação
  document.getElementById('btn-novo-orcamento').addEventListener('click', () => {
    carrinho = [];
    telaInicial();
  });

  document.getElementById('btn-enviar-final').addEventListener('click', () => {
    let msg = `🖥️ ORÇAMENTO - BOADICA\n\n`;
    carrinho.forEach(i => msg += `- ${i.nome}\n`);
    msg += `\n💰 TOTAL: R$ ${totalGeral.toFixed(2)}\n\nAceitamos Cartões (Visa, Master, Amex) e PIX. Fazemos entregas!`;
    window.open(`https://wa.me/5521971301860?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// --- INTERFACE DO PAINEL ADMIN (CORRIGIDA E OTIMIZADA) ---
function abrirAdmin() {
  const senha = prompt('Digite a senha do painel')
  if (senha !== '1234') { alert('Senha incorreta'); window.addEventListener('keydown', detectarAtalhoAdmin); return; }
  telaAdmin()
}

// Funções globais associadas ao escopo window
window.alternarStatusProduto = function(id) {
  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const atualizados = produtos.map(p => p.id === id ? { ...p, ativo: !(p.ativo === undefined || p.ativo === true || p.ativo === "true") } : p);
  localStorage.setItem('produtos', JSON.stringify(atualizados));
  window.renderizarLinhasTabelaAdmin();
}

window.alterarStatusTodos = function(statusAlvo) {
  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const atualizados = produtos.map(p => ({ ...p, ativo: statusAlvo }));
  localStorage.setItem('produtos', JSON.stringify(atualizados));
  window.renderizarLinhasTabelaAdmin();
}

window.zerarTodoEstoque = function() {
  if (confirm("⚠️ ATENÇÃO: Tem certeza que deseja ZERAR permanentemente o banco de dados do sistema?")) {
    localStorage.setItem('produtos', JSON.stringify([]));
    telaAdmin();
  }
}

window.deletarProdutoAdmin = function(id) {
  if (confirm("Remover este item permanentemente?")) {
    const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
    localStorage.setItem('produtos', JSON.stringify(produtos.filter(p => p.id !== id)));
    telaAdmin();
  }
}

// Renderizador focado apenas nas linhas (Impede o bug de digitar ao contrário)
window.renderizarLinhasTabelaAdmin = function() {
  const tbody = document.getElementById('corpoTabelaAdmin');
  const contadorTitulo = document.getElementById('contadorProdutosTitulo');
  if (!tbody) return;

  const listaProdutos = JSON.parse(localStorage.getItem('produtos')) || [];
  const termoFiltro = document.getElementById('buscaAdminInput') ? document.getElementById('buscaAdminInput').value.toLowerCase() : "";

  const produtosFiltrados = listaProdutos.filter(p => 
    p.nome.toLowerCase().includes(termoFiltro) || 
    p.categoria.toLowerCase().includes(termoFiltro)
  );

  if (contadorTitulo) {
    contadorTitulo.innerText = `Produtos em Estoque (${produtosFiltrados.length})`;
  }

  tbody.innerHTML = produtosFiltrados.map(p => {
    const itemAtivo = (p.ativo === undefined || p.ativo === true || p.ativo === "true");
    return `
    <tr style="border-bottom: 1px solid #1a1a1a; background: ${itemAtivo ? 'transparent' : 'rgba(255,0,0,0.03)'}">
      <td style="padding: 12px 8px; font-weight: 500; color: ${itemAtivo ? '#fff' : '#666'};">${p.nome}</td>
      <td style="padding: 12px 8px; color: #aaa; text-transform: uppercase;">${p.categoria}</td>
      <td style="padding: 12px 8px; font-weight: bold;">${p.quantidade || 0}</td>
      <td style="padding: 12px 8px; color: #ff7a00;">R$ ${Number(p.custo || 0).toFixed(2)}</td>
      <td style="padding: 12px 8px; color: #00ff88; font-weight: bold;">R$ ${Number(p.preco || 0).toFixed(2)}</td>
      
      <td style="padding: 6px 8px; text-align: center;">
        <button onclick="alternarStatusProduto(${p.id})" style="padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; width: 100px; background: ${itemAtivo ? '#00ff88' : '#ff4444'}; color: ${itemAtivo ? '#000' : '#fff'}; transition: 0.2s;">
          ${itemAtivo ? '🟢 ATIVAR' : '🔴 OCULTAR'}
        </button>
      </td>

      <td style="padding: 6px 8px; text-align: center;">
        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
          <button style="background: #ff7a00; color: #000; border: none; border-radius: 3px; font-size: 10px; font-weight: bold; padding: 4px 8px; cursor: pointer;">EDIT</button>
          <button onclick="deletarProdutoAdmin(${p.id})" style="background: transparent; border: none; color: #ff4444; cursor: pointer; font-size: 13px; padding: 2px;">🗑️</button>
        </div>
      </td>
    </tr>
    `;
  }).join('');
}// --- LÓGICA DE IMPORTAÇÃO DE PLANILHA ---
window.processarPlanilha = function() {
  const fileInput = document.getElementById('uploadPlanilha');
  if (!fileInput.files.length) {
    alert("Selecione um arquivo primeiro!");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Mapeamento dos dados da planilha para o sistema
    const novosProdutos = jsonData.map((item, index) => {
      // Ajuste os nomes das colunas abaixo conforme o seu Excel (ex: 'Nome', 'Estoque', 'Preço')
      const nome = item['Nome'] || item['nome'] || "Produto Sem Nome";
      const preco = limparNumero(item['Preço'] || item['Venda'] || 0);
      const custo = limparNumero(item['Custo'] || 0);
      const qtd = limparNumero(item['Estoque'] || item['Quantidade'] || 0);
      
      return {
        id: Date.now() + index,
        nome: nome,
        categoria: identificarCategoria(nome),
        socket: extrairSocket(nome),
        preco: preco,
        custo: custo,
        quantidade: qtd,
        ativo: true
      };
    });

    const produtosAtuais = JSON.parse(localStorage.getItem('produtos')) || [];
    localStorage.setItem('produtos', JSON.stringify([...produtosAtuais, ...novosProdutos]));
    alert("Planilha processada com sucesso!");
    window.renderizarLinhasTabelaAdmin();
  };

  reader.readAsArrayBuffer(file);
};

// --- FUNÇÃO SALVAR MANUAL ---
window.salvarProdutoManual = function() {
  const novo = {
    id: Date.now(),
    categoria: document.getElementById('categoriaProduto').value,
    nome: document.getElementById('nomeProduto').value,
    socket: document.getElementById('socketProduto').value,
    quantidade: Number(document.getElementById('quantidadeProduto').value),
    custo: Number(document.getElementById('custoProduto').value),
    preco: Number(document.getElementById('precoProduto').value),
    ativo: true
  };

  const lista = JSON.parse(localStorage.getItem('produtos')) || [];
  lista.push(novo);
  localStorage.setItem('produtos', JSON.stringify(lista));
  alert('Produto adicionado!');
  window.renderizarLinhasTabelaAdmin();
};

// --- AJUSTE DOS EVENT LISTENERS NO TELA ADMIN ---
// Ao chamar a telaAdmin, adicione estes listeners:
function configurarEventosAdmin() {
  const btnProcessar = document.getElementById('btnProcessarPlanilha');
  if (btnProcessar) btnProcessar.onclick = window.processarPlanilha;

  const btnSalvar = document.getElementById('btnSalvarProduto');
  if (btnSalvar) btnSalvar.onclick = window.salvarProdutoManual;

  const buscaAdmin = document.getElementById('buscaAdminInput');
  if (buscaAdmin) buscaAdmin.addEventListener('input', window.renderizarLinhasTabelaAdmin);
  
  window.renderizarLinhasTabelaAdmin();
}

function telaAdmin() {
  app.innerHTML = `
    <div class="container-step" style="max-width: 100% !important; width: 100% !important; padding: 20px !important; background: #000; box-sizing: border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:1200px; margin: 0 auto 15px auto;">
        <button class="btn-voltar" onclick="telaInicial()" style="margin:0;">⬅ Voltar ao Totem</button>
        <span style="color:#ff7a00; font-weight:bold; font-size:14px;">PAINEL ADMINISTRATIVO</span>
      </div>

      <div style="width: 100% !important; max-width: 1200px; background: #0a0a0a; border: 1px solid #ff7a00; border-radius: 6px; padding: 20px; box-sizing: border-box; margin: 0 auto;">
        
        <div style="display: grid; grid-template-columns: 1.2fr 1.8fr 1fr 0.8fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Categoria</label>
            <select id="categoriaProduto" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px;">
              <option value="cpu">CPU (Processador)</option>
              <option value="placamae">Placa-Mãe</option>
              <option value="gpu">GPU (Placa de Vídeo)</option>
              <option value="ram">RAM</option>
              <option value="ssd">SSD</option>
              <option value="fonte">Fonte</option>
              <option value="gabinete">Gabinete</option>
              <option value="kit-upgrade">📦 Kit Upgrade</option>
              <option value="acessorios">ACESSORIOS</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Nome do Produto</label>
            <input id="nomeProduto" placeholder="Ex: Ryzen 5 5600" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Socket</label>
            <input id="socketProduto" placeholder="Ex: AM4 / AM5" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Estoque</label>
            <input id="quantidadeProduto" type="number" placeholder="Qtd" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Custo (R$)</label>
            <input id="custoProduto" placeholder="Custo" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: bold; color: #ff7a00; display: block; margin-bottom: 5px; text-align: left;">Venda (R$)</label>
            <input id="precoProduto" placeholder="Venda" style="width: 100%; padding: 8px; background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 4px; height: 38px; box-sizing: border-box;">
          </div>
        </div>

        <button id="btnSalvarProduto" style="width: 100%; padding: 10px; background: #ff7a00; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 14px; margin-bottom: 20px;">Salvar Produto Manual</button>

        <div style="border: 1px dashed #333; padding: 15px; border-radius: 4px; margin-bottom: 12px; text-align: left; background: #111;">
          <div style="display:flex; align-items:center; gap:6px; font-size: 13px; font-weight: bold; color: #fff; margin-bottom: 10px;">
            <span>📁</span> Importar Catálogo Completo (Excel/CSV):
          </div>
          <input type="file" id="uploadPlanilha" accept=".xlsx" style="color: #aaa; font-size: 13px; margin-bottom: 12px; display: block;">
          <button id="btnProcessarPlanilha" style="width: 100%; padding: 10px; background: #2ecc71; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Processar e Atualizar Estoque</button>
        </div>

        <button onclick="zerarTodoEstoque()" style="width: 100%; padding: 10px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-bottom: 25px;">🚨 ZERAR TODO O ESTOQUE DO SISTEMA</button>

        <div style="position: relative; margin-bottom: 20px;">
          <input id="buscaAdminInput" placeholder="🔍 Buscar produto no estoque..." style="width: 100%; padding: 12px 12px 12px 35px; background: #111; border: 1px solid #222; border-radius: 4px; color: #fff; box-sizing: border-box;">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #222;">
          <h3 id="contadorProdutosTitulo" style="color: #fff; font-size: 16px; font-weight: bold; margin: 0; text-align: left;">Produtos em Estoque (0)</h3>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: #aaa; font-size: 11px; font-weight: bold; text-transform: uppercase;">AÇÃO EM MASSA:</span>
            <button onclick="alterarStatusTodos(true)" style="padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; background: #00ff88; color: #000; border: none; cursor: pointer;">🟢 Ativar Todos</button>
            <button onclick="alterarStatusTodos(false)" style="padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; background: #ff4444; color: #fff; border: none; cursor: pointer;">🔴 Ocultar Todos</button>
          </div>
        </div>

        <div style="overflow-x: auto; width: 100%;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; color: #fff;">
            <thead>
              <tr style="color: #ff7a00; border-bottom: 1px solid #222; background: #111;">
                <th style="padding: 10px 8px; width: 35%;">Item</th>
                <th style="padding: 10px 8px;">Categoria</th>
                <th style="padding: 10px 8px;">Qtd</th>
                <th style="padding: 10px 8px; color: #ff7a00;">Custo</th>
                <th style="padding: 10px 8px; color: #ff7a00;">Venda</th>
                
                <th style="padding: 10px 8px; text-align: center; color: #ff7a00; width: 120px;">Status Visível</th>
                
                <th style="padding: 10px 8px; text-align: center; width: 100px;">Ação</th>
              </tr>
            </thead>
            <tbody id="corpoTabelaAdmin">
              </tbody>
          </table>
        </div>

      </div>
    </div>
  `;

  // Listener para capturar a busca em tempo real sem perder o foco nem inverter strings
  const inputBusca = document.getElementById('buscaAdminInput');
  if (inputBusca) {
    inputBusca.addEventListener('input', () => {
      window.renderizarLinhasTabelaAdmin();
    });
  }

  // Listener para salvar produto manual
  document.getElementById('btnSalvarProduto').addEventListener('click', () => {
    const cat = document.getElementById('categoriaProduto').value;
    const nome = document.getElementById('nomeProduto').value.trim();
    const socket = document.getElementById('socketProduto').value.trim().toUpperCase();
    const qtd = parseInt(document.getElementById('quantidadeProduto').value) || 0;
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const preco = parseFloat(document.getElementById('precoProduto').value) || 0;

    if (!nome) { alert('Insira ao menos o nome do produto!'); return; }

    const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
    const novoId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id || 0)) + 1 : 1;

    produtos.push({ id: novoId, categoria: cat, nome, socket, quantidade: qtd, custo, preco, ativo: true });
    localStorage.setItem('produtos', JSON.stringify(produtos));
    
    // Limpa campos básicos do formulário
    document.getElementById('nomeProduto').value = '';
    document.getElementById('socketProduto').value = '';
    document.getElementById('quantidadeProduto').value = '';
    document.getElementById('custoProduto').value = '';
    document.getElementById('precoProduto').value = '';

    window.renderizarLinhasTabelaAdmin();
  });

  // Processamento do arquivo Excel (.xlsx)
  document.getElementById('btnProcessarPlanilha').addEventListener('click', () => {
    const inputArquivo = document.getElementById('uploadPlanilha');
    const arquivo = inputArquivo ? inputArquivo.files[0] : null;
    if (!arquivo) { alert('Selecione uma planilha antes de clicar para processar!'); return; }

    const leitor = new FileReader();
    leitor.onload = (evt) => {
      try {
        const dadosBinarios = evt.target.result;
        const livro = XLSX.read(dadosBinarios, { type: 'binary' });
        const nomeAba = livro.SheetNames[0];
        const linhasJson = XLSX.utils.sheet_to_json(livro.Sheets[nomeAba]);

        if (linhasJson.length === 0) { alert('A planilha está vazia!'); return; }

        const produtosExistentes = JSON.parse(localStorage.getItem('produtos')) || [];
        let proximoId = produtosExistentes.length > 0 ? Math.max(...produtosExistentes.map(p => p.id || 0)) + 1 : 1;

        linhasJson.forEach(linha => {
          const nomeOriginal = linha.Nome || linha.nome || linha.PRODUTO || linha.produto || '';
          if (!nomeOriginal) return;

          const precoVenda = limparNumero(linha.Preco || linha.preco || linha.VENDA || linha.venda || 0);
          const precoCusto = limparNumero(linha.Custo || linha.custo || linha.CUSTO || linha.custo || 0);
          const estoqueQtd = parseInt(linha.Quantidade || linha.quantidade || linha.ESTOQUE || linha.estoque) || 0;

          produtosExistentes.push({
            id: proximoId++,
            categoria: identificarCategoria(nomeOriginal),
            nome: nomeOriginal.trim(),
            preco: precoVenda,
            custo: precoCusto,
            quantidade: estoqueQtd,
            socket: extrairSocket(nomeOriginal),
            ativo: true
          });
        });

        localStorage.setItem('produtos', JSON.stringify(produtosExistentes));
        alert('Planilha importada com sucesso!');
        window.renderizarLinhasTabelaAdmin();
      } catch (err) {
        alert('Erro ao processar: ' + err.message);
      }
    };
    leitor.readAsBinaryString(arquivo);
  });

  // Renderização inicial populando as linhas da tabela
  window.renderizarLinhasTabelaAdmin();
}// --- FUNÇÃO PARA SALVAR EDIÇÃO ---
window.salvarEdicao = function(id) {
  const linha = document.getElementById(`linha-${id}`);
  const nome = linha.querySelector('.edit-nome').value;
  const categoria = linha.querySelector('.edit-cat').value;
  const qtd = linha.querySelector('.edit-qtd').value;
  const custo = linha.querySelector('.edit-custo').value;
  const preco = linha.querySelector('.edit-preco').value;

  const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
  const index = produtos.findIndex(p => p.id === id);
  
  if (index !== -1) {
    produtos[index] = { ...produtos[index], nome, categoria, quantidade: Number(qtd), custo: Number(custo), preco: Number(preco) };
    localStorage.setItem('produtos', JSON.stringify(produtos));
    window.renderizarLinhasTabelaAdmin();
  }
}

// --- FUNÇÃO PARA HABILITAR MODO EDIÇÃO ---
window.habilitarEdicao = function(id) {
  const linha = document.getElementById(`linha-${id}`);
  const produto = JSON.parse(localStorage.getItem('produtos')).find(p => p.id === id);

  linha.innerHTML = `
    <td style="padding: 12px 8px;"><input class="edit-nome" value="${produto.nome}" style="width:90%; background:#222; color:#fff; border:1px solid #444;"></td>
    <td style="padding: 12px 8px;"><input class="edit-cat" value="${produto.categoria}" style="width:90%; background:#222; color:#fff; border:1px solid #444;"></td>
    <td style="padding: 12px 8px;"><input class="edit-qtd" type="number" value="${produto.quantidade}" style="width:50px; background:#222; color:#fff; border:1px solid #444;"></td>
    <td style="padding: 12px 8px;"><input class="edit-custo" value="${produto.custo}" style="width:60px; background:#222; color:#fff; border:1px solid #444;"></td>
    <td style="padding: 12px 8px;"><input class="edit-preco" value="${produto.preco}" style="width:60px; background:#222; color:#fff; border:1px solid #444;"></td>
    <td style="padding: 6px 8px; text-align:center;">-</td>
    <td style="padding: 6px 8px; text-align:center;">
      <button onclick="salvarEdicao(${id})" style="background:#00ff88; color:#000; border:none; padding:4px 8px; cursor:pointer; font-weight:bold;">SALVAR</button>
    </td>
  `;
}

// --- ATUALIZAÇÃO DO RENDERIZADOR (Adicionar ID à linha) ---
window.renderizarLinhasTabelaAdmin = function() {
  const tbody = document.getElementById('corpoTabelaAdmin');
  if (!tbody) return;

  const listaProdutos = JSON.parse(localStorage.getItem('produtos')) || [];
  const termoFiltro = document.getElementById('buscaAdminInput') ? document.getElementById('buscaAdminInput').value.toLowerCase() : "";

  const produtosFiltrados = listaProdutos.filter(p => 
    p.nome.toLowerCase().includes(termoFiltro) || 
    p.categoria.toLowerCase().includes(termoFiltro)
  );

  tbody.innerHTML = produtosFiltrados.map(p => {
    const itemAtivo = (p.ativo === undefined || p.ativo === true || p.ativo === "true");
    return `
    <tr id="linha-${p.id}" style="border-bottom: 1px solid #1a1a1a; background: ${itemAtivo ? 'transparent' : 'rgba(255,0,0,0.03)'}">
      <td style="padding: 12px 8px;">${p.nome}</td>
      <td style="padding: 12px 8px; text-transform: uppercase;">${p.categoria}</td>
      <td style="padding: 12px 8px;">${p.quantidade || 0}</td>
      <td style="padding: 12px 8px;">R$ ${Number(p.custo || 0).toFixed(2)}</td>
      <td style="padding: 12px 8px; color: #00ff88; font-weight: bold;">R$ ${Number(p.preco || 0).toFixed(2)}</td>
      <td style="padding: 6px 8px; text-align: center;">
        <button onclick="alternarStatusProduto(${p.id})" style="padding: 4px 10px; font-size: 11px; background: ${itemAtivo ? '#00ff88' : '#ff4444'}; border:none; cursor:pointer;">
          ${itemAtivo ? '🟢 ATIVO' : '🔴 OCULTO'}
        </button>
      </td>
      <td style="padding: 6px 8px; text-align: center;">
        <button onclick="habilitarEdicao(${p.id})" style="background: #ff7a00; border: none; padding: 4px 8px; cursor: pointer;">EDIT</button>
        <button onclick="deletarProdutoAdmin(${p.id})" style="background: transparent; border: none; color: #ff4444; cursor: pointer;">🗑️</button>
      </td>
    </tr>
    `;
  }).join('');
}

// Inicializa a aplicação
telaInicial();
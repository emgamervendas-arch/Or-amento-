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

// Peças padrão de backup
const pecasPadrao = [
  { id: 1, categoria: 'cpu', nome: 'Ryzen 5 5600', preco: 750, custo: 650, quantidade: 10, socket: 'AM4' },
  { id: 2, categoria: 'cpu', nome: 'Ryzen 7 7800X3D', preco: 2800, custo: 2500, quantidade: 5, socket: 'AM5' },
  { id: 4, categoria: 'placamae', nome: 'B550M AM4', preco: 750, custo: 650, quantidade: 10, socket: 'AM4' },
  { id: 7, categoria: 'gpu', nome: 'RTX 4060', preco: 1900, custo: 1750, quantidade: 6 },
  { id: 10, categoria: 'ram', nome: '16GB DDR4', preco: 300, custo: 220, quantidade: 20 },
  { id: 12, categoria: 'ssd', nome: '1TB NVMe', preco: 450, custo: 350, quantidade: 10 },
  { id: 13, categoria: 'fonte', nome: 'Fonte 650W Corsair', preco: 390, custo: 310, quantity: 8 },
  { id: 14, categoria: 'gabinete', nome: 'RGB Gamer Mancer', preco: 350, custo: 250, quantidade: 9 },
  { id: 20, categoria: 'kit-upgrade', nome: 'Kit Upgrade Ryzen 5 5600 + B550M + 16GB RAM', preco: 1650, custo: 1400, quantidade: 4 },
  { id: 30, categoria: 'acessorios', nome: 'Mouse Gamer Logitech G203', preco: 150, custo: 90, quantidade: 15 }
]

if (!localStorage.getItem('produtos')) {
  localStorage.setItem('produtos', JSON.stringify(pecasPadrao))
}

function obterProdutos() {
  return JSON.parse(localStorage.getItem('produtos')) || []
}

function buscarProdutos(categoriaAlvo) {
  const produtos = obterProdutos()
  return produtos.filter(p => p.categoria && p.categoria.toLowerCase() === categoriaAlvo.toLowerCase())
}

// Vincula funções ao objeto window para garantir funcionamento seguro no escopo global
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

// Ouvinte de teclado secreto para o Admin (Configurado para F8)
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

// --- ESTEIRA SEQUENCIAL: PC COMPLETO ---
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
  if (categoriaAtual === 'placamae') {
    const cpuSelecionada = carrinho.find(item => item.categoria === 'cpu');
    if (cpuSelecionada && cpuSelecionada.socket) {
      produtosBase = produtosBase.filter(p => !p.socket || p.socket.toUpperCase().trim() === cpuSelecionada.socket.toUpperCase().trim());
    }
  }

  const prosseguir = (item) => {
    carrinho = carrinho.filter(i => i.categoria !== categoriaAtual);
    if (item) carrinho.push(item);

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

    let produtosFiltrados = produtosBase.filter(p => 
      p.nome.toLowerCase().includes(termoBusca.toLowerCase())
    );
    
    produtosFiltrados = produtosFiltrados.slice(0, 9);

    if (produtosFiltrados.length === 0) {
      gridContainer.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px dashed #555;">
          <h3 style="margin: 0; color: #aaa;">Nenhum item correspondente</h3>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #777;">Tente digitar outra palavra-chave.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = produtosFiltrados.map(p => `
      <div class="card item-hardware" data-id="${p.id}" style="height: auto; min-height: 90px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 16px; border: 1px solid #222; border-radius: 10px; background: #141414; box-sizing: border-box; cursor: pointer; transition: transform 0.2s, border-color 0.2s;">
        <div style="text-align: left; width: 100%; pointer-events: none;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <span style="font-size: 10px; background: #222; color: #ff7a00; font-weight: bold; text-transform: uppercase;">${nomesCategorias[categoriaAtual]}</span>
            ${p.socket ? `<span style="font-size: 11px; color: #00ff88; background: rgba(0,255,136,0.1); padding: 2px 6px; border-radius:4px; font-weight:bold;">${p.socket}</span>` : ''}
          </div>
          <h3 style="font-size: 14px; line-height: 1.4; margin: 0; color: #fff; font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.nome}</h3>
        </div>
      </div>
    `).join('');

    gridContainer.querySelectorAll('.item-hardware').forEach(card => {
      card.addEventListener('click', () => {
        const idProcurado = Number(card.getAttribute('data-id'));
        const produto = produtosBase.find(p => Number(p.id) === idProcurado) || obterProdutos().find(p => Number(p.id) === idProcurado);
        
        if (produto) {
          prosseguir(produto);
        }
      });
    });
  };

  app.innerHTML = `
    <div class="container-step" style="max-width: 1000px; padding: 20px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1 style="margin-bottom: 5px;">Escolha o seu ${nomesCategorias[categoriaAtual]}</h1>
      <p class="subtitulo-uso" style="margin-bottom: 20px;">Etapa de montagem para o seu PC ${dadosCliente.tipoFluxo === 'pc-gamer' ? 'Gamer 🎮' : 'Profissional 💼'}</p>
      
      <div style="width: 100%; margin-bottom: 15px; position: relative;">
        <input type="text" id="busca-peca" placeholder="🔍 Digite para buscar... (ex: ssd, rtx, i3, b550)" 
               style="width: 100%; padding: 12px 16px; background: #141414; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 15px; box-sizing: border-box; outline: none; transition: border-color 0.2s;" />
      </div>
      
      <div id="grid-produtos" style="display: grid !important; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; gap: 16px; width: 100%; box-sizing: border-box;">
      </div>

      ${produtosBase.length === 0 ? `
        <div id="card-pular" style="margin-top: 15px; height: 80px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px dashed #555; border-radius: 10px;">
          <h3 style="margin: 0; color: #aaa;">Pular esta etapa</h3>
        </div>
      ` : ''}
    </div>
  `;

  const inputBusca = document.getElementById('busca-peca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      renderizarLista(e.target.value);
    });
  }

  const cardPular = document.getElementById('card-pular');
  if (cardPular) cardPular.addEventListener('click', () => { prosseguir(null); });

  renderizarLista();
}

// --- ESTEIRA FLUIDA: KITS UPGRADE ---
function telaFluxoKitUpgrade() {
  const kits = buscarProdutos('kit-upgrade')

  app.innerHTML = `
    <div class="container-step" style="max-width: 750px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1>Combos & Kits Upgrade</h1>
      <p class="subtitulo-uso">Dê uma vida nova para a sua máquina atual</p>
      
      <div class="categorias" style="grid-template-columns: 1fr !important; gap: 15px; width:100%;">
        ${kits.length === 0 ? '<p style="opacity:0.5;">Nenhum kit cadastrado no momento.</p>' : kits.map(k => `
          <div class="card item-kit" data-id="${k.id}" style="height: 120px; padding: 20px; flex-direction: row; justify-content: space-between; align-items: center;">
            <div style="text-align: left; max-width: 70%;">
              <h3 style="font-size: 19px; color:#ff7a00; margin:0;">${k.nome}</h3>
              <p style="font-size: 14px; color:#bbb; margin-top:5px; margin-bottom:0;">Pronto para montagem imediata</p>
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

// --- ESTEIRA DIRETA: PEÇAS E ACESSÓRIOS ---
function telaFluxoPecasAvulsas() {
  const produtos = obterProdutos().filter(p => p.categoria !== 'kit-upgrade')

  app.innerHTML = `
    <div class="container-step" style="max-width: 850px;">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h1>Catálogo de Peças e Periféricos</h1>
      <p class="subtitulo-uso">Selecione os itens desejados clicando neles</p>
      
      <input id="buscaCatalogoDireto" placeholder="🔍 O que você procura? (Ex: RTX, Mouse, SSD...)" style="margin-bottom: 20px; width:100%; padding:12px; background:#141414; border:1px solid #333; color:#fff; border-radius:8px;">
      
      <div id="listaGridDireta" class="categorias" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; gap: 14px; width:100%;"></div>
      
      <div id="barraCarrinhoFlutuante" style="width:100%; background:#111; border: 2px solid #ff7a00; border-radius:15px; padding:15px; margin-top:30px; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
        <div style="text-align:left;">
          <span style="font-size:14px; color:#aaa;">Itens no orçamento:</span>
          <h2 id="totalItensCarrinho" style="font-size:20px; margin:0; color:#fff;">0 itens selecionados</h2>
        </div>
        <button id="btnAvancarCarrinho" class="btn-start" style="padding:12px 24px; font-size:16px; border-radius:8px; width:auto; margin:0;">🛒 Concluir Separação</button>
      </div>
    </div>
  `

  const renderizarGrid = (itensFiltrados) => {
    const grid = document.getElementById('listaGridDireta')
    if (!grid) return

    grid.innerHTML = itensFiltrados.map(p => {
      const jaNoCarrinho = carrinho.some(item => item.id === p.id)
      return `
        <div class="card item-avulso-card" data-id="${p.id}" style="height: 140px; padding: 15px; border-color: ${jaNoCarrinho ? '#00ff88' : '#222'}; text-align: left; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <span style="font-size: 11px; background: #222; padding: 3px 8px; border-radius: 4px; color: #ff7a00; font-weight: bold; text-transform: uppercase;">${p.categoria}</span>
            <h3 style="font-size: 16px; margin-top: 8px; line-height: 1.3; color:#fff; margin-bottom:0;">${p.nome}</h3>
          </div>
          ${jaNoCarrinho ? '<span style="font-size:11px; color:#00ff88; font-weight:bold;">✓ ADICIONADO</span>' : '<span style="font-size:11px; color:#555;">+ Adicionar ao pedido</span>'}
        </div>
      `
    }).join('')

    document.querySelectorAll('.item-avulso-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id)
        const produto = obterProdutos().find(p => p.id === id)
        const index = carrinho.findIndex(item => item.id === id)

        if (index > -1) {
          carrinho.splice(index, 1)
        } else {
          carrinho.push(produto)
        }
        
        atualizarIndicadoresCarrinho(itensFiltrados)
      })
    })
  }

  const atualizarIndicadoresCarrinho = (listaAtual) => {
    document.getElementById('totalItensCarrinho').innerText = `${carrinho.length} item(ns) selecionado(s)`
    renderizarGrid(listaAtual)
  }

  document.getElementById('buscaCatalogoDireto').addEventListener('input', (e) => {
    const busca = e.target.value.toLowerCase()
    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca) || p.categoria.toLowerCase().includes(busca))
    renderizarGrid(filtrados)
  })

  document.getElementById('btnAvancarCarrinho').addEventListener('click', () => {
    if (carrinho.length === 0) {
      alert('Selecione pelo menos uma peça ou acessório para prosseguir!')
      return
    }
    irParaTela(telaDadosCliente)
  })

  renderizarGrid(produtos)
}

// --- TELA DE CAPTURA DE DADOS ---
function telaDadosCliente() {
  app.innerHTML = `
    <div class="container-step">
      <button class="btn-voltar" onclick="telaAnterior()">⬅ Voltar</button>
      <h2>Insira seus dados para concluir o orçamento</h2>
      <input type="text" id="input-nome" placeholder="Digite seu Nome...">
      <input type="text" id="input-telefone" placeholder="Digite seu Telefone (WhatsApp)...">
      <input type="text" id="input-cidade" placeholder="Digite sua Cidade...">
      
      <button id="btnAvancarDados" class="btn-start" style="margin-top:20px;">Avançar</button>
    </div>
  `;

  document.getElementById('btnAvancarDados').addEventListener('click', salvarDadosEAvancar);
}

function salvarDadosEAvancar() {
  const inputNome = document.getElementById('input-nome');
  const inputTelefone = document.getElementById('input-telefone');
  const inputCidade = document.getElementById('input-cidade');

  const nomeVal = inputNome ? inputNome.value.trim() : '';
  const telVal = inputTelefone ? inputTelefone.value.trim() : '';
  const cidVal = inputCidade ? inputCidade.value.trim() : '';

  if (!nomeVal || !telVal || !cidVal) {
    alert('⚠️ Atenção: Você precisa preencher Nome, Telefone e Cidade para gerar o orçamento!');
    return;
  }

  dadosCliente.nome = nomeVal;
  dadosCliente.telefone = telVal;
  dadosCliente.cidade = cidVal;

  irParaTela(telaResumo);
}

// --- RESUMO FINAL E ENVIO DO WHATSAPP ---
function telaResumo() {
  const totalGeral = carrinho.reduce((acc, item) => acc + (item.preco || 0), 0);

  const tagsFluxo = {
    'pc-gamer': '🎮 CONFIGURAÇÃO PC GAMER',
    'pc-trabalho': '💼 CONFIGURAÇÃO PC WORKSTATION',
    'kit-upgrade': '📦 COMBO KIT UPGRADE',
    'pecas-avulsas': '🔌 COMPONENTES E PERIFÉRICOS'
  };

  app.innerHTML = `
    <div class="container-step" style="max-width: 680px;">
      <button class="btn-voltar" id="btnVoltarResumo">⬅ Voltar</button>
      <h1>Seu Orçamento Provisório</h1>
      
      <div class="resultado" style="width:100%; text-align:left;">
        <h3 style="color:#ff7a00; margin-bottom:15px; font-size:22px; text-align:center;">📋 Resumo do Pedido</h3>
        
        <div style="background:#1c1c1c; padding:15px; border-radius:10px; margin-bottom:20px; font-size:15px; line-height:1.6;">
          <p><b>Cliente:</b> ${dadosCliente.nome || 'Não informado'}</p>
          <p><b>Tipo de Atendimento:</b> ${tagsFluxo[dadosCliente.tipoFluxo] || 'Geral'}</p>
        </div>

        <div class="specs" style="margin: 0 0 20px 0;">
          ${carrinho.map((item, index) => `
            <div style="padding:14px 10px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; font-size:15px;">
              <span style="color:#fff; text-transform: uppercase; font-weight: 500;">✓ ${item.nome}</span>
              <div style="display:flex; align-items:center; gap:10px;">
                <button class="btn-remover" data-index="${index}" style="background:transparent; border:none; color:#ff4444; cursor:pointer; font-size:16px; padding:5px 10px;">🗑️</button>
              </div>
            </div>
           `).join('')}
        </div>

        <div class="preco" style="text-align:center; margin: 20px 0 5px 0; color: #00ff88; font-size: 32px; font-weight: bold;">R$ ${totalGeral.toFixed(2)}</div>
        
        <div class="trust-container" style="background: #141414; border: 1px solid #222; border-radius: 10px; padding: 15px; margin-bottom: 25px; text-align: center;">
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #222; padding-bottom: 10px;">
            <span style="font-size: 18px;">🔍</span>
            <span style="color: #fff; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">Loja Parceira do Site <b style="color: #ff7a00; text-transform: uppercase;">boadica.com.br</b></span>
          </div>
          
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 11px; color: #777; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Formas de Pagamento Aceitas</span>
            <div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 24px; filter: grayscale(20%); padding-top: 4px;">
              <span title="Visa" style="cursor: default;">💳</span>
              <span title="Mastercard" style="font-size: 13px; color: #aaa; background: #222; padding: 4px 8px; border-radius: 4px; font-weight: bold;">VISA / MASTER</span>
              <span title="Elo / Hipercard" style="font-size: 13px; color: #aaa; background: #222; padding: 4px 8px; border-radius: 4px; font-weight: bold;">ELO</span>
              <span title="Pix" style="font-size: 13px; color: #00ff88; background: rgba(0,255,136,0.1); padding: 4px 8px; border-radius: 4px; font-weight: bold;">❖ PIX</span>
            </div>
          </div>
          
        </div>
        
        <div class="botoes" style="display:flex; flex-direction:column; gap:10px;">
          <button id="btn-enviar-final" class="btn-whatsapp" style="text-align:center; width:100%; padding:14px 0; background: #00e676; color: #000; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">📲 Enviar Pedido no WhatsApp</button>
          <button id="btnReiniciarTudo" class="btn-start" style="background:#222; border:1px solid #ff7a00; color: #ff7a00; font-size:16px; padding:12px 0; border-radius:10px; width:100%; cursor:pointer;">🔄 Montar Outra Configuração</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-remover').forEach(botao => {
    botao.addEventListener('click', (e) => {
      const indexRemover = parseInt(e.currentTarget.getAttribute('data-index'));
      carrinho.splice(indexRemover, 1);
      telaResumo();
    });
  });

  document.getElementById('btn-enviar-final').addEventListener('click', () => {
    let linhasPecasZap = '';
    carrinho.forEach((item, index) => {
      linhasPecasZap += `${index + 1}. ${item.nome} - R$ ${Number(item.preco).toFixed(2)}\n`;
    });

    const textoZap = `🖥️ NOVO ORÇAMENTO - LEAL TECH\n---------------------------------\n📌 Modalidade: ${tagsFluxo[dadosCliente.tipoFluxo] || '🛒 Venda Direta'}\n👤 Cliente: ${dadosCliente.nome || 'Não informado'}\n📱 Telefone: ${dadosCliente.telefone || 'Não informado'}\n📍 Local: ${dadosCliente.cidade || 'Não informada'}\n---------------------------------\n📦 ITENS DO PEDIDO:\n${linhasPecasZap}---------------------------------\n💰 VALOR TOTAL: R$ ${totalGeral.toFixed(2)}\n\n*Valores sujeitos a alteração conforme estoque.`;
    const linkWhatsApp = `https://wa.me/5521971301860?text=${encodeURIComponent(textoZap)}`;
    window.open(linkWhatsApp, '_blank');
  });

  document.getElementById('btnReiniciarTudo').addEventListener('click', () => irParaTela(telaInicial));
  document.getElementById('btnVoltarResumo').addEventListener('click', () => telaAnterior());
}

// --- INTERFACE DO PAINEL ADMIN ---
function abrirAdmin() {
  const senha = prompt('Digite a senha do painel')
  if (senha !== '1234') {
    alert('Senha incorreta')
    window.addEventListener('keydown', detectarAtalhoAdmin);
    return
  }
  telaAdmin()
}

function telaAdmin() {
  app.innerHTML = `
    <div class="container-step" style="max-width: 100% !important; width: 100% !important; padding: 10px 4px !important; min-height: auto !important;">
      <button class="btn-voltar" onclick="telaInicial()">⬅ Voltar</button>
      <h1 style="font-size:1.8em; margin-bottom:15px; text-align:center; width: 100%;">Painel Administrativo</h1>
      
      <div class="resultado-admin" style="width: 100% !important; max-width: 1200px; background: #111; border: 1px solid #ff7a00; border-radius: 12px; padding: 15px 8px; box-sizing: border-box; margin: 0 auto;">
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:15px; width: 100%; box-sizing: border-box;">
          <div>
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Categoria</label>
            <select id="categoriaProduto" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
              <option value="cpu">CPU (Processador)</option>
              <option value="placamae">Placa-Mãe</option>
              <option value="gpu">GPU (Placa de Vídeo)</option>
              <option value="ram">RAM</option>
              <option value="ssd">SSD</option>
              <option value="fonte">Fonte</option>
              <option value="gabinete">Gabinete</option>
              <option value="kit-upgrade">📦 Kit Upgrade</option>
              <option value="acessorios">🎧 Peças / Acessórios</option>
            </select>
          </div>
          <div style="grid-column: span 1; min-width:140px;">
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Nome do Produto</label>
            <input id="nomeProduto" placeholder="Ex: Ryzen 5 5600" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
          </div>
          <div>
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Socket</label>
            <input id="socketProduto" placeholder="Ex: AM4 / AM5" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
          </div>
          <div>
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Estoque</label>
            <input id="quantidadeProduto" type="number" placeholder="Qtd" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
          </div>
          <div>
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Custo (R$)</label>
            <input id="custoProduto" type="number" placeholder="Custo" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
          </div>
          <div>
            <label style="font-size:0.8em; font-weight:bold; color:#aaa; display:block; margin-bottom:4px; text-align:left;">Venda (R$)</label>
            <input id="precoProduto" type="number" placeholder="Venda" style="width:100% !important; padding:8px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; height:40px; box-sizing:border-box; margin:0;">
          </div>
        </div>

        <button id="btnSalvarProduto" class="btn-start" style="width:100% !important; margin-bottom:15px; height:44px; padding:0; font-size:16px; border-radius:8px;">Salvar Produto Manual</button>
        
        <div style="margin: 15px 0; border: 2px dashed #444; padding: 12px; border-radius: 8px; background:#111; text-align:center; box-sizing: border-box; width: 100%;">
          <label style="display:block; margin-bottom:6px; font-weight:bold; color:#fff; font-size:0.9em;">📁 Importar Catálogo Completo (Excel/Bling):</label>
          <input type="file" id="arquivoExcel" accept=".xlsx,.xls" style="color:#ccc; font-size:0.85em; margin-bottom:10px; width:100% !important;">
          <button id="btnImportarExcel" class="btn-secundario" style="width:100% !important; background:#2ecc71; color:#fff; font-weight:bold; border:none; height:38px; margin:0; font-size:14px; border-radius:6px;">Processar e Atualizar Estoque</button>
        </div>

        <button id="btnLimparBanco" class="btn-secundario" style="background:#d9534f; color:#fff; width:100% !important; border:none; margin-bottom:20px; height:38px; margin-top:0; font-size:14px; border-radius:6px;">🚨 ZERAR TODO O ESTOQUE DO SISTEMA</button>
        <hr style="border-color:#333; margin:15px 0;">
        
        <div id="listaProdutos" style="width: 100%; box-sizing: border-box;"></div>
      </div>
    </div>
  `
  document.getElementById('btnSalvarProduto').addEventListener('click', salvarProduto)
  document.getElementById('btnImportarExcel').addEventListener('click', importarExcel)
  document.getElementById('btnLimparBanco').addEventListener('click', () => {
    if (confirm("ATENÇÃO MÁXIMA:\nIsso apagará permanentemente todos os produtos salvos! Prosseguir?")) {
      localStorage.removeItem('produtos')
      renderizarProdutos()
    }
  })
  renderizarProdutos()
}

function salvarProduto() {
  const category = document.getElementById('categoriaProduto').value
  const nome = document.getElementById('nomeProduto').value.trim()
  const socket = document.getElementById('socketProduto').value.trim()
  const quantidade = parseInt(document.getElementById('quantidadeProduto').value) || 0
  const custo = parseFloat(document.getElementById('custoProduto').value) || 0
  const preco = parseFloat(document.getElementById('precoProduto').value) || 0

  if (!nome) {
    alert('Insira ao menos o nome do produto!')
    return
  }

  const produtos = obterProdutos()
  const novoProduto = {
    id: Date.now(),
    categoria: category,
    nome,
    socket,
    quantidade,
    custo,
    preco
  }

  produtos.push(novoProduto)
  localStorage.setItem('produtos', JSON.stringify(produtos))
  
  document.getElementById('nomeProduto').value = ''
  document.getElementById('socketProduto').value = ''
  document.getElementById('quantidadeProduto').value = ''
  document.getElementById('custoProduto').value = ''
  document.getElementById('precoProduto').value = ''

  alert('Produto adicionado com sucesso!')
  renderizarProdutos()
}

function renderizarProdutos() {
  const listaDiv = document.getElementById('listaProdutos')
  if (!listaDiv) return
  const produtos = obterProdutos()
  if (produtos.length === 0) {
    listaDiv.innerHTML = '<p style="color:#aaa; text-align:center;">Nenhum produto em estoque.</p>'
    return
  }
  
  listaDiv.innerHTML = `
    <table style="width:100%; border-collapse:collapse; color:#fff; font-size:0.85em; text-align:left;">
      <thead>
        <tr style="border-bottom:2px solid #ff7a00; color:#ff7a00;">
          <th style="padding:6px;">Nome</th>
          <th style="padding:6px;">Cat</th>
          <th style="padding:6px;">Qtd</th>
          <th style="padding:6px;">Venda</th>
          <th style="padding:6px; text-align:center;">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${produtos.map(p => `
          <tr style="border-bottom:1px solid #222;">
            <td style="padding:6px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.nome}</td>
            <td style="padding:6px;">${p.categoria}</td>
            <td style="padding:6px;">${p.quantidade}</td>
            <td style="padding:6px;">R$ ${Number(p.preco).toFixed(2)}</td>
            <td style="padding:6px; text-align:center;">
              <button class="btn-excluir-estoque" data-id="${p.id}" style="background:transparent; border:none; color:#ff4444; cursor:pointer; font-size:14px; padding:2px 6px;">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  document.querySelectorAll('.btn-excluir-estoque').forEach(botao => {
    botao.addEventListener('click', (e) => {
      const idParaRemover = Number(e.currentTarget.getAttribute('data-id'));
      const todosProdutos = obterProdutos();
      const itemEncontrado = todosProdutos.find(p => p.id === idParaRemover);

      if (confirm(`Deseja mesmo remover o item "${itemEncontrado ? itemEncontrado.nome : 'este produto'}" definitivamente do sistema?`)) {
        const updated = todosProdutos.filter(p => p.id !== idParaRemover);
        localStorage.setItem('produtos', JSON.stringify(updated));
        renderizarProdutos();
      }
    });
  });
}

function importarExcel() {
  const inputFile = document.getElementById('arquivoExcel')
  if (!inputFile || !inputFile.files[0]) {
    alert('Por favor, selecione um arquivo Excel primeiro.')
    return
  }

  const file = inputFile.files[0]
  const reader = new FileReader()

  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const primeiraAba = workbook.SheetNames[0]
      const planilha = workbook.Sheets[primeiraAba]
      const linhas = XLSX.utils.sheet_to_json(planilha)
      
      if (linhas.length === 0) {
        alert('A planilha importada está vazia.')
        return
      }

      const novosProdutos = linhas.map((linha, index) => {
        return {
          id: Date.now() + index,
          categoria: (linha.categoria || linha.Categoria || 'acessorios').toLowerCase().trim(),
          nome: linha.nome || linha.Nome || linha.descricao || linha.Descrição || 'Produto sem Nome',
          socket: (linha.socket || linha.Socket || '').toUpperCase().trim(),
          quantidade: parseInt(linha.quantidade || linha.Quantidade || linha.estoque || 0),
          custo: parseFloat(linha.custo || linha.Custo || 0),
          preco: parseFloat(linha.preco || linha.Preco || linha.venda || linha.Venda || 0)
        }
      })

      localStorage.setItem('produtos', JSON.stringify(novosProdutos))
      alert(`Sucesso! ${novosProdutos.length} produtos carregados no sistema.`);
      renderizarProdutos()
      
    } catch (erro) {
      console.error(erro)
      alert('Erro ao processar o arquivo Excel. Verifique o cabeçalho das colunas.')
    }
  }

  reader.readAsArrayBuffer(file)
}

telaInicial()
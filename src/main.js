import './style.css'

const app = document.querySelector('#app')

// Objeto global atualizado para salvar as escolhas do usuário
const configuracao = {
  perfil: '',
  cpu: null,
  placaMae: null,
  gpu: null,
  ram: null,
  ssd: null,
  gabinete: null,
  nome: '',
  telefone: '',
  cidade: ''
}

// Suas listas originais de peças e preços
const cpus = [
  {
    nome: 'Ryzen 5 5600',
    venda: 750,
    custo: 650,
    socket: 'AM4'
  },
  {
    nome: 'Ryzen 7 7800X3D',
    venda: 2800,
    custo: 2500,
    socket: 'AM5'
  },
  {
    nome: 'Intel Core i5 14400F',
    venda: 1400,
    custo: 1250,
    socket: 'LGA1700'
  }
]

const placasMae = [
  {
    nome: 'B550M AM4',
    venda: 750,
    custo: 650,
    socket: 'AM4'
  },
  {
    nome: 'B650M AM5',
    venda: 1200,
    custo: 1050,
    socket: 'AM5'
  },
  {
    nome: 'B760M',
    venda: 950,
    custo: 850,
    socket: 'LGA1700'
  }
]

const gpus = [
  { nome: 'RTX 4060', venda: 1900, custo: 1750 },
  { nome: 'RTX 5060', venda: 2600, custo: 2400 },
  { nome: 'RTX 5070', venda: 4200, custo: 3900 }
]

const rams = [
  { nome: '16GB DDR4', venda: 300, custo: 220 },
  { nome: '32GB DDR4', venda: 550, custo: 450 }
]

const ssds = [
  { nome: '500GB NVMe', venda: 250, custo: 180 },
  { nome: '1TB NVMe', venda: 450, custo: 350 }
]

const gabinetes = [
  { nome: 'Básico', venda: 180, custo: 120 },
  { nome: 'RGB Gamer', venda: 350, custo: 250 }
]

// Inicia o aplicativo na tela inicial
telaInicial()

function telaInicial() {
  app.innerHTML = `
  <div class="hero">
    <img src="/logo.png" class="logo" alt="Leal Tech">
    <h1>
      MONTE SEU COMPUTADOR
      <span>COM OS MELHORES PREÇOS</span>
    </h1>
    <button id="btn-orcamento" class="btn-start">
      🚀 INICIAR ORÇAMENTO
    </button>
  </div>
  `

  document
    .getElementById('btn-orcamento')
    .addEventListener('click', telaPerfis)
}

function telaPerfis() {
  app.innerHTML = `
  <div class="container-step">
    <h1>Qual será o uso do computador?</h1>
    <p class="subtitulo-uso">
      Escolha o perfil que mais combina com sua necessidade
    </p>

    <div class="categorias">
      <div class="card perfil" data-tipo="gamer">
        <h3>🎮 Gamer</h3>
        <p>Jogos competitivos e AAA</p>
        <span class="preco-card">A partir de R$ 2.999</span>
      </div>

      <div class="card perfil" data-tipo="estudos">
        <h3>📚 Estudos</h3>
        <p>Faculdade e cursos</p>
        <span class="preco-card">A partir de R$ 2.499</span>
      </div>

      <div class="card perfil" data-tipo="trabalho">
        <h3>💼 Trabalho</h3>
        <p>Escritório e produtividade</p>
        <span class="preco-card">A partir de R$ 3.499</span>
      </div>

      <div class="card perfil" data-tipo="upgrade">
        <h3>⚡ Kit Upgrade</h3>
        <p>Processador + Placa-mãe + Memória</p>
        <span class="preco-card">A partir de R$ 1.299</span>
      </div>
    </div>

    <button id="voltarPerfil" class="btn-secundario">
      ← Voltar
    </button>
  </div>
  `

  document.querySelectorAll('.perfil').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.perfil = card.dataset.tipo
      telaCpu()
    })
  })

  document
    .getElementById('voltarPerfil')
    .addEventListener('click', telaInicial)
}

// --- ETAPA 1: CPU ---
function telaCpu() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha o Processador</h1>
      <div class="categorias">
        ${cpus.map((cpu, i) => `
          <div class="card cpu" data-id="${i}">
            <h3>${cpu.nome}</h3>
            <span class="preco-card">R$ ${cpu.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.cpu').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.cpu = cpus[card.dataset.id]
      telaPlacaMae()
    })
  })
}

// --- ETAPA 1B: PLACA-MÃE ---
function telaPlacaMae() {
  const platesCompativeis = placasMae.filter(
    placa => placa.socket === configuracao.cpu.socket
  )

  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha a Placa-Mãe</h1>
      <p class="subtitulo-uso">Exibindo modelos compatíveis com o socket ${configuracao.cpu.socket}</p>
      <div class="categorias">
        ${platesCompativeis.map((placa, i) => `
          <div class="card placa-mae" data-id="${i}">
            <h3>${placa.nome}</h3>
            <span class="preco-card">R$ ${placa.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.placa-mae').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.placaMae = platesCompativeis[card.dataset.id]
      telaGpu()
    })
  })
}

// --- ETAPA 2: GPU ---
function telaGpu() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha a Placa de Vídeo</h1>
      <div class="categorias">
        ${gpus.map((gpu, i) => `
          <div class="card gpu" data-id="${i}">
            <h3>${gpu.nome}</h3>
            <span class="preco-card">R$ ${gpu.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.gpu').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.gpu = gpus[card.dataset.id]
      telaRam()
    })
  })
}

// --- ETAPA 3: RAM ---
function telaRam() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha a Memória RAM</h1>
      <div class="categorias">
        ${rams.map((ram, i) => `
          <div class="card ram" data-id="${i}">
            <h3>${ram.nome}</h3>
            <span class="preco-card">R$ ${ram.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.ram').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.ram = rams[card.dataset.id]
      telaSsd()
    })
  })
}

// --- ETAPA 4: SSD ---
function telaSsd() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha o Armazenamento</h1>
      <div class="categorias">
        ${ssds.map((ssd, i) => `
          <div class="card ssd" data-id="${i}">
            <h3>${ssd.nome}</h3>
            <span class="preco-card">R$ ${ssd.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.ssd').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.ssd = ssds[card.dataset.id]
      telaGabinete()
    })
  })
}

// --- ETAPA 5: GABINETE ---
function telaGabinete() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Escolha o Gabinete</h1>
      <div class="categorias">
        ${gabinetes.map((gabinete, i) => `
          <div class="card gabinete" data-id="${i}">
            <h3>${gabinete.nome}</h3>
            <span class="preco-card">R$ ${gabinete.venda}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.querySelectorAll('.gabinete').forEach(card => {
    card.addEventListener('click', () => {
      configuracao.gabinete = gabinetes[card.dataset.id]
      telaDadosCliente() // CORREÇÃO: Chama a tela de dados após o gabinete
    })
  })
}

// --- ETAPA 6: DADOS DO CLIENTE (Separada corretamente no escopo global) ---
function telaDadosCliente() {
  app.innerHTML = `
    <div class="container-step">
      <h1>Seus Dados</h1>

      <div class="resultado">
        <input
          id="nome"
          type="text"
          placeholder="Nome Completo"
        >

        <input
          id="telefone"
          type="text"
          placeholder="WhatsApp"
        >

        <input
          id="cidade"
          type="text"
          placeholder="Cidade"
        >

        <button id="continuar" class="btn-start">
          Continuar
        </button>
      </div>
    </div>
  `

  document.getElementById('continuar').addEventListener('click', () => {
    configuracao.nome = document.getElementById('nome').value
    configuracao.telefone = document.getElementById('telefone').value
    configuracao.cidade = document.getElementById('cidade').value

    telaResumo()
  })
}

// --- TELA DE RESUMO FINAL ---
function telaResumo() {
  const venda =
    configuracao.cpu.venda +
    configuracao.placaMae.venda +
    configuracao.gpu.venda +
    configuracao.ram.venda +
    configuracao.ssd.venda +
    configuracao.gabinete.venda

  const mensagemWhatsApp = encodeURIComponent(`
🖥️ NOVO ORÇAMENTO LEAL TECH

👤 Cliente:
Nome: ${configuracao.nome}
Telefone: ${configuracao.telefone}
Cidade: ${configuracao.cidade}

🎮 Perfil:
${configuracao.perfil.toUpperCase()}

Processador: ${configuracao.cpu.nome}
Placa-Mãe: ${configuracao.placaMae.nome}
Placa de Vídeo: ${configuracao.gpu.nome}
Memória RAM: ${configuracao.ram.nome}
Armazenamento: ${configuracao.ssd.nome}
Gabinete: ${configuracao.gabinete.nome}

💰 Total:
${venda.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})}
`)

  app.innerHTML = `
    <div class="container-step">
      <h1>Configuração Escolhida</h1>

      <div class="resultado">
        <h2>Seu Computador Customizado</h2>

        <div class="specs">
          <div class="spec-item">✓ <b>Processador:</b> ${configuracao.cpu.nome}</div>
          <div class="spec-item">✓ <b>Placa-Mãe:</b> ${configuracao.placaMae.nome}</div>
          <div class="spec-item">✓ <b>Placa de Vídeo:</b> ${configuracao.gpu.nome}</div>
          <div class="spec-item">✓ <b>Memória RAM:</b> ${configuracao.ram.nome}</div>
          <div class="spec-item">✓ <b>Armazenamento:</b> ${configuracao.ssd.nome}</div>
          <div class="spec-item">✓ <b>Gabinete:</b> ${configuracao.gabinete.nome}</div>
        </div>

        <div class="preco">
          R$ ${venda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div class="botoes">
          <a
            class="btn-whatsapp"
            href="https://wa.me/5521971301860?text=${mensagemWhatsApp}"
            target="_blank"
          >
            📲 Enviar Orçamento no WhatsApp
          </a>

          <button id="reiniciar" class="btn-start">
            🔄 Montar Outro PC
          </button>
        </div>
      </div>
    </div>
  `

  document.getElementById('reiniciar').addEventListener('click', () => {
    // Reseta todo o objeto, incluindo os novos campos de contato
    configuracao.perfil = ''
    configuracao.cpu = null
    configuracao.placaMae = null
    configuracao.gpu = null
    configuracao.ram = null
    configuracao.ssd = null
    configuracao.gabinete = null
    configuracao.nome = ''
    configuracao.telefone = ''
    configuracao.cidade = ''
    telaInicial()
  })
}
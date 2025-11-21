/**
 * EROWATCH - HISTÓRICO DE MEDIÇÕES
 * Página de visualização e filtro de dados históricos
 */

// Variáveis globais
let todasMedicoes = [];
let medicoesFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 20;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📊 Carregando histórico de medições...');
  
  // Carregar lista de sensores para o filtro
  await carregarSensoresFiltro();
  
  // Carregar medições
  await carregarMedicoes();
  
  // Configurar data padrão (últimas 24h)
  configurarDatasDefault();
});

// ============================================
// CARREGAR DADOS
// ============================================

/**
 * Carregar sensores para o filtro
 */
async function carregarSensoresFiltro() {
  try {
    const sensores = await window.EroWatchAPI.buscarSensores();
    const select = document.getElementById('filterSensor');
    
    sensores.forEach(sensor => {
      const option = document.createElement('option');
      option.value = sensor.id;
      option.textContent = `${sensor.identificador} - ${sensor.regiao}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar sensores:', error);
  }
}

/**
 * Carregar todas as medições
 */
async function carregarMedicoes() {
  try {
    mostrarLoading(true);
    
    // Buscar últimas 500 medições
    todasMedicoes = await window.EroWatchAPI.buscarMedicoesRecentes(500);
    medicoesFiltradas = [...todasMedicoes];
    
    console.log(`✅ ${todasMedicoes.length} medições carregadas`);
    
    renderizarTabela();
    mostrarLoading(false);
    
  } catch (error) {
    console.error('Erro ao carregar medições:', error);
    mostrarErro();
  }
}

// ============================================
// RENDERIZAÇÃO
// ============================================

/**
 * Renderizar tabela com paginação
 */
function renderizarTabela() {
  const tbody = document.getElementById('measurementsBody');
  tbody.innerHTML = '';
  
  if (medicoesFiltradas.length === 0) {
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('noData').style.display = 'block';
    return;
  }
  
  document.getElementById('tableContainer').style.display = 'block';
  document.getElementById('noData').style.display = 'none';
  
  // Calcular índices da página atual
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const medicoesPagina = medicoesFiltradas.slice(inicio, fim);
  
  // Renderizar linhas
  medicoesPagina.forEach(medicao => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatarData(medicao.timestamp)}</td>
      <td>${medicao.sensores?.identificador || `Sensor ${medicao.sensor_id}`}</td>
      <td>${medicao.umidade_solo?.toFixed(1) || '-'}%</td>
      <td>${medicao.temperatura_solo?.toFixed(1) || '-'}°C</td>
      <td>${medicao.umidade_ar?.toFixed(1) || '-'}%</td>
      <td>${medicao.temperatura_ar?.toFixed(1) || '-'}°C</td>
      <td>${medicao.inclinacao_graus?.toFixed(1) || '-'}°</td>
      <td><span class="badge badge-${medicao.nivel_risco.toLowerCase()}">${medicao.nivel_risco}</span></td>
      <td>${medicao.alerta_chuva ? '🌧️ Sim' : '☀️ Não'}</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Atualizar paginação
  atualizarPaginacao();
}

/**
 * Atualizar controles de paginação
 */
function atualizarPaginacao() {
  const totalPaginas = Math.ceil(medicoesFiltradas.length / itensPorPagina);
  
  document.getElementById('pageInfo').textContent = 
    `Página ${paginaAtual} de ${totalPaginas} (${medicoesFiltradas.length} registros)`;
  
  document.getElementById('prevPage').disabled = paginaAtual === 1;
  document.getElementById('nextPage').disabled = paginaAtual >= totalPaginas;
}

// ============================================
// FILTROS
// ============================================

/**
 * Aplicar filtros
 */
function aplicarFiltros() {
  const sensorId = document.getElementById('filterSensor').value;
  const nivelRisco = document.getElementById('filterRisco').value;
  const dataInicio = document.getElementById('filterDataInicio').value;
  const dataFim = document.getElementById('filterDataFim').value;
  
  medicoesFiltradas = todasMedicoes.filter(medicao => {
    // Filtro por sensor
    if (sensorId && medicao.sensor_id != sensorId) return false;
    
    // Filtro por risco
    if (nivelRisco && medicao.nivel_risco !== nivelRisco) return false;
    
    // Filtro por data início
    if (dataInicio) {
      const dataInicioDate = new Date(dataInicio);
      const medicaoDate = new Date(medicao.timestamp);
      if (medicaoDate < dataInicioDate) return false;
    }
    
    // Filtro por data fim
    if (dataFim) {
      const dataFimDate = new Date(dataFim);
      const medicaoDate = new Date(medicao.timestamp);
      if (medicaoDate > dataFimDate) return false;
    }
    
    return true;
  });
  
  paginaAtual = 1;
  renderizarTabela();
  
  console.log(`🔍 Filtros aplicados: ${medicoesFiltradas.length} resultados`);
}

/**
 * Limpar todos os filtros
 */
function limparFiltros() {
  document.getElementById('filterSensor').value = '';
  document.getElementById('filterRisco').value = '';
  document.getElementById('filterDataInicio').value = '';
  document.getElementById('filterDataFim').value = '';
  
  medicoesFiltradas = [...todasMedicoes];
  paginaAtual = 1;
  renderizarTabela();
  
  console.log('🗑️ Filtros limpos');
}

/**
 * Configurar datas padrão (últimas 24h)
 */
function configurarDatasDefault() {
  const agora = new Date();
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  
  document.getElementById('filterDataFim').value = formatarDataInput(agora);
  document.getElementById('filterDataInicio').value = formatarDataInput(ontem);
}

// ============================================
// PAGINAÇÃO
// ============================================

/**
 * Mudar página
 */
function mudarPagina(direcao) {
  const totalPaginas = Math.ceil(medicoesFiltradas.length / itensPorPagina);
  
  paginaAtual += direcao;
  
  if (paginaAtual < 1) paginaAtual = 1;
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  
  renderizarTabela();
  
  // Scroll para o topo da tabela
  document.querySelector('.measurements-table').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// EXPORTAÇÃO
// ============================================

/**
 * Exportar dados para CSV
 */
function exportarCSV() {
  if (medicoesFiltradas.length === 0) {
    alert('Nenhum dado para exportar!');
    return;
  }
  
  // Cabeçalho do CSV
  let csv = 'Data/Hora,Sensor,Umidade Solo (%),Temp. Solo (°C),Umidade Ar (%),Temp. Ar (°C),Inclinação (°),Nível Risco,Alerta Chuva\n';
  
  // Adicionar linhas
  medicoesFiltradas.forEach(m => {
    const linha = [
      formatarData(m.timestamp),
      m.sensores?.identificador || `Sensor ${m.sensor_id}`,
      m.umidade_solo?.toFixed(2) || '',
      m.temperatura_solo?.toFixed(2) || '',
      m.umidade_ar?.toFixed(2) || '',
      m.temperatura_ar?.toFixed(2) || '',
      m.inclinacao_graus?.toFixed(2) || '',
      m.nivel_risco,
      m.alerta_chuva ? 'Sim' : 'Não'
    ];
    csv += linha.join(',') + '\n';
  });
  
  // Criar arquivo e fazer download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dataHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `erowatch_medicoes_${dataHora}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`📥 CSV exportado: ${medicoesFiltradas.length} registros`);
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Formatar data para exibição
 */
function formatarData(timestamp) {
  const data = new Date(timestamp);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Formatar data para input datetime-local
 */
function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

/**
 * Mostrar/ocultar loading
 */
function mostrarLoading(mostrar) {
  document.getElementById('loadingIndicator').style.display = mostrar ? 'block' : 'none';
  document.getElementById('tableContainer').style.display = mostrar ? 'none' : 'block';
}

/**
 * Mostrar mensagem de erro
 */
function mostrarErro() {
  document.getElementById('loadingIndicator').innerHTML = 
    '❌ Erro ao carregar dados. Verifique se o backend está rodando.';
}
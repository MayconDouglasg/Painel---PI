/**
 * GESTÃO DE ALERTAS
 */

let alertasCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarAlertas();
    
    document.getElementById('formResolver').addEventListener('submit', confirmarAcao);
});

/**
 * Carregar Alertas
 */
async function carregarAlertas() {
    const tbody = document.getElementById('listaAlertas');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

    const status = document.getElementById('filtroStatus').value;
    const criticidade = document.getElementById('filtroCriticidade').value;

    let url = `${API_URL}/alertas/historico?limite=50`; 
    
    if (status === 'ativo') {
        url = `${API_URL}/alertas/ativos`;
    } else {
        url = `${API_URL}/alertas/historico?limite=100`;
    }

    try {
        const response = await fetch(url, {
            headers: Auth.getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
            let lista = data.alertas || [];
            
            if (status !== 'ativo') {
                lista = lista.filter(a => a.status === status);
            }
            
            if (criticidade) {
                lista = lista.filter(a => a.nivel_criticidade === criticidade);
            }

            alertasCache = lista;
            renderizarTabela(lista);
            atualizarStats(lista);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro de conexão</td></tr>';
    }
}

function renderizarTabela(alertas) {
    const tbody = document.getElementById('listaAlertas');
    tbody.innerHTML = '';

    if (alertas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum alerta encontrado</td></tr>';
        return;
    }

    alertas.forEach(alerta => {
        const tr = document.createElement('tr');
        
        if (alerta.status === 'ativo') {
            if (alerta.nivel_criticidade === 'CRITICO') tr.classList.add('row-danger');
            if (alerta.nivel_criticidade === 'ALTO') tr.classList.add('row-warning');
        } else {
            tr.classList.add('row-muted');
        }

        const sensorInfo = alerta.sensores ? `${alerta.sensores.identificador} (${alerta.sensores.regiao})` : `Sensor #${alerta.sensor_id}`;

        let acoes = '';
        if (alerta.status === 'ativo') {
            acoes = `
                <button class="btn-sm btn-primary" onclick="abrirModalResolver(${alerta.id}, 'resolver')" title="Resolver"><span class="material-icons">check</span></button>
                <button class="btn-sm btn-secondary" onclick="abrirModalResolver(${alerta.id}, 'ignorar')" title="Ignorar (Falso Positivo)"><span class="material-icons">block</span></button>
            `;
        } else {
            acoes = `<span class="badge badge-secondary">${alerta.status.toUpperCase()}</span>`;
        }

        tr.innerHTML = `
            <td>${formatarData(alerta.timestamp)}</td>
            <td>${sensorInfo}</td>
            <td>${formatarTipo(alerta.tipo_alerta)}</td>
            <td><span class="status-badge status-${alerta.nivel_criticidade.toLowerCase()}">${alerta.nivel_criticidade}</span></td>
            <td>${alerta.mensagem}</td>
            <td>${acoes}</td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarStats(alertas) {
    const criticos = alertas.filter(a => a.status === 'ativo' && a.nivel_criticidade === 'CRITICO').length;
    const altos = alertas.filter(a => a.status === 'ativo' && a.nivel_criticidade === 'ALTO').length;

    document.getElementById('statCriticos').textContent = criticos;
    document.getElementById('statAltos').textContent = altos;
}

/**
 * Modal Resolver/Ignorar
 */
function abrirModalResolver(id, acao) {
    const modal = document.getElementById('modalResolver');
    const alerta = alertasCache.find(a => a.id === id);
    
    if (!alerta) return;

    document.getElementById('resolverId').value = id;
    document.getElementById('acaoTipo').value = acao;
    
    const titulo = acao === 'resolver' ? 'Resolver Alerta' : 'Ignorar Alerta (Falso Positivo)';
    modal.querySelector('h2').textContent = titulo;
    
    const btn = document.getElementById('btnConfirmarAcao');
    btn.textContent = acao === 'resolver' ? 'Marcar como Resolvido' : 'Ignorar Alerta';
    btn.className = acao === 'resolver' ? 'btn-primary' : 'btn-danger';

    document.getElementById('alertaInfo').textContent = `${alerta.tipo_alerta}: ${alerta.mensagem}`;
    document.getElementById('resolverObs').value = '';

    modal.classList.add('show');
}

function fecharModalResolver() {
    document.getElementById('modalResolver').classList.remove('show');
}

async function confirmarAcao(e) {
    e.preventDefault();
    
    const id = document.getElementById('resolverId').value;
    const acao = document.getElementById('acaoTipo').value;
    const obs = document.getElementById('resolverObs').value;
    const user = JSON.parse(localStorage.getItem('eroswatch_user') || '{}');

    const endpoint = acao === 'resolver' ? 'resolver' : 'ignorar';
    const body = {
        [acao === 'resolver' ? 'resolvido_por' : 'ignorado_por']: user.nome || 'Admin',
        [acao === 'resolver' ? 'observacoes' : 'motivo']: obs
    };

    try {
        const response = await fetch(`${API_URL}/alertas/${id}/${endpoint}`, {
            method: 'PUT',
            headers: Auth.getAuthHeader(),
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alert(`Alerta ${acao === 'resolver' ? 'resolvido' : 'ignorado'} com sucesso!`);
            fecharModalResolver();
            carregarAlertas();
        } else {
            const result = await response.json();
            alert('Erro: ' + (result.error || 'Falha na operação'));
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

// Helpers
function formatarTipo(tipo) {
    return tipo.replace(/_/g, ' ');
}

function formatarData(dataISO) {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleDateString('pt-BR') + ' ' + new Date(dataISO).toLocaleTimeString('pt-BR');
}

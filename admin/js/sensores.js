/**
 * GESTÃO DE SENSORES
 */

let sensoresCache = [];
let tiposSoloCache = {};

document.addEventListener('DOMContentLoaded', () => {
    carregarSensores();
    carregarTiposSolo();
    
    document.getElementById('formSensor').addEventListener('submit', salvarSensor);
    document.getElementById('formCalibracao').addEventListener('submit', salvarCalibracao);
});

/**
 * Carregar Tipos de Solo (para os selects)
 */
async function carregarTiposSolo() {
    try {
        const response = await fetch(`${API_URL}/config/solos`, {
            headers: Auth.getAuthHeader()
        });
        const data = await response.json();
        
        if (data.success) {
            tiposSoloCache = {};
            const selects = [document.getElementById('tipo_solo'), document.getElementById('calibTipoSolo')];
            
            // Limpar e repopular selects
            selects.forEach(select => {
                if (!select) return;
                select.innerHTML = '<option value="">Selecione...</option>';
                
                data.tipos_solo.forEach(solo => {
                    // Cache para uso posterior
                    tiposSoloCache[solo.nome] = solo;
                    
                    const option = document.createElement('option');
                    option.value = solo.nome;
                    option.textContent = solo.nome;
                    select.appendChild(option);
                });
            });
        }
    } catch (error) {
        console.error("Erro ao carregar tipos de solo:", error);
    }
}

/**
 * Carregar Sensores
 */
async function carregarSensores() {
    const tbody = document.getElementById('listaSensores');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/sensores`, {
            headers: Auth.getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
            sensoresCache = data.sensores;
            renderizarTabela(sensoresCache);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro de conexão</td></tr>';
    }
}

function renderizarTabela(sensores) {
    const tbody = document.getElementById('listaSensores');
    tbody.innerHTML = '';

    if (sensores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum sensor encontrado</td></tr>';
        return;
    }

    sensores.forEach(sensor => {
        const tr = document.createElement('tr');
        
        // Status Badge
        const statusClass = `status-${sensor.status}`;
        
        // Última leitura
        const ultimaLeitura = sensor.ultima_leitura 
            ? new Date(sensor.ultima_leitura).toLocaleString('pt-BR') 
            : '-';

        tr.innerHTML = `
            <td>${sensor.identificador}</td>
            <td>${sensor.regiao}</td>
            <td>${sensor.tipo.toUpperCase()}</td>
            <td><span class="status-badge ${statusClass}">${sensor.status.toUpperCase()}</span></td>
            <td>${ultimaLeitura}</td>
            <td>
                <button class="btn-sm btn-secondary" onclick="abrirModalSensor('${sensor.id}')" title="Editar"><span class="material-icons">edit</span></button>
                <button class="btn-sm btn-primary" onclick="abrirModalCalibracao('${sensor.id}')" title="Calibrar"><span class="material-icons">build</span></button>
                <button class="btn-sm btn-danger" onclick="deletarSensor('${sensor.id}')" title="Desativar"><span class="material-icons">delete</span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Filtragem
 */
function filtrarSensores() {
    const termo = document.getElementById('buscaSensor').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;

    const filtrados = sensoresCache.filter(sensor => {
        const matchTermo = sensor.identificador.toLowerCase().includes(termo) || 
                          sensor.regiao.toLowerCase().includes(termo);
        const matchStatus = status === 'todos' || sensor.status === status;
        
        return matchTermo && matchStatus;
    });

    renderizarTabela(filtrados);
}

/**
 * Modal Adicionar/Editar
 */
function abrirModalSensor(id = null) {
    const modal = document.getElementById('modalSensor');
    const form = document.getElementById('formSensor');
    const title = document.getElementById('modalTitle');

    if (id) {
    const sensor = sensoresCache.find(s => s.id == id);
        if (!sensor) return;

        document.getElementById('sensorId').value = sensor.id;
        document.getElementById('identificador').value = sensor.identificador;
        document.getElementById('tipo').value = sensor.tipo;
        document.getElementById('regiao').value = sensor.regiao;
        document.getElementById('latitude').value = sensor.latitude || '';
        document.getElementById('longitude').value = sensor.longitude || '';
        document.getElementById('responsavel').value = sensor.responsavel || '';
        
        // Campos opcionais de solo
        document.getElementById('tipo_solo').value = sensor.tipo_solo || '';
        document.getElementById('saturacao_critica').value = sensor.saturacao_critica || '';

        title.textContent = 'Editar Sensor';
    } else {
        form.reset();
        document.getElementById('sensorId').value = '';
        title.textContent = 'Novo Sensor';
    }

    modal.classList.add('show');
}

function fecharModalSensor() {
    document.getElementById('modalSensor').classList.remove('show');
}

async function salvarSensor(e) {
    e.preventDefault();
    
    const id = document.getElementById('sensorId').value;
    const dados = {
        identificador: document.getElementById('identificador').value,
        tipo: document.getElementById('tipo').value,
        regiao: document.getElementById('regiao').value,
        latitude: document.getElementById('latitude').value || null,
        longitude: document.getElementById('longitude').value || null,
        responsavel: document.getElementById('responsavel').value,
        tipo_solo: document.getElementById('tipo_solo').value || null,
        saturacao_critica: document.getElementById('saturacao_critica').value || null
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/sensores/${id}` : `${API_URL}/sensores`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: Auth.getAuthHeader(),
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert('Sensor salvo com sucesso!');
            fecharModalSensor();
            carregarSensores();
        } else {
            const result = await response.json();
            alert('Erro: ' + (result.error || 'Falha ao salvar'));
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

/**
 * Deletar Sensor
 */
async function deletarSensor(id) {
    if (!confirm('Tem certeza que deseja desativar este sensor?')) return;

    try {
        const response = await fetch(`${API_URL}/sensores/${id}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeader()
        });

        if (response.ok) {
            carregarSensores();
        } else {
            alert('Erro ao deletar sensor');
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

/**
 * Calibração
 */
function abrirModalCalibracao(id) {
    const sensor = sensoresCache.find(s => s.id == id);
    if (!sensor) return;

    document.getElementById('calibSensorId').value = id;
    
    // Preencher com valores atuais ou defaults
    // Se o sensor já tem valores customizados, usa eles.
    // Se não, tenta pegar do tipo de solo.
    
    const tipoSolo = sensor.tipo_solo || 'ARENOSO'; // Default
    document.getElementById('calibTipoSolo').value = tipoSolo;
    
    // Se o sensor tem valores explícitos, usa eles
    if (sensor.saturacao_critica) {
        document.getElementById('calibSatCrit').value = sensor.saturacao_critica;
        document.getElementById('calibSatTotal').value = sensor.saturacao_total || 100;
        document.getElementById('calibAngulo').value = sensor.angulo_atrito_critico || 30;
        document.getElementById('calibCoesao').value = sensor.coeficiente_coesao || 0;
    } else {
        // Senão carrega defaults do tipo de solo
        atualizarDefaultsSolo();
    }
    
    atualizarValoresCalib();
    document.getElementById('modalCalibracao').classList.add('show');
}

function fecharModalCalibracao() {
    document.getElementById('modalCalibracao').classList.remove('show');
}

function atualizarDefaultsSolo() {
    const tipo = document.getElementById('calibTipoSolo').value;
    const params = tiposSoloCache[tipo];

    if (params) {
        document.getElementById('calibSatCrit').value = params.saturacao_critica;
        document.getElementById('calibSatTotal').value = params.saturacao_total;
        document.getElementById('calibAngulo').value = params.angulo_atrito_critico;
        document.getElementById('calibCoesao').value = params.coeficiente_coesao;
        atualizarValoresCalib();
    }
}

function atualizarValoresCalib() {
    document.getElementById('valSatCrit').textContent = document.getElementById('calibSatCrit').value + '%';
    document.getElementById('valSatTotal').textContent = document.getElementById('calibSatTotal').value + '%';
    document.getElementById('valAngulo').textContent = document.getElementById('calibAngulo').value + '°';
    document.getElementById('valCoesao').textContent = document.getElementById('calibCoesao').value;
}

async function salvarCalibracao(e) {
    e.preventDefault();
    
    const id = document.getElementById('calibSensorId').value;
    const dados = {
        tipo_solo: document.getElementById('calibTipoSolo').value,
        saturacao_critica: parseFloat(document.getElementById('calibSatCrit').value),
        saturacao_total: parseFloat(document.getElementById('calibSatTotal').value),
        angulo_atrito_critico: parseFloat(document.getElementById('calibAngulo').value),
        coeficiente_coesao: parseFloat(document.getElementById('calibCoesao').value),
        motivo: document.getElementById('calibMotivo').value
    };

    try {
        const response = await fetch(`${API_URL}/sensores/${id}/calibrar`, {
            method: 'POST',
            headers: Auth.getAuthHeader(),
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert('Calibração aplicada com sucesso!');
            fecharModalCalibracao();
            carregarSensores(); // Recarregar para atualizar dados na tabela se necessário
        } else {
            const result = await response.json();
            alert('Erro: ' + (result.error || 'Falha na calibração'));
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

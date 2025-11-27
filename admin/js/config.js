/**
 * GESTÃO DE CONFIGURAÇÕES (TIPOS DE SOLO)
 */

let solosCache = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarSolos();
    document.getElementById('formSolo').addEventListener('submit', salvarSolo);
});

/**
 * Carregar Tipos de Solo
 */
async function carregarSolos() {
    const tbody = document.getElementById('listaSolos');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/config/solos`, {
            headers: Auth.getAuthHeader()
        });
        const data = await response.json();

        if (data.success) {
            solosCache = data.tipos_solo;
            renderizarTabelaSolos(solosCache);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro de conexão</td></tr>';
    }
}

function renderizarTabelaSolos(solos) {
    const tbody = document.getElementById('listaSolos');
    tbody.innerHTML = '';

    if (solos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum tipo de solo cadastrado</td></tr>';
        return;
    }

    solos.forEach(solo => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${solo.nome}</strong></td>
            <td>${solo.saturacao_critica}%</td>
            <td>${solo.saturacao_total}%</td>
            <td>${solo.angulo_atrito_critico}°</td>
            <td>${solo.coeficiente_coesao}</td>
            <td>
                <button class="btn-sm btn-secondary" onclick="abrirModalSolo('${solo.id}')"><span class="material-icons">edit</span></button>
                <button class="btn-sm btn-danger" onclick="deletarSolo('${solo.id}')"><span class="material-icons">delete</span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Modal Adicionar/Editar
 */
function abrirModalSolo(id = null) {
    const modal = document.getElementById('modalSolo');
    const form = document.getElementById('formSolo');
    const title = document.getElementById('modalSoloTitle');

    if (id) {
        const solo = solosCache.find(s => s.id == id);
        if (!solo) return;

        document.getElementById('soloId').value = solo.id;
        document.getElementById('soloNome').value = solo.nome;
        document.getElementById('soloSaturacaoCritica').value = solo.saturacao_critica;
        document.getElementById('soloSaturacaoTotal').value = solo.saturacao_total;
        document.getElementById('soloAngulo').value = solo.angulo_atrito_critico;
        document.getElementById('soloCoesao').value = solo.coeficiente_coesao;

        title.textContent = 'Editar Tipo de Solo';
    } else {
        form.reset();
        document.getElementById('soloId').value = '';
        title.textContent = 'Novo Tipo de Solo';
    }

    modal.classList.add('show');
}

function fecharModalSolo() {
    document.getElementById('modalSolo').classList.remove('show');
}

async function salvarSolo(e) {
    e.preventDefault();
    
    const id = document.getElementById('soloId').value;
    const dados = {
        nome: document.getElementById('soloNome').value.toUpperCase(),
        saturacao_critica: parseFloat(document.getElementById('soloSaturacaoCritica').value),
        saturacao_total: parseFloat(document.getElementById('soloSaturacaoTotal').value),
        angulo_atrito_critico: parseFloat(document.getElementById('soloAngulo').value),
        coeficiente_coesao: parseFloat(document.getElementById('soloCoesao').value)
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/config/solos/${id}` : `${API_URL}/config/solos`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: Auth.getAuthHeader(),
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert('Tipo de solo salvo com sucesso!');
            fecharModalSolo();
            carregarSolos();
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
 * Deletar Solo
 */
async function deletarSolo(id) {
    if (!confirm('Tem certeza que deseja excluir este tipo de solo?')) return;

    try {
        const response = await fetch(`${API_URL}/config/solos/${id}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeader()
        });

        if (response.ok) {
            carregarSolos();
        } else {
            alert('Erro ao deletar tipo de solo');
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

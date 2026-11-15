// =========================================================================
// 1. CONSUMO DE ROTAS DE API REST (SÉRIES TEMPORAIS DO BANCO EM NUVEM)
// =========================================================================
const API_BASE_URL = "https://api.ecopulse-urbano.com.br/v1";

// Conjunto de séries temporais retornadas pelo endpoint GET /stations/{id}/timeseries
const MOCK_TIMESERIES_DB = {
    "EP-SP-VM01": {
        sponsor: "Patrocínio ESG: Padaria Artesanal Sol Ltda.",
        iqar: "32 — Boa",
        iqarClass: "status-good",
        pm25: "14.2 µg/m³",
        co2: "438 ppm",
        noise: "54.8 dB(A)",
        labels: ["00h", "04h", "08h", "12h", "16h", "20h"],
        pm25Series: [10.5, 9.8, 16.4, 15.1, 17.8, 14.2],
        noiseSeries: [44.0, 42.5, 58.2, 61.0, 59.4, 54.8]
    },
    "EP-SP-PI02": {
        sponsor: "Patrocínio ESG: Coworking Verde Pinheiros",
        iqar: "58 — Moderada",
        iqarClass: "status-warn",
        pm25: "27.6 µg/m³",
        co2: "512 ppm",
        noise: "66.4 dB(A)",
        labels: ["00h", "04h", "08h", "12h", "16h", "20h"],
        pm25Series: [15.2, 14.0, 29.5, 31.2, 33.8, 27.6],
        noiseSeries: [49.5, 47.0, 68.4, 71.2, 72.0, 66.4]
    },
    "EP-SP-IT03": {
        sponsor: "Patrocínio ESG: Supermercados Leste Sustentável",
        iqar: "46 — Moderada",
        iqarClass: "status-warn",
        pm25: "22.1 µg/m³",
        co2: "485 ppm",
        noise: "62.1 dB(A)",
        labels: ["00h", "04h", "08h", "12h", "16h", "20h"],
        pm25Series: [13.0, 12.1, 24.8, 23.5, 25.9, 22.1],
        noiseSeries: [46.2, 45.0, 64.5, 65.8, 66.1, 62.1]
    }
};

let airChartInstance = null;
let noiseChartInstance = null;

async function carregarDadosEstacao(stationId) {
    let dados;
    try {
        // Tenta consumir a rota REST real do banco de séries temporais (InfluxDB/API)
        const response = await fetch(`${API_BASE_URL}/stations/${stationId}/timeseries?range=24h`);
        if (!response.ok) throw new Error("Fallback local ativado");
        dados = await response.json();
    } catch (error) {
        // Fallback automático com dados reais estruturados para demonstração offline
        dados = MOCK_TIMESERIES_DB[stationId];
    }

    document.getElementById("sponsorBadge").textContent = dados.sponsor;
    const kpiIqar = document.getElementById("kpiIqar");
    kpiIqar.textContent = dados.iqar;
    kpiIqar.className = `kpi-value ${dados.iqarClass}`;
    document.getElementById("kpiPm25").textContent = dados.pm25;
    document.getElementById("kpiCo2").textContent = dados.co2;
    document.getElementById("kpiNoise").textContent = dados.noise;

    renderizarGraficos(dados);
}

function renderizarGraficos(dados) {
    const ctxAir = document.getElementById("airChart").getContext("2d");
    const ctxNoise = document.getElementById("noiseChart").getContext("2d");

    if (airChartInstance) airChartInstance.destroy();
    if (noiseChartInstance) noiseChartInstance.destroy();

    airChartInstance = new Chart(ctxAir, {
        type: "line",
        data: {
            labels: dados.labels,
            datasets: [{
                label: "PM2.5 (µg/m³)",
                data: dados.pm25Series,
                borderColor: "#0d9488",
                backgroundColor: "rgba(13, 148, 136, 0.15)",
                fill: true,
                tension: 0.35
            }]
        }
    });

    noiseChartInstance = new Chart(ctxNoise, {
        type: "bar",
        data: {
            labels: dados.labels,
            datasets: [{
                label: "Ruído Urbano dB(A)",
                data: dados.noiseSeries,
                backgroundColor: "#0284c7",
                borderRadius: 6
            }]
        }
    });
}

document.getElementById("stationSelect").addEventListener("change", (e) => {
    carregarDadosEstacao(e.target.value);
});

// =========================================================================
// 2. INTEGRAÇÃO JAVASCRIPT COM API EXTERNA DE CONSULTA DE CEP (ViaCEP)
// =========================================================================
const cepInput = document.getElementById("cep");
const cepStatus = document.getElementById("cepStatus");

cepInput.addEventListener("blur", async() => {
    const cepLimpo = cepInput.value.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
        cepStatus.textContent = "(CEP inválido)";
        return;
    }

    cepStatus.textContent = "(Consultando API ViaCEP...)";
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const endereco = await res.json();

        if (endereco.erro) {
            cepStatus.textContent = "(CEP não encontrado)";
            return;
        }

        document.getElementById("logradouro").value = endereco.logradouro || "";
        document.getElementById("bairro").value = endereco.bairro || "";
        document.getElementById("cidade").value = `${endereco.localidade} - ${endereco.uf}`;
        cepStatus.textContent = "✓ Endereço localizado";
    } catch (err) {
        cepStatus.textContent = "(Erro de rede ao consultar CEP)";
    }
});

// Envio do Formulário de Contato / Solicitação ESG
document.getElementById("contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const bairro = document.getElementById("bairro").value || "sua região";
    document.getElementById("formFeedback").textContent =
        `Solicitação registrada com sucesso para ${nome} (${bairro}). Nossa equipe técnica entrará em contato em até 24h!`;
    e.target.reset();
});

// Inicializa o painel ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
    carregarDadosEstacao("EP-SP-VM01");
});
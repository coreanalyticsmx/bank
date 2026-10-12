// --- CONFIGURACIÓN INICIAL ---
const INITIAL_BANK = 100;
let bankChart = null; // Para guardar la referencia del gráfico

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupTabs();
    loadCSVData();
});

// --- 1. LECTURA Y PROCESAMIENTO DEL CSV ---
function loadCSVData() {
    Papa.parse("bank.csv", {
        download: true,       // Le dice a PapaParse que es un archivo externo
        header: true,         // La primera fila son los nombres de las propiedades
        dynamicTyping: true,  // Convierte los números automáticamente
        skipEmptyLines: true, // Ignora filas en blanco al final
        complete: function (results) {
            const rawData = results.data;
            console.log("Datos cargados correctamente:", rawData);

            // Renderizamos la aplicación
            calculateStats(rawData);
            renderChart(rawData);
            renderTable(rawData);

            // Renderizamos los íconos inyectados por la tabla
            lucide.createIcons();
        },
        error: function (err) {
            console.error("Error al cargar bank.csv:", err);
            document.getElementById('bets-table-body').innerHTML = `
                <tr><td colspan="6" class="py-4 text-center text-rose-400">Error cargando bank.csv. Recuerda usar un Live Server.</td></tr>
            `;
        }
    });
}

// --- 2. CÁLCULO DE MÉTRICAS ---
function calculateStats(data) {
    if (!data || data.length === 0) return;

    const totalStaked = data.reduce((acc, curr) => acc + curr.stake, 0);
    const netProfit = data.reduce((acc, curr) => acc + curr.profit, 0);

    const yieldVal = totalStaked > 0 ? ((netProfit / totalStaked) * 100).toFixed(2) : 0;
    const roiVal = ((netProfit / INITIAL_BANK) * 100).toFixed(2);
    const wins = data.filter(b => b.status === 'W').length;
    const winRate = ((wins / data.length) * 100).toFixed(1);
    const avgOdds = (data.reduce((acc, curr) => acc + curr.odds, 0) / data.length).toFixed(2);
    const currentBank = data[data.length - 1].bank;

    // Actualizar HTML
    document.getElementById('stat-bank').innerText = currentBank.toFixed(2) + 'u';
    document.getElementById('stat-roi-mini').innerText = `${roiVal >= 0 ? '+' : ''}${roiVal}%`;

    const yieldEl = document.getElementById('stat-yield');
    yieldEl.innerText = `${yieldVal}%`;
    yieldEl.className = `text-2xl font-bold ${parseFloat(yieldVal) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById('stat-winrate').innerText = `${winRate}%`;
    document.getElementById('stat-wins-count').innerText = `(${wins}/${data.length})`;
    document.getElementById('stat-avg-odds').innerText = `@${avgOdds}`;
}

// --- 3. GRÁFICA JS ---
function renderChart(data) {
    const ctx = document.getElementById('bankrollChart').getContext('2d');

    const labels = ['Inicio', ...data.map((d, i) => `Bet ${i + 1}`)];
    const dataPoints = [INITIAL_BANK, ...data.map(d => d.bank)];

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    // Si ya existía un gráfico, lo destruimos antes de re-dibujar
    if (bankChart) bankChart.destroy();

    bankChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bankroll',
                data: dataPoints,
                borderColor: '#22d3ee',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#0891b2',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Bank: ${context.parsed.y}u`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: '#334155', display: false },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: '#334155', borderDash: [5, 5] },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// --- 4. GENERACIÓN DE TABLA ---
function renderTable(data) {
    const tableBody = document.getElementById('bets-table-body');
    tableBody.innerHTML = ''; // Limpiamos tabla por si se recarga

    data.forEach(bet => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors";

        let sportClass = "";
        if (bet.sport === 'Americano') sportClass = "bg-amber-900/30 text-amber-400 border border-amber-900";
        else if (bet.sport === 'Futbol') sportClass = "bg-blue-900/30 text-blue-400 border border-blue-900";
        else sportClass = "bg-purple-900/30 text-purple-400 border border-purple-900";

        const statusColor = bet.status === 'W' ? 'text-emerald-400' : 'text-rose-400';
        const statusIcon = bet.status === 'W' ? 'check-circle' : 'x-circle';
        const profitSign = bet.profit > 0 ? '+' : '';

        // Para evitar errores si odds viene indefinido
        const oddsVal = bet.odds ? bet.odds.toFixed(2) : "0.00";

        tr.innerHTML = `
            <td class="py-3 px-4 text-slate-400 font-mono">${bet.date}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded text-xs font-semibold ${sportClass}">
                    ${bet.sport}
                </span>
            </td>
            <td class="py-3 px-4 text-white font-medium">${bet.pick}</td>
            <td class="py-3 px-4 text-slate-300">${oddsVal}</td>
            <td class="py-3 px-4 text-slate-300">${bet.stake}u</td>
            <td class="py-3 px-4 text-right">
                <span class="inline-flex items-center gap-1 font-bold ${statusColor}">
                    <i data-lucide="${statusIcon}" class="w-3 h-3"></i>
                    ${profitSign}${bet.profit}u
                </span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// --- 5. LÓGICA DE PESTAÑAS (TABS) ---
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');

            // Ocultar contenidos
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            // Reiniciar botones
            tabButtons.forEach(b => {
                b.className = "tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-400 hover:text-white";
            });

            // Activar botón actual
            e.currentTarget.className = "tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-slate-700 text-white shadow";
        });
    });
}
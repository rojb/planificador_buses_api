const miGrafo = require('graphlib');
const { getAdjacencyList } = require('../db/db');

let cachedGraph = null;
let lastUpdate = null;

const generarGrafo = async () => {
    let g = new miGrafo.Graph();
    const adjacencyList = await getAdjacencyList();

    console.log(`\n=== GENERANDO GRAFO ===`);
    console.log(`Total de edges en BD: ${adjacencyList.length}`);

    let edgesAgregados = 0;
    let edgesFiltrados = 0;

    for (let i = 0; i < adjacencyList.length; i++) {
        const edge = adjacencyList[i];

        // Validaciones básicas
        if (!edge.p_ini_id || !edge.p_sig_id) {
            edgesFiltrados++;
            continue;
        }

        // Evitar auto-loops
        if (edge.p_ini_id === edge.p_sig_id) {
            edgesFiltrados++;
            continue;
        }

        // Evitar la parada 1 si es destino (pero permitir que sea inicio)
        // Comentado para permitir más conexiones:
        // if (edge.p_sig_id === 1) {
        //     edgesFiltrados++;
        //     continue;
        // }

        // Usar tiempo como peso, si no hay usar distancia
        const peso = edge.tiempo && edge.tiempo > 0 ? edge.tiempo : (edge.disxpunto || 1);

        g.setEdge(edge.p_ini_id, edge.p_sig_id, peso);
        edgesAgregados++;
    }

    console.log(`Edges agregados al grafo: ${edgesAgregados}`);
    console.log(`Edges filtrados: ${edgesFiltrados}`);
    console.log(`Total nodos en grafo: ${g.nodeCount()}`);
    console.log(`Total edges en grafo: ${g.edgeCount()}`);

    return g;
}

module.exports.getOrBuildGraph = async () => {
    const now = Date.now();

    // Cache válido por 1 hora (3600000 ms)
    if (cachedGraph && lastUpdate && (now - lastUpdate) < 3600000) {
        return cachedGraph;
    }


    cachedGraph = await generarGrafo();
    lastUpdate = now;
    return cachedGraph;
};

module.exports.invalidateCache = () => {
    cachedGraph = null;
    lastUpdate = null;
};
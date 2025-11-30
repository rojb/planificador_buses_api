const { getAdjacencyList, getParadasDistancia, getParadas, getParadasLineas } = require("../db/db")
const miGrafo = require('graphlib');
const { ksp } = require("../utils/ksp");
const { getOrBuildGraph } = require('../utils/graphCache');



module.exports.generarGrafo = async () => {
    let g = new miGrafo.Graph();
    const adjacencyList = await getAdjacencyList();

    for (let i = 0; i < adjacencyList.length; i++) {
        const edge = adjacencyList[i];

        // Validaciones
        if (!edge.p_ini_id || !edge.p_sig_id || edge.p_ini_id === edge.p_sig_id) {
            continue;
        }

        // CLAVE: Usar ID único que incluya el tipo de recorrido
        // Formato: "origen|destino|LINEA|TIPO"
        // Esto previene que se mezclen ida y vuelta
        const edgeId = `${edge.p_ini_id}|${edge.p_sig_id}|${edge.lineaCod}|${edge.tipo}`;

        // Crear peso del edge con toda la información
        const peso = {
            tiempo: edge.tiempo || 0,
            distancia: edge.disxpunto || 0,
            lineaCod: edge.lineaCod,
            tipo: edge.tipo,  // Ida o Vuelta
            recorridoID: edge.recorridoID
        };

        // Agregar edge al grafo
        // Solo permite esta combinación específica parada-parada-línea-dirección
        g.setEdge(
            edge.p_ini_id,
            edge.p_sig_id,
            peso,
            edgeId  // ID único del edge
        );
    }

    return g;
};


module.exports.index = async (req, res) => {
    try {

        const { latini, longini, latdest, longdest } = req.query;

        const paradaInicio = await getParadasDistancia(latini, longini);
        const paradaDestino = await getParadasDistancia(latdest, longdest);

        if (!paradaInicio || !paradaInicio[0]) {
            return res.status(400).json({
                msg: "Se encuentra demasiado lejos de la parada más cercana"
            });
        }

        if (!paradaDestino || !paradaDestino[0]) {
            return res.status(400).json({
                msg: "No se encontró una parada cerca del lugar indicado"
            });
        }

        if (paradaInicio[0]['distance'] >= 1) {
            return res.status(400).json({
                msg: "Se encuentra demasiado lejos de la parada más cercana"
            });
        }

        if (paradaDestino[0]['distance'] >= 1) {
            return res.status(400).json({
                msg: "No se encontró una parada cerca del lugar indicado"
            });
        }

        const grafoCacheado = await getOrBuildGraph();
        const grafo = cloneGraph(grafoCacheado);
        // const grafo = await this.generarGrafo();

        const inicio = `${paradaInicio[0]['id']}`;
        const destino = `${paradaDestino[0]['id']}`;

        const response = await ksp(grafo, inicio, destino, 2);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

function cloneGraph(originalGraph) {
    return miGrafo.json.read(miGrafo.json.write(originalGraph));
}


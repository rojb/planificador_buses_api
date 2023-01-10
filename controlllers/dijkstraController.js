const { getAdjacencyList, getParadasDistancia } = require("../db/db")
const miGrafo = require('graphlib');
const { ksp } = require("../utils/ksp");


const generarGrafo = async () => {

    let g = new miGrafo.Graph();
    const adjacencyList = await getAdjacencyList();
    let index = adjacencyList[0].p_ini_id;

    for (let i = 0; i < adjacencyList.length; i++) {
        if (adjacencyList[i].p_ini_id == index) {
            if (adjacencyList[i].p_sig_id != index) {
                if (adjacencyList[i].p_sig_id != 1) {
                    g.setEdge(adjacencyList[i].p_ini_id, adjacencyList[i].p_sig_id, adjacencyList[i].tiempo);
                }
            }
        } else {
            index = adjacencyList[i].p_ini_id;

            if (adjacencyList[i].p_sig_id != index) {
                if (adjacencyList[i].p_sig_id != 1) {
                    g.setEdge(adjacencyList[i].p_ini_id, adjacencyList[i].p_sig_id, adjacencyList[i].tiempo);

                }
            }
        }
    }

    return g;

}


module.exports.index = async (req, res) => {

    const { latini, longini, latdest, longdest } = req.query;
    const paradaInicio = await getParadasDistancia(latini, longini);
    const paradaDestino = await getParadasDistancia(latdest, longdest);
    if (paradaInicio[0]['distance'] >= 1) {
        res.status(400).json({ msg: "Se encuentra demasiado lejos de la parada más cercana" });
    }
    if (paradaDestino[0]['distance'] >= 1) {
        res.status(400).json({ msg: "No se encontró una parada cerca del lugar indicado" });
    }
    const grafo = await generarGrafo();
    const inicio = `${paradaInicio[0]['id']}`;
    const destino = `${paradaDestino[0]['id']}`;
    const response = await ksp(grafo, inicio, destino, 3);
    res.json(response);
}


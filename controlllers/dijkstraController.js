const { getParadasDistancia, getLineasPorCoordenadas } = require("../db/db")
const miGrafo = require('graphlib');
const { getOrBuildGraph } = require("../utils/graphCache");
const { ksp } = require("../utils/ksp");



module.exports.index = async (req, res) => {
    try {
        const { latini, longini, latdest, longdest } = req.query;

        console.log(`\n=== NUEVA BÚSQUEDA DE RUTA ===`);
        console.log(`Inicio: (${latini}, ${longini})`);
        console.log(`Destino: (${latdest}, ${longdest})`);

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

        const distInicio = parseFloat(paradaInicio[0]['distance']);
        const distDestino = parseFloat(paradaDestino[0]['distance']);

        console.log(`Parada inicio: ID=${paradaInicio[0]['id']}, ParadaID=${paradaInicio[0]['paradaid']}, Distancia=${distInicio.toFixed(3)}km`);
        console.log(`Parada destino: ID=${paradaDestino[0]['id']}, ParadaID=${paradaDestino[0]['paradaid']}, Distancia=${distDestino.toFixed(3)}km`);

        if (distInicio >= 1) {
            return res.status(400).json({
                msg: "Se encuentra demasiado lejos de la parada más cercana"
            });
        }

        if (distDestino >= 1) {
            return res.status(400).json({
                msg: "No se encontró una parada cerca del lugar indicado"
            });
        }

        const grafo = await getOrBuildGraph();
        

        const inicio = `${paradaInicio[0]['id']}`;
        const destino = `${paradaDestino[0]['id']}`;

        // Verificar que los nodos existan en el grafo
        if (!grafo.hasNode(inicio)) {
            console.log(`ERROR: Nodo inicio ${inicio} no existe en el grafo`);
            return res.status(400).json({
                msg: `La parada de inicio no tiene conexiones en el sistema`
            });
        }

        if (!grafo.hasNode(destino)) {
            console.log(`ERROR: Nodo destino ${destino} no existe en el grafo`);
            return res.status(400).json({
                msg: `La parada de destino no tiene conexiones en el sistema`
            });
        }

        console.log(`Buscando ruta entre nodo ${inicio} y ${destino}`);
        console.log(`Inicio tiene ${grafo.successors(inicio)?.length || 0} sucesores`);
        console.log(`Destino tiene ${grafo.predecessors(destino)?.length || 0} predecesores`);

        const response = await ksp(grafo, inicio, destino, 2);

        console.log(`Rutas encontradas: ${response.length}`);
        if (response.length === 0) {
            console.log(`ADVERTENCIA: No hay ruta disponible entre ${inicio} y ${destino}`);
            return res.status(400).json({
                msg: "No hay ruta disponible entre estas dos ubicaciones"
            });
        }

        res.json(response);

    } catch (error) {
        console.error('ERROR en dijkstra:', error.message);
        console.error(error.stack);
        res.status(500).json({ error: error.message });
    }
}

module.exports.getLineasByMultipleCoordsSimple = async (req, res) => {
    try {
        const { lugares } = req.body;

        if (!lugares || !Array.isArray(lugares) || lugares.length === 0) {
            return res.status(400).json({
                msg: "Debe enviar un array de lugares con lat y long"
            });
        }

        const resultados = [];

        for (let lugar of lugares) {
            const { lat, long, nombre, distancia = 0.4 } = lugar;

            if (!lat || !long) {
                resultados.push({
                    nombre: nombre || "Sin nombre",
                    error: "Coordenadas inválidas"
                });
                continue;
            }

            try {
                const lineas = await getLineasPorCoordenadas(lat, long, distancia);
                if (lineas.length > 0) {
                    resultados.push({
                        nombre: nombre || "Sin nombre",
                        lat,
                        long,
                        totalLineas: lineas.length,
                        lineas: lineas
                    });
                }

            } catch (error) {
                resultados.push({
                    nombre: nombre || "Sin nombre",
                    error: error.message
                });
            }
        }

        res.json({
            totalLugares: lugares.length,
            procesados: resultados.length,
            resultados: resultados
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

function cloneGraph(originalGraph) {
    return miGrafo.json.read(miGrafo.json.write(originalGraph));
}


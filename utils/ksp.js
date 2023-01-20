const algoDijkstra = require('graphlib');
const { lineasParadas } = require('./lineasParadas');
let paradas;
exports.ksp = async function (g, source, target, K, weightFunc, edgeFunc) {
    paradas = await lineasParadas();

    // Hace una copia del grafo original
    let _g = algoDijkstra.json.read(algoDijkstra.json.write(g));

    // Inicia lo vectores para las rutas candidatas
    let ksp = [];
    let candidates = [];

    // Calcula y añade el camino más corto
    let kthPath = getDijkstra(_g, source, target, weightFunc, edgeFunc);
    if (!kthPath) {
        return ksp;
    }
    ksp.push(kthPath);

    // Calcula cada uno de los caminos más cortos
    for (let k = 1; k < K; k++) {

        // Obtiene el (k-1)camino más corto
        let previousPath = cloneObject(ksp[k - 1]); // clona el camino a una nueva variable

        if (!previousPath) {
            break;
        }
        /* Itera sobre todos los nodos en la ruta más corta (k-1) excepto el nodo de destino; para cada nodo,
         Se genera (hasta) una nueva ruta candidata modificando temporalmente el gráfico y luego ejecutando
         Algoritmo de Dijkstra para encontrar el camino más corto entre el nodo y el destino en el modificado
         grafico*/

        for (let i = 0; i < previousPath.edges.length; i++) {


            // Initialize a container to store the modified (removed) edges for this node/iteration
            let removedEdges = [];

            // Spur node = nodo visitado actualmente en la ruta más corta (k-1)
            let spurNode = previousPath.edges[i].fromNode;

            // Root path = prefix portion of the (k-1)st path up to the spur node
            let rootPath = clonePathTo(previousPath, i);

            // Iterate over all of the (k-1) shortest paths */
            ksp.forEach(p => {
                p = cloneObject(p); // clone p
                let stub = clonePathTo(p, i);

                // Verifica si esta ruta tiene el mismo anterior o raíz que la ruta más corta (k-1)
                if (isPathEqual(rootPath, stub)) {
                    // Si es así, elimina del gráfico la siguiente arista en el camino (más tarde, esto fuerza la espuela
                    // nodo para conectar la ruta raíz con una ruta de anterior no encontrada) */
                    let re = p.edges[i];
                    _g.removeEdge(re.fromNode, re.toNode);
                    removedEdges.push(re);
                }
            })

            // Elimina temporalmente todos los nodos en la ruta raíz, excepto el nodo de estímulo, del gráfico. */
            rootPath.edges.forEach(rootPathEdge => {
                let rn = rootPathEdge.fromNode;
                if (rn !== spurNode) {
                    // elimina el nodo y devuelve los bordes eliminados
                    let removedEdgeFromNode = removeNode(_g, rn, weightFunc);
                    removedEdges.push(...removedEdgeFromNode);
                }
            })

            // Spur path = shortest path from spur node to target node in the reduced graph
            let spurPath = getDijkstra(_g, spurNode, target, weightFunc, edgeFunc);

            // Si se identifica una nueva vía de derivada...
            if (spurPath != null) {
                // Concatena las rutas raíz y de derivación para formar la nueva ruta candidata
                let totalPath = cloneObject(rootPath);
                let edgesToAdd = cloneObject(spurPath.edges);
                totalPath.edges.push(...edgesToAdd);
                totalPath.totalCost += spurPath.totalCost;

                // Si la ruta candidata no se ha generado previamente, agréguela
                if (!isPathExistInArray(candidates, totalPath)) {
                    candidates.push(totalPath);
                }
            }

            addEdges(_g, removedEdges);
        }

        // Identifica el camino candidato más corto con el menor costo */
        let isNewPath;
        do {
            kthPath = removeBestCandidate(candidates);
            isNewPath = true;
            if (kthPath != null) {
                for (let p of ksp) {
                    // Verifica se ya existe el camino candidato
                    if (isPathEqual(p, kthPath)) {
                        isNewPath = false;
                        break;
                    }
                }

            }
        } while (!isNewPath);

        // Si no hay más candidatos para
        if (kthPath == null) {
            break;
        }
        // Añade el mejor candidato no duplicado identificado como el k shortest path

        ksp.push(kthPath);
    }
    return ksp;
}


// Algoritmo de Dijkstra para encontrar el camino más corto
function getDijkstra(g, source, target, weightFunc, edgeFunc) {
    if (!weightFunc) {
        weightFunc = (e) => g.edge(e);
    }

    let dijkstra = algoDijkstra.alg.dijkstra(g, source, weightFunc, edgeFunc);
    return extractPathFromDijkstra(g, dijkstra, source, target, weightFunc, edgeFunc);
}

function extractPathFromDijkstra(g, dijkstra, source, target, weightFunc, edgeFunc) {
    // check if there is a valid path
    if (dijkstra[target].distance === Number.POSITIVE_INFINITY) {
        return null;
    }

    let edges = [];
    let currentNode = target;
    while (currentNode !== source) {
        let previousNode = dijkstra[currentNode].predecessor;

        // extract weight from edge, using weightFunc if supplied, or the default way
        let weightValue;
        if (weightFunc) {
            weightValue = weightFunc({ v: previousNode, w: currentNode });
        } else {
            weightValue = g.edge(previousNode, currentNode)
        }
        let edge = getNewEdge(previousNode, currentNode, weightValue);
        edges.push(edge);
        currentNode = previousNode;
    }

    let result = {
        totalCost: dijkstra[target].distance,
        edges: edges.reverse()
    };
    return result;
}

function addEdges(g, edges) {
    edges.forEach(e => {
        g.setEdge(e.fromNode, e.toNode, e.edgeObj);
    })
}

// entrada: un grafo y un nodo para eliminar
// valor devuelto: array de bordes eliminados
function removeNode(g, rn, weightFunc) {

    let remEdges = [];
    let edges = cloneObject(g.edges());
    // save all the edges we are going to remove
    edges.forEach(edge => {
        if (edge.v == rn || edge.w == rn) {

            // extract weight
            let weightValue;
            if (weightFunc) {
                weightValue = weightFunc(edge);
            } else {
                weightValue = g.edge(edge);
            }

            let e = getNewEdge(edge.v, edge.w, weightValue);
            remEdges.push(e);
        }
    })
    g.removeNode(rn); // removing the node from the graph
    return remEdges;
}

// devuelve un nuevo objeto de ruta desde la ruta de origen a un índice dado
function clonePathTo(path, i) {
    let newPath = cloneObject(path);
    let edges = [];
    let l = path.edges.length;
    if (i > l) {
        i = 1;
    }
    // copy i edges from the source path
    for (let j = 0; j < i; j++) {
        edges.push(path.edges[j]);
    }

    // calc the cost of the new path
    newPath.totalCost = 0;
    edges.forEach(edge => {
        newPath.totalCost += edge.weight;
    })
    newPath.edges = edges;
    return newPath;
}


//compara entre dos objetos de ruta, devuelve verdadero si es igual
function isPathEqual(path1, path2) {
    if (path2 == null) {
        return false;
    }

    let numEdges1 = path1.edges.length;
    let numEdges2 = path2.edges.length;

    // compare number of edges
    if (numEdges1 != numEdges2) {
        return false;
    }

    // compare each edge
    for (let i = 0; i < numEdges1; i++) {
        let edge1 = path1.edges[i];
        let edge2 = path2.edges[i];
        if (edge1.fromNode != edge2.fromNode) {
            return false;
        }
        if (edge1.toNode != edge2.toNode) {
            return false;
        }
    }

    return true;
}

// construye un nuevo nodo
function getNewEdge(fromNode, toNode, weight) {
    const paradaIni = paradas.find((parada) => parada.id == fromNode);
    const paradaSig = paradas.find((parada) => parada.id == toNode);
    return {
        fromNode: fromNode,
        paradaIni,
        toNode: toNode,
        paradaSig,
        weight: weight,
    }
}

// since javascript sends object by ref, we sometimes want to clone objects and its childs to avoid it
// this is a workaround for clone objects
function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Devuelve verdadero si una ruta dada se encuentra en el array de ruta
function isPathExistInArray(candidates, path) {
    candidates.forEach(candi => {
        if (isPathEqual(candi, path)) {
            return true;
        }
    })
    return false;
}

// Ordena el array de candidatos por costo total, luego elimina y devuelve el mejor candidato.
function removeBestCandidate(candidates) {
    return candidates.sort((a, b) => a.totalCost - b.totalCost).shift();
}


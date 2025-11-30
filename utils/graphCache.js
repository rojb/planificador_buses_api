let cachedGraph = null;
let lastUpdate = null;

module.exports.getOrBuildGraph = async () => {
    const now = Date.now();

    // Cache válido por 1 hora (3600000 ms)
    if (cachedGraph && lastUpdate && (now - lastUpdate) < 3600000) {
        return cachedGraph;
    }

    const { generarGrafo } = require('../controlllers/dijkstraController');
    cachedGraph = await generarGrafo();
    lastUpdate = now;
    return cachedGraph;
};

module.exports.invalidateCache = () => {
    cachedGraph = null;
    lastUpdate = null;
};
const { getParadasLineas } = require("../db/db");

module.exports.lineasParadas = async () => {
    const paradas = await getParadasLineas();
    const paradaMap = new Map();

    for (let parada of paradas) {
        const key = parada.paradaID;
        
        if (!paradaMap.has(key)) {
            paradaMap.set(key, {
                id: parada.id,
                paradaID: parada.paradaID,
                latitud: parada.latitud,
                longitud: parada.longitud,
                lineas: []
            });
        }
        
        const paradaObj = paradaMap.get(key);
        
        // Evita duplicados de líneas
        if (!paradaObj.lineas.some(l => l.lineaCod === parada.lineaCod)) {
            paradaObj.lineas.push({
                lineaCod: parada.lineaCod,
                tipo: parada.tipo
            });
        }
    }
    
    return Array.from(paradaMap.values());
};
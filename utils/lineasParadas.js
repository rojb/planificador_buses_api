const { getParadasLineas } = require("../db/db");

module.exports.lineasParadas = async () => {
    const paradas = await getParadasLineas();
    const paradaLineas = [];

    for (let i = 0; i < paradas.length; i++) {

        if (!paradaLineas.some(paradaLinea => { return paradaLinea.paradaID == paradas[i]['paradaID'] })) {

            const newParadaLinea = {

                id: paradas[i]['id'],
                paradaID: paradas[i]['paradaID'],
                latitud: paradas[i]['latitud'],
                longitud: paradas[i]['longitud'],
                lineas: [{
                    lineaCod: paradas[i]['lineaCod'],
                    tipo: paradas[i]['tipo'],
                }]
            }
            paradaLineas.push(newParadaLinea);
        } else {
            const indexParada = paradaLineas.findIndex(value => { return value.paradaID == paradas[i]['paradaID'] });
            if (!paradaLineas[indexParada].lineas.some(value => { value.lineaCod == paradas[i]['lineaCod'] })) {
                const newLinea = {
                    lineaCod: paradas[i]['lineaCod'],
                    tipo: paradas[i]['tipo'],
                }
                paradaLineas[indexParada].lineas.push(newLinea);
            }
        }

    }



    return paradaLineas;
}
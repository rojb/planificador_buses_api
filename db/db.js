const { openDb } = require('../index');

const getAdjacencyList = async () => {
    const db = await openDb();
    const sql = `  
                SELECT recorridoParada.recorridoID, i.id as p_ini_id,  i.longitud as longitud_ini, i.latitud as latitud_ini,  i.paradaid as parada_ini, s.id as p_sig_id, s.paradaid as parada_sig, s.longitud as longitud_sig,s.latitud as latitud_sig, tiempo, disxpunto  
                FROM recorridoParada
                LEFT JOIN parada i on i.paradaID=recorridoParada.parada_ini
                LEFT JOIN parada s on s.paradaID=recorridoParada.parada_sig
                WHERE parada_ini IN (SELECT parada.paradaID FROM parada) 
                GROUP BY parada_ini, parada_sig
                HAVING COUNT(parada_ini)>=0
                ORDER BY parada_ini asc
                `;

    const result = await db.all(sql);
    db.close();
    return result;
}

const getProfundidad = async () => {
    const db = await openDb();
    const sql = ` SELECT COUNT(id) as nroParada
                  FROM parada;`;

    const result = await db.all(sql);

    db.close();
    return result[0]['nroParada'];
}

const getParadas = async () => {
    const db = await openDb();
    const sql = ` SELECT *
                  FROM parada;`;

    const result = await db.all(sql);
    db.close();

    return result
}
const getParadasDistancia = async (lat, long) => {
    const db = await openDb();
    const sql = ` SELECT * FROM (
        SELECT *, 
            (
                (
                    (
                        acos(
                            sin(( ${lat} * pi() / 180))
                            *
                            sin(( parada.latitud * pi() / 180)) + cos(( ${lat} * pi() /180 ))
                            *
                            cos(( parada.latitud * pi() / 180)) * cos((( ${long} - parada.longitud) * pi()/180)))
                    ) * 180/pi()
                ) * 60 * 1.1515 * 1.609344
            )
        as distance FROM parada
    ) parada
    
    ORDER by distance
    LIMIT 1;;`;

    const result = await db.all(sql);
    db.close();

    return result
}
const getParadasLineas = async () => {
    const db = await openDb();
    const sql = ` 
    SELECT parada.id , parada.paradaid, parada.longitud, parada.latitud, lineacod,tipo  from  recorridoParada 
    LEFT JOIN recorrido on recorrido.recorridoID = recorridoParada.recorridoID
    LEFT JOIN parada on parada.paradaID = recorridoParada.parada_ini
    where recorridoParada.parada_ini in (select paradaID from parada)
    order by paradaid`;

    const result = await db.all(sql);
    db.close();

    return result
}

const getLineasPorCoordenadas = async (lat, long, distanciaMax = 1) => {
    const db = await openDb();
    const sql = `
        SELECT DISTINCT 
            linea.cod,
            linea.nombre,
            GROUP_CONCAT(DISTINCT recorrido.tipo) as tipos
        FROM parada
        LEFT JOIN recorridoParada ON recorridoParada.parada_ini = parada.paradaID 
            OR recorridoParada.parada_sig = parada.paradaID
        LEFT JOIN recorrido ON recorrido.recorridoID = recorridoParada.recorridoID
        LEFT JOIN linea ON linea.cod = recorrido.lineaCod
        WHERE (
            (
                (
                    acos(
                        sin(( ${lat} * pi() / 180))
                        *
                        sin(( parada.latitud * pi() / 180)) + cos(( ${lat} * pi() /180 ))
                        *
                        cos(( parada.latitud * pi() / 180)) * cos((( ${long} - parada.longitud) * pi()/180)))
                ) * 180/pi()
            ) * 60 * 1.1515 * 1.609344
        ) <= ${distanciaMax}
        AND linea.cod IS NOT NULL
        GROUP BY linea.cod, linea.nombre
        ORDER BY linea.cod ASC
    `;

    const result = await db.all(sql);
    db.close();

    return result.map(r => ({
        cod: r.cod,
        nombre: r.nombre,
        tipos: r.tipos ? r.tipos.split(',') : []
    }));
};

module.exports = { getAdjacencyList, getProfundidad, getParadas, getParadasDistancia, getParadasLineas, getLineasPorCoordenadas }
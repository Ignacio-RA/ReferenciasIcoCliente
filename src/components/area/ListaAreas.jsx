import { useEffect, useState } from 'react'
import api from '../../api/config'

function ListaAreas() {
    const [areas, setAreas] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        api.get('/areas')
            .then(response => {
                setAreas(response.data.areas)
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener las áreas:', error)
                setCargando(false)
            })
    }, [])

    // Función que se ejecutará cuando el usuario haga clic en una tarjeta
    const handleCardClick = (idArea, nombreArea) => {
        console.log(`Clic en el área ID: ${idArea} (${nombreArea})`);
        // Aquí más adelante usarás un enrutador o un estado para filtrar las referencias de esta área
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando áreas...</div>
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">Áreas</h3>
                <p className="text-sm text-slate-500">Selecciona una área para ver sus referencias bibliográficas.</p>
            </div>

            {areas.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay áreas disponibles de momento.
                </div>
            ) : (
                /* Rejilla responsiva: 1 columna en móvil, 2 en tablets, 3 en pantallas grandes */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map(area => (
                        <div 
                            key={area.id_area}
                            onClick={() => handleCardClick(area.id_area, area.nombre)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                {/* Nombre de la Área */}
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {area.nombre}
                                </h4>
                            </div>

                            {/* Footer de la Card con la Clave */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>No. referencias: <strong className="text-slate-600 font-medium">{area.id_area}</strong></span>
                                <span className="text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    Ver referencias →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 

export default ListaAreas;
import { useEffect, useState } from 'react'
import api from '../../api/config'

function ListaAsignaturas() {
    const [asignaturas, setAsignaturas] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        api.get('/asignaturas')
            .then(response => {
                setAsignaturas(response.data.asignaturas)
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener las asignaturas:', error)
                setCargando(false)
            })
    }, [])

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando asignaturas...</div>
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">Asignaturas</h3>
                <p className="text-sm text-slate-500">Consulta las asignaturas y el número de referencias asociadas.</p>
            </div>

            {asignaturas.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay asignaturas disponibles de momento.
                </div>
            ) : (
                /* Rejilla responsiva: 1 columna en móvil, 2 en tablets, 3 en pantallas grandes */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {asignaturas.map(asignatura => (
                        <div 
                            key={asignatura.id_asignatura}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                {/* Etiqueta del Área */}
                                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 mb-4 tracking-wide">
                                    {asignatura.area?.nombre || 'General'}
                                </span>

                                {/* Nombre de la Asignatura */}
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {asignatura.nombre}
                                </h4>
                            </div>

                            {/* Footer de la Card con la Clave */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-400">
                                <div className="flex justify-between items-center">
                                    {/* Mapea ej: Clave: 1810 */}
                                    <span>Clave: <strong className="text-slate-600 font-medium">{asignatura.clave}</strong></span>
                                    
                                    {/* Mapea ej: No. referencias: 2 (Y como es mayor a 0, se pintará en verde) */}
                                    <span>No. referencias: {' '}
                                        <strong className={`font-semibold px-2 py-0.5 rounded-sm ${
                                            asignatura.total_referencias > 0 
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {asignatura.total_referencias}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 

export default ListaAsignaturas;
import { useEffect, useState } from 'react'
import api from '../../api/config'

function ListaAutores() {
    const [autores, setAutores] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        api.get('/autores')
            .then(response => {
                setAutores(response.data.autores)
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener los autores:', error)
                setCargando(false)
            })
    }, [])

    // Función que se ejecutará cuando el usuario haga clic en una tarjeta
    const handleCardClick = (idAutor, nombreAutor) => {
        console.log(`Clic en el autor ID: ${idAutor} (${nombreAutor})`);
        // Aquí más adelante usarás un enrutador o un estado para filtrar las referencias de este autor
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando autores...</div>
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800">Autores</h3>
                <p className="text-sm text-slate-500">Selecciona un autor para ver sus referencias bibliográficas.</p>
            </div>

            {autores.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay autores disponibles de momento.
                </div>
            ) : (
                /* Rejilla responsiva: 1 columna en móvil, 2 en tablets, 3 en pantallas grandes */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {autores.map(autor => (
                        <div 
                            key={autor.id_autor}
                            onClick={() => handleCardClick(autor.id_autor, autor.nombre)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                {/* Nombre de la Área */}
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {autor.ap_paterno} {autor.ap_materno} {autor.nombre}
                                </h4>
                            </div>

                            {/* Footer de la Card con No. Referencias */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-400">
                                <div className="flex justify-between items-center">
                                    {/* Mapea ej: No. referencias: 2 (Y como es mayor a 0, se pintará en verde) */}
                                    <span>No. referencias: {' '}
                                        <strong className={`font-semibold px-2 py-0.5 rounded-sm ${
                                            autor.total_referencias > 0 
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {autor.total_referencias}
                                        </strong>
                                    </span>
                                </div>
                                
                                <div className="text-right h-4">
                                    <span className="text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        Ver referencias →
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

export default ListaAutores;
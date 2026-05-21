import { useEffect, useState } from 'react'
import api from '../../api/config'

function ListaAreas() {
    const [areas, setAreas] = useState([])
    const [cargando, setCargando] = useState(true)
    
    // Estados para el Modal y el Formulario
    const [modalAbierto, setModalAbierto] = useState(false)
    const [nombreAreaForm, setNombreAreaForm] = useState('') // Nombre unificado para el input
    const [idAreaEditar, setIdAreaEditar] = useState(null)   // null = Crear, ID asignado = Editar
    const [guardando, setGuardando] = useState(false)
    const [errorFormulario, setErrorFormulario] = useState(null)

    // Función para obtener las áreas
    const obtenerAreas = () => {
        setCargando(true)
        api.get('/areas')
            .then(response => {
                setAreas(response.data.areas || [])
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener las áreas:', error)
                setCargando(false)
            })
    }

    useEffect(() => {
        obtenerAreas()
    }, [])

    // Función para activar el modo edición al dar clic en el botón Editar
    const iniciarEdicion = (idArea, nombreActual) => {
        setIdAreaEditar(idArea)       // Guardamos qué registro se va a modificar
        setNombreAreaForm(nombreActual) // Precargamos el input con el nombre que ya tiene
        setModalAbierto(true)         // Abrimos el modal
    }

    // Limpiador del modal al cerrar o cancelar
    const cerrarModal = () => {
        setModalAbierto(false)
        setIdAreaEditar(null)
        setNombreAreaForm('')
        setErrorFormulario(null)
    }

    // Manejador del envío unificado (Crear o Editar)
    const handleGuardarArea = (e) => {
        e.preventDefault()
        
        if (!nombreAreaForm.trim()) {
            setErrorFormulario('El nombre del área es obligatorio.')
            return
        }

        setGuardando(true)
        setErrorFormulario(null)

        const datos = { nombre: nombreAreaForm.trim() }

        if (idAreaEditar) {
            // --- MODO EDICIÓN (PATCH /areas/:id) ---
            api.patch(`/areas/${idAreaEditar}`, datos)
                .then(response => {
                    obtenerAreas() 
                    cerrarModal()
                    setGuardando(false)
                })
                .catch(error => {
                    console.error('Error al actualizar el área:', error)
                    setErrorFormulario('Hubo un error al actualizar el área. Inténtalo de nuevo.')
                    setGuardando(false)
                })
        } else {
            // --- MODO CREACIÓN (POST /areas) ---
            api.post('/areas', datos)
                .then(response => {
                    obtenerAreas() 
                    cerrarModal()
                    setGuardando(false)
                })
                .catch(error => {
                    console.error('Error al crear el área:', error)
                    setErrorFormulario('Hubo un error al guardar el área. Inténtalo de nuevo.')
                    setGuardando(false)
                })
        }
    }

    const handleEliminarArea = (idArea, nombreArea) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el área "${nombreArea}"?`);
        if (!confirmar) return;

        api.delete(`/areas/${idArea}`)
            .then(response => {
                alert('Área eliminada con éxito');
                obtenerAreas();
            })
            .catch(error => {
                console.error('Error al eliminar el área:', error);
                alert('No se pudo eliminar el área. Verifica si tiene asignaturas asociadas.');
            });
    };

    const handleCardClick = (idArea, nombreArea) => {
        console.log(`Clic en el área ID: ${idArea} (${nombreArea})`);
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando áreas...</div>
    }

    return (
        <div className="relative">
            {/* ENCABEZADO */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Áreas</h3>
                    <p className="text-sm text-slate-500">Selecciona una área para ver más opciones</p>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setModalAbierto(true)} // Al ser directo, idAreaEditar es null (Modo Crear)
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-xs hover:bg-green-700 transition-colors duration-200 cursor-pointer transform active:scale-95"
                    >
                        Nueva Área
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL / REJILLA */}
            {areas.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay áreas disponibles de momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map(area => (
                        <div 
                            key={area.id_area}
                            onClick={() => handleCardClick(area.id_area, area.nombre)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {area.nombre}
                                </h4>
                            </div>

                            {/* Footer de la Card */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span className="font-medium text-slate-500">
                                    No. asignaturas: {' '}
                                    <strong className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm font-semibold">
                                        {area.total_asignaturas || 0}
                                    </strong>
                                </span>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Evita el click de la card
                                            iniciarEdicion(area.id_area, area.nombre);
                                        }}
                                        className="px-3 py-1.5 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-xs transform active:scale-95"
                                    >
                                        Editar
                                    </button>
                                   <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Evita el click de la card
                                            handleEliminarArea(area.id_area, area.nombre);
                                        }}
                                        className="px-3 py-1.5 font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-xs transform active:scale-95"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* INTERFAZ DEL MODAL EMERGENTE UNIFICADO */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-300 scale-100">
                        
                        {/* Cabecera dinámica */}
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="text-lg font-bold text-slate-800">
                                {idAreaEditar ? 'Modificar Área' : 'Registrar Nueva Área'}
                            </h4>
                            <button 
                                onClick={cerrarModal}
                                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleGuardarArea} className="p-6">
                            {errorFormulario && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                                    {errorFormulario}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Nombre de la Área Académica
                                </label>
                                <input 
                                    type="text"
                                    value={nombreAreaForm}
                                    onChange={(e) => setNombreAreaForm(e.target.value)}
                                    placeholder="Ej. Ingeniería en Computación"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                    autoFocus
                                />
                            </div>

                            {/* Botones de acción dinámicos */}
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    disabled={guardando}
                                >
                                    {guardando ? 'Guardando...' : idAreaEditar ? 'Actualizar Área' : 'Crear Área'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ListaAreas
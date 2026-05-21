import { useEffect, useState } from 'react'
import api from '../../api/config'

function ControlAsignaturas() {
    const [asignaturas, setAsignaturas] = useState([])
    const [areas, setAreas] = useState([]) // Almacena las áreas para el select del modal
    const [cargando, setCargando] = useState(true)
    
    // Estados para el Modal y el Formulario
    const [modalAbierto, setModalAbierto] = useState(false)
    const [idAsignaturaEditar, setIdAsignaturaEditar] = useState(null) // null = Crear, ID asignado = Editar
    const [guardando, setGuardando] = useState(false)
    const [errorFormulario, setErrorFormulario] = useState(null)

    // Estado unificado para el formulario de asignatura
    const [formAsignatura, setFormAsignatura] = useState({
        clave: '',
        nombre: '',
        id_area: ''
    })

    // Función para obtener asignaturas y áreas de manera simultánea al inicio
    const cargarDatosIniciales = async () => {
        setCargando(true)
        try {
            // Hacemos ambas peticiones en paralelo para ahorrar tiempo de carga
            const [resAsignaturas, resAreas] = await Promise.all([
                api.get('/asignaturas'),
                api.get('/areas')
            ])
            setAsignaturas(resAsignaturas.data.asignaturas || [])
            setAreas(resAreas.data.areas || [])
        } catch (error) {
            console.error('Error al cargar los datos:', error)
        } finally {
            setCargando(false)
        }
    }

    // Función secundaria rápida para refrescar solo las asignaturas tras guardar/eliminar
    const refrescarAsignaturas = () => {
        api.get('/asignaturas')
            .then(response => setAsignaturas(response.data.asignaturas || []))
            .catch(error => console.error('Error al refrescar asignaturas:', error))
    }

    useEffect(() => {
        cargarDatosIniciales()
    }, [])

    // Manejador de cambios en los inputs/selects
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormAsignatura(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Activar modo edición precargando todos los datos
    const iniciarEdicion = (asignatura) => {
        setIdAsignaturaEditar(asignatura.id_asignatura)
        setFormAsignatura({
            clave: asignatura.clave,
            nombre: asignatura.nombre,
            id_area: asignatura.id_area
        })
        setModalAbierto(true)
    }

    // Limpiador del modal al cerrar o cancelar
    const cerrarModal = () => {
        setModalAbierto(false)
        setIdAsignaturaEditar(null)
        setFormAsignatura({ clave: '', nombre: '', id_area: '' })
        setErrorFormulario(null)
    }

    // Manejador del envío unificado (Crear o Editar)
    const handleGuardarAsignatura = (e) => {
        e.preventDefault()
        
        // Validación de campos requeridos
        if (!formAsignatura.clave || !formAsignatura.nombre.trim() || !formAsignatura.id_area) {
            setErrorFormulario('Todos los campos son obligatorios.')
            return
        }

        setGuardando(true)
        setErrorFormulario(null)

        const datos = {
            clave: parseInt(formAsignatura.clave, 10),
            nombre: formAsignatura.nombre.trim(),
            id_area: parseInt(formAsignatura.id_area, 10)
        }

        if (idAsignaturaEditar) {
            // --- MODO EDICIÓN (PATCH /asignaturas/:id) ---
            api.patch(`/asignaturas/${idAsignaturaEditar}`, datos)
                .then(response => {
                    refrescarAsignaturas() 
                    cerrarModal()
                })
                .catch(error => {
                    console.error('Error al actualizar la asignatura:', error)
                    setErrorFormulario('Hubo un error al actualizar. Asegúrate de que la clave no esté repetida.')
                })
                .finally(() => setGuardando(false))
        } else {
            // --- MODO CREACIÓN (POST /asignaturas) ---
            api.post('/asignaturas', datos)
                .then(response => {
                    refrescarAsignaturas() 
                    cerrarModal()
                })
                .catch(error => {
                    console.error('Error al crear la asignatura:', error)
                    setErrorFormulario('Hubo un error al guardar. Asegúrate de que la clave no esté repetida.')
                })
                .finally(() => setGuardando(false))
        }
    }

    const handleEliminarAsignatura = (idAsignatura, nombreAsignatura) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la asignatura "${nombreAsignatura}"?`);
        if (!confirmar) return;

        api.delete(`/asignaturas/${idAsignatura}`)
            .then(response => {
                alert('Asignatura eliminada con éxito');
                refrescarAsignaturas();
            })
            .catch(error => {
                console.error('Error al eliminar la asignatura:', error);
                alert('No se pudo eliminar la asignatura. Verifica si tiene referencias asociadas.');
            });
    };

    const handleCardClick = (idAsignatura, nombreAsignatura) => {
        console.log(`Clic en asignatura ID: ${idAsignatura} (${nombreAsignatura})`);
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando asignaturas...</div>
    }

    return (
        <div className="relative">
            {/* ENCABEZADO */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Asignaturas</h3>
                    <p className="text-sm text-slate-500">Administración del catálogo de asignaturas académicas</p>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-xs hover:bg-green-700 transition-colors duration-200 cursor-pointer transform active:scale-95"
                    >
                        Nueva Asignatura
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL / REJILLA */}
            {asignaturas.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay asignaturas disponibles de momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {asignaturas.map(asignatura => (
                        <div 
                            key={asignatura.id_asignatura}
                            onClick={() => handleCardClick(asignatura.id_asignatura, asignatura.nombre)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md tracking-wider">
                                        Clave: {asignatura.clave}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        {asignatura.area?.nombre || 'Sin área'}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mt-1">
                                    {asignatura.nombre}
                                </h4>
                            </div>

                            {/* Footer de la Card */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span className="font-medium text-slate-500">
                                    Referencias: {' '}
                                    <strong className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm font-semibold">
                                        {asignatura.total_referencias || 0}
                                    </strong>
                                </span>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            iniciarEdicion(asignatura);
                                        }}
                                        className="px-3 py-1.5 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-xs transform active:scale-95"
                                    >
                                        Editar
                                    </button>
                                   <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarAsignatura(asignatura.id_asignatura, asignatura.nombre);
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
                                {idAsignaturaEditar ? 'Modificar Asignatura' : 'Registrar Nueva Asignatura'}
                            </h4>
                            <button 
                                onClick={cerrarModal}
                                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleGuardarAsignatura} className="p-6">
                            {errorFormulario && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                                    {errorFormulario}
                                </div>
                            )}

                            {/* Campo: Clave */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Clave de la Asignatura *
                                </label>
                                <input 
                                    type="number"
                                    name="clave"
                                    value={formAsignatura.clave}
                                    onChange={handleInputChange}
                                    placeholder="Ej. 1417"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                    autoFocus={!idAsignaturaEditar}
                                />
                            </div>

                            {/* Campo: Nombre */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Nombre de la Asignatura *
                                </label>
                                <input 
                                    type="text"
                                    name="nombre"
                                    value={formAsignatura.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Base de Datos 1"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                />
                            </div>

                            {/* Campo: Área (Relación / Select) */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Área Académica Correspondiente *
                                </label>
                                <select
                                    name="id_area"
                                    value={formAsignatura.id_area}
                                    onChange={handleInputChange}
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium cursor-pointer appearance-none"
                                    disabled={guardando}
                                >
                                    <option value="" disabled>-- Selecciona un área --</option>
                                    {areas.map(area => (
                                        <option key={area.id_area} value={area.id_area}>
                                            {area.nombre}
                                        </option>
                                    ))}
                                </select>
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
                                    {guardando ? 'Guardando...' : idAsignaturaEditar ? 'Actualizar Asignatura' : 'Crear Asignatura'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ControlAsignaturas
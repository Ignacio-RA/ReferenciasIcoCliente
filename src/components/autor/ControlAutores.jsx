import { useEffect, useState } from 'react';
import api from '../../api/config'

function ControlAutores() {
    const [autores, setAutores] = useState([])
    const [cargando, setCargando] = useState(true)
    
    // Estados para el Modal y el Formulario
    const [modalAbierto, setModalAbierto] = useState(false)
    const [idAutorEditar, setIdAutorEditar] = useState(null) // null = Crear, ID asignado = Editar
    const [guardando, setGuardando] = useState(false)
    const [errorFormulario, setErrorFormulario] = useState(null)

    // Estado unificado para los campos del autor
    const [formAutor, setFormAutor] = useState({
        nombre: '',
        ap_paterno: '',
        ap_materno: ''
    })

    // Función para obtener los autores
    const obtenerAutores = () => {
        setCargando(true)
        api.get('/autores')
            .then(response => {
                setAutores(response.data.autores || [])
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener los autores:', error)
                setCargando(false)
            })
    }

    useEffect(() => {
        obtenerAutores()
    }, [])

    // Manejador para los cambios en las entradas del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormAutor(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Activar el modo edición al dar clic en el botón Editar
    const iniciarEdicion = (autor) => {
        setIdAutorEditar(autor.id_autor)
        setFormAutor({
            nombre: autor.nombre,
            ap_paterno: autor.ap_paterno,
            ap_materno: autor.ap_materno || '' // Evitamos nulls en el input controlado
        })
        setModalAbierto(true)
    }

    // Limpiador del modal al cerrar o cancelar
    const cerrarModal = () => {
        setModalAbierto(false)
        setIdAutorEditar(null)
        setFormAutor({ nombre: '', ap_paterno: '', ap_materno: '' })
        setErrorFormulario(null)
    }

    // Manejador del envío unificado (Crear o Editar)
    const handleGuardarAutor = (e) => {
        e.preventDefault()
        
        // Validación de campos obligatorios según tu modelo de Sequelize
        if (!formAutor.nombre.trim() || !formAutor.ap_paterno.trim()) {
            setErrorFormulario('El nombre y el apellido paterno son obligatorios.')
            return
        }

        setGuardando(true)
        setErrorFormulario(null)

        // Estructuramos los datos limpiando espacios
        const datos = {
            nombre: formAutor.nombre.trim(),
            ap_paterno: formAutor.ap_paterno.trim(),
            ap_materno: formAutor.ap_materno.trim() || null // Si está vacío, mandamos null
        }

        if (idAutorEditar) {
            // --- MODO EDICIÓN (PATCH /autores/:id) ---
            api.patch(`/autores/${idAutorEditar}`, datos)
                .then(response => {
                    obtenerAutores() 
                    cerrarModal()
                    setGuardando(false)
                })
                .catch(error => {
                    console.error('Error al actualizar el autor:', error)
                    setErrorFormulario('Hubo un error al actualizar el autor. Inténtalo de nuevo.')
                    setGuardando(false)
                })
        } else {
            // --- MODO CREACIÓN (POST /autores) ---
            api.post('/autores', datos)
                .then(response => {
                    obtenerAutores() 
                    cerrarModal()
                    setGuardando(false)
                })
                .catch(error => {
                    console.error('Error al crear el autor:', error)
                    setErrorFormulario('Hubo un error al guardar el autor. Inténtalo de nuevo.')
                    setGuardando(false)
                })
        }
    }

    const handleEliminarAutor = (idAutor, nombreCompleto) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al autor "${nombreCompleto}"?`);
        if (!confirmar) return;

        api.delete(`/autores/${idAutor}`)
            .then(response => {
                alert('Autor eliminado con éxito');
                obtenerAutores();
            })
            .catch(error => {
                console.error('Error al eliminar el autor:', error);
                alert('No se pudo eliminar el autor. Verifica si tiene referencias bibliográficas asociadas.');
            });
    };

    const handleCardClick = (idAutor, nombreCompleto) => {
        console.log(`Clic en el autor ID: ${idAutor} (${nombreCompleto})`);
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando autores...</div>
    }

    return (
        <div className="relative">
            {/* ENCABEZADO */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Autores</h3>
                    <p className="text-sm text-slate-500">Gestión de autores registrados en el sistema bibliográfico</p>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-xs hover:bg-green-700 transition-colors duration-200 cursor-pointer transform active:scale-95"
                    >
                        Nuevo Autor
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL / REJILLA */}
            {autores.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay autores disponibles de momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {autores.map(autor => {
                        const nombreCompleto = `${autor.nombre} ${autor.ap_paterno} ${autor.ap_materno || ''}`.trim();
                        
                        return (
                            <div 
                                key={autor.id_autor}
                                onClick={() => handleCardClick(autor.id_autor, nombreCompleto)}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                            >
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {autor.ap_paterno} {autor.ap_materno && `${autor.ap_materno},`} {autor.nombre}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1">Formato bibliográfico</p>
                                </div>

                                {/* Footer de la Card */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                    <span className="font-medium text-slate-500">
                                        No. referencias: {' '}
                                        <strong className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm font-semibold">
                                            {autor.total_referencias || 0}
                                        </strong>
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita el click de la card
                                                iniciarEdicion(autor);
                                            }}
                                            className="px-3 py-1.5 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-xs transform active:scale-95"
                                        >
                                            Editar
                                        </button>
                                       <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita el click de la card
                                                handleEliminarAutor(autor.id_autor, nombreCompleto);
                                            }}
                                            className="px-3 py-1.5 font-semibold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-xs transform active:scale-95"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* INTERFAZ DEL MODAL EMERGENTE UNIFICADO */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-300 scale-100">
                        
                        {/* Cabecera dinámica */}
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="text-lg font-bold text-slate-800">
                                {idAutorEditar ? 'Modificar Autor' : 'Registrar Nuevo Autor'}
                            </h4>
                            <button 
                                onClick={cerrarModal}
                                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleGuardarAutor} className="p-6">
                            {errorFormulario && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                                    {errorFormulario}
                                </div>
                            )}

                            {/* Campo: Nombre */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Nombre(s) *
                                </label>
                                <input 
                                    type="text"
                                    name="nombre"
                                    value={formAutor.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Paul J."
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                    autoFocus
                                />
                            </div>

                            {/* Campo: Apellido Paterno */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Apellido Paterno *
                                </label>
                                <input 
                                    type="text"
                                    name="ap_paterno"
                                    value={formAutor.ap_paterno}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Deitel"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                />
                            </div>

                            {/* Campo: Apellido Materno */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Apellido Materno (Opcional)
                                </label>
                                <input 
                                    type="text"
                                    name="ap_materno"
                                    value={formAutor.ap_materno}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Escriba"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
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
                                    {guardando ? 'Guardando...' : idAutorEditar ? 'Actualizar Autor' : 'Crear Autor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ControlAutores
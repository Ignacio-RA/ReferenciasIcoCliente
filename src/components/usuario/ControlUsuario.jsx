import { useEffect, useState } from 'react'
import api from '../../api/config'

function ListaUsuarios() {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)

    // Estados para el Modal y el Formulario
    const [modalAbierto, setModalAbierto] = useState(false)
    const [idUsuarioEditar, setIdUsuarioEditar] = useState(null) // null = Crear, ID asignado = Editar
    const [guardando, setGuardando] = useState(false)
    const [errorFormulario, setErrorFormulario] = useState(null)

    // Estado unificado para el formulario (incluye password)
    const [formUsuario, setFormUsuario] = useState({
        nombre: '',
        ap_paterno: '',
        ap_materno: '',
        correo: '',
        password: '',
        admin: false
    })

    const obtenerUsuarios = () => {
        setCargando(true)
        api.get('/usuarios')
            .then(response => {
                setUsuarios(response.data.usuarios || [])
                setCargando(false)
            })
            .catch(error => {
                console.error('Error al obtener los usuarios:', error)
                setCargando(false)
            })
    }

    useEffect(() => {
        obtenerUsuarios()
    }, [])

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormUsuario(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const iniciarEdicion = (usuario) => {
        setIdUsuarioEditar(usuario.id_usuario)
        setFormUsuario({
            nombre: usuario.nombre,
            ap_paterno: usuario.ap_paterno,
            ap_materno: usuario.ap_materno || '',
            correo: usuario.correo,
            password: '', // No se edita la contraseña por esta vía
            admin: usuario.admin
        })
        setModalAbierto(true)
    }

    const cerrarModal = () => {
        setModalAbierto(false)
        setIdUsuarioEditar(null)
        setFormUsuario({ nombre: '', ap_paterno: '', ap_materno: '', correo: '', password: '', admin: false })
        setErrorFormulario(null)
    }

    const toggleAdminRapido = (usuario) => {
        const nuevoEstadoAdmin = !usuario.admin
        
        api.patch(`/usuarios/${usuario.id_usuario}`, { admin: nuevoEstadoAdmin })
            .then(() => {
                obtenerUsuarios()
            })
            .catch(error => {
                console.error('Error al cambiar el rol:', error)
                alert('No se pudo actualizar el rol del usuario.')
            })
    }

    const handleGuardarUsuario = (e) => {
        e.preventDefault()

        // Validaciones base comunes
        if (!formUsuario.nombre.trim() || !formUsuario.ap_paterno.trim() || !formUsuario.correo.trim()) {
            setErrorFormulario('Nombre, Apellido Paterno y Correo son obligatorios.')
            return
        }

        // Validación de contraseña solo si es un usuario nuevo
        if (!idUsuarioEditar && !formUsuario.password.trim()) {
            setErrorFormulario('La contraseña es obligatoria para nuevos usuarios.')
            return
        }

        setGuardando(true)
        setErrorFormulario(null)

        // Estructura base de datos
        const datos = {
            nombre: formUsuario.nombre.trim(),
            ap_paterno: formUsuario.ap_paterno.trim(),
            ap_materno: formUsuario.ap_materno.trim() || null,
            correo: formUsuario.correo.trim(),
            admin: formUsuario.admin
        }

        if (idUsuarioEditar) {
            // --- MODO EDICIÓN (PATCH /usuarios/:id) ---
            api.patch(`/usuarios/${idUsuarioEditar}`, datos)
                .then(() => {
                    obtenerUsuarios()
                    cerrarModal()
                })
                .catch(error => {
                    console.error('Error al actualizar:', error)
                    setErrorFormulario('Error al actualizar el usuario. Verifica el formato del correo.')
                })
                .finally(() => setGuardando(false))
        } else {
            // --- MODO CREACIÓN (POST /usuarios) ---
            // Añadimos el password para el registro inicial
            datos.password = formUsuario.password

            api.post('/usuarios', datos)
                .then(() => {
                    obtenerUsuarios()
                    cerrarModal()
                })
                .catch(error => {
                    console.error('Error al crear:', error)
                    setErrorFormulario('Hubo un error al registrar el usuario. Asegúrate de que el correo no esté repetido.')
                })
                .finally(() => setGuardando(false))
        }
    }

    const handleEliminarUsuario = (idUsuario, nombreCompleto) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombreCompleto}"? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        api.delete(`/usuarios/${idUsuario}`)
            .then(() => {
                alert('Usuario eliminado con éxito')
                obtenerUsuarios()
            })
            .catch(error => {
                console.error('Error al eliminar usuario:', error)
                alert('No se pudo eliminar al usuario. Es posible que tenga registros asociados en el sistema.')
            })
    }

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A'
        const fecha = new Date(fechaISO)
        return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    if (cargando) {
        return <div className="text-slate-500 font-medium">Cargando usuarios...</div>
    }

    return (
        <div className="relative">
            {/* ENCABEZADO */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Control de Usuarios</h3>
                    <p className="text-sm text-slate-500">Visualiza, registra nuevos perfiles y gestiona privilegios de administrador</p>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setModalAbierto(true)}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-xs hover:bg-green-700 transition-colors duration-200 cursor-pointer transform active:scale-95"
                    >
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            {usuarios.length === 0 ? (
                <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                    No hay usuarios registrados en el sistema.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Nombre Completo</th>
                                    <th className="p-4">Correo Electrónico</th>
                                    <th className="p-4 text-center">Rol</th>
                                    <th className="p-4">Fecha de Registro</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {usuarios.map(usuario => {
                                    const nombreCompleto = `${usuario.nombre} ${usuario.ap_paterno} ${usuario.ap_materno || ''}`.trim();
                                    
                                    return (
                                        <tr key={usuario.id_usuario} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4 font-semibold text-slate-800">{nombreCompleto}</td>
                                            <td className="p-4 text-slate-600 font-medium">{usuario.correo}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleAdminRapido(usuario)}
                                                    title="Haz clic para cambiar el rol rápidamente"
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all transform active:scale-95 ${
                                                        usuario.admin 
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' 
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${usuario.admin ? 'bg-purple-500' : 'bg-slate-400'}`}></span>
                                                    {usuario.admin ? 'Administrador' : 'Alumno'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-slate-500">{formatearFecha(usuario.fecha_registro)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => iniciarEdicion(usuario)}
                                                        className="px-2.5 py-1.5 font-semibold text-xs text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer transform active:scale-95"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarUsuario(usuario.id_usuario, nombreCompleto)}
                                                        className="px-2.5 py-1.5 font-semibold text-xs text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer transform active:scale-95"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL DINÁMICO (CREAR / EDICIÓN) */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-300 scale-100">
                        
                        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="text-lg font-bold text-slate-800">
                                {idUsuarioEditar ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Usuario'}
                            </h4>
                            <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleGuardarUsuario} className="p-6">
                            {errorFormulario && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                                    {errorFormulario}
                                </div>
                            )}

                            {/* Campo: Nombre */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre *</label>
                                <input 
                                    type="text"
                                    name="nombre"
                                    value={formUsuario.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Ignacio Alberto"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                    autoFocus={!idUsuarioEditar}
                                />
                            </div>

                            {/* Campos: Apellidos */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apellido Paterno *</label>
                                    <input 
                                        type="text"
                                        name="ap_paterno"
                                        value={formUsuario.ap_paterno}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Ruiz"
                                        className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        disabled={guardando}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apellido Materno</label>
                                    <input 
                                        type="text"
                                        name="ap_materno"
                                        value={formUsuario.ap_materno}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Alejandro"
                                        className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        disabled={guardando}
                                    />
                                </div>
                            </div>

                            {/* Campo: Correo */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                                <input 
                                    type="email"
                                    name="correo"
                                    value={formUsuario.correo}
                                    onChange={handleInputChange}
                                    placeholder="usuario@example.com"
                                    className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    disabled={guardando}
                                />
                            </div>

                            {/* Campo Condicional: Contraseña (Solo se renderiza si estamos CREANDO) */}
                            {!idUsuarioEditar && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña *</label>
                                    <input 
                                        type="password"
                                        name="password"
                                        value={formUsuario.password}
                                        onChange={handleInputChange}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        disabled={guardando}
                                    />
                                </div>
                            )}

                            {/* Campo: Checkbox Rol Admin */}
                            <div className="mb-6 flex items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <input 
                                    type="checkbox"
                                    id="admin"
                                    name="admin"
                                    checked={formUsuario.admin}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                                    disabled={guardando}
                                />
                                <label htmlFor="admin" className="ml-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                                    Conceder permisos de Administrador
                                </label>
                            </div>

                            {/* Botones de acción */}
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
                                    {guardando ? 'Guardando...' : idUsuarioEditar ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ListaUsuarios
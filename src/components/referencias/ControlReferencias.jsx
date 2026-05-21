import { useEffect, useState } from 'react';
import api from '../../api/config';

function ControlReferencias() {
  const [referencias, setReferencias] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [autoresCatalogo, setAutoresCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de control para operaciones
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [referenciaSeleccionadaId, setReferenciaSeleccionadaId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);

  // Estado del formulario de edición (Estructura espejo)
  const [formEdicion, setFormEdicion] = useState({
    tipo_fuente: 'libro',
    titulo: '',
    anio_publicacion: '',
    editorial: '',
    url: '',
    doi: '',
    volumen: '',
    numero: '',
    paginas: '',
    ciudad_pais: '',
    fecha_consulta: '',
    id_asignatura: '',
    autoresIds: [] // Mapeo plano de IDs de autores vinculados
  });

  // Estado para el registro veloz de autores faltantes desde el panel
  const [mostrarNuevoAutorForm, setMostrarNuevoAutorForm] = useState(false);
  const [nuevoAutor, setNuevoAutor] = useState({ nombre: '', ap_paterno: '', ap_materno: '' });
  const [guardandoAutor, setGuardandoAutor] = useState(false);

  // CARGA DE DATOS CENTRALIZADA
  const cargarInformacionAdministrativa = async () => {
    try {
      const [resRefs, resAsigs, resAutores] = await Promise.all([
        api.get('/referencias'),
        api.get('/asignaturas'),
        api.get('/autores').catch(() => ({ data: { autores: [] } }))
      ]);
      setReferencias(resRefs.data.referencias || []);
      setAsignaturas(resAsigs.data.asignaturas || []);
      setAutoresCatalogo(resAutores.data.autores || []);
    } catch (err) {
      console.error(err);
      setError('Error al recuperar los registros de control bibliográfico.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInformacionAdministrativa();
  }, []);

  // AUXILIAR PARA FORMATEO DE AUTORES EN TABLA
  const formatearNombresAutores = (autoresArr) => {
    if (!autoresArr || autoresArr.length === 0) return <span className="text-slate-400 italic">Sin autores vinculados</span>;
    return autoresArr.map(({ autor }) => {
      if (!autor) return 'Anónimo';
      return `${autor.ap_paterno} ${autor.ap_materno || ''}, ${autor.nombre}`.trim();
    }).join('; ');
  };

  // ELIMINACIÓN DIRECTA
  const handleEliminarReferencia = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar de forma permanente esta referencia y desvincular todas sus relaciones con autores?')) return;
    
    try {
      await api.delete(`/referencias/${id}`);
      setReferencias(prev => prev.filter(ref => ref.id_referencia !== id));
    } catch (err) {
      console.error(err);
      alert('Error al intentar dar de baja el registro bibliográfico del servidor.');
    }
  };

  // PREPARAR Y ABRIR MODAL DE EDICIÓN
  const abrirEdicion = (ref) => {
    setReferenciaSeleccionadaId(ref.id_referencia);
    
    // Mapear los IDs de los autores que tiene asignados actualmente la referencia
    const idsAutoresActuales = ref.autor_referencia ? ref.autor_referencia.map(a => a.id_autor) : [];

    // Limpiar fecha quitando la zona horaria para asignarla correctamente al input date nativo
    let fechaLimpia = '';
    if (ref.fecha_consulta) {
      fechaLimpia = ref.fecha_consulta.split('T')[0];
    }

    setFormEdicion({
      tipo_fuente: ref.tipo_fuente || 'libro',
      titulo: ref.titulo || '',
      anio_publicacion: ref.anio_publicacion || '',
      editorial: ref.editorial || '',
      url: ref.url || '',
      doi: ref.doi || '',
      volumen: ref.volumen || '',
      numero: ref.numero || '',
      paginas: ref.paginas || '',
      ciudad_pais: ref.ciudad_pais || '',
      fecha_consulta: fechaLimpia,
      id_asignatura: ref.id_asignatura || '',
      autoresIds: idsAutoresActuales
    });
    
    setErrorFormulario(null);
    setModalEdicionAbierto(true);
  };

  // MANEJO DE INPUTS DEL MODAL MAESTRO
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormEdicion(prev => ({ ...prev, [name]: value }));
  };

  // Selección de autores del catálogo
  const handleAnadirAutorExistente = (e) => {
    const idSeleccionado = parseInt(e.target.value, 10);
    if (!idSeleccionado) return;

    if (!formEdicion.autoresIds.includes(idSeleccionado)) {
      setFormEdicion(prev => ({
        ...prev,
        autoresIds: [...prev.autoresIds, idSeleccionado]
      }));
    }
    e.target.value = '';
  };

  const removerAutorDeEdicion = (idParaRemover) => {
    setFormEdicion(prev => ({
      ...prev,
      autoresIds: prev.autoresIds.filter(id => id !== idParaRemover)
    }));
  };

  // REGISTRO DE NUEVO AUTOR EN LÍNEA DESDE MODAL DE CONTROL
  const handleCrearAutorEnLinea = (e) => {
    e.preventDefault();
    if (!nuevoAutor.nombre.trim() || !nuevoAutor.ap_paterno.trim()) {
      alert('Nombre y Apellido Paterno son obligatorios.');
      return;
    }

    setGuardandoAutor(true);
    api.post('/autores', {
      nombre: nuevoAutor.nombre.trim(),
      ap_paterno: nuevoAutor.ap_paterno.trim(),
      ap_materno: nuevoAutor.ap_materno.trim() || null
    })
    .then(response => {
      const autorCreado = response.data.autor;
      const nuevoId = autorCreado.id;

      const autorCompletoParaCatalogo = {
        id_autor: nuevoId,
        nombre: autorCreado.nombre,
        ap_paterno: nuevoAutor.ap_paterno.trim(),
        ap_materno: nuevoAutor.ap_materno.trim() || null
      };

      setAutoresCatalogo(prev => [...prev, autorCompletoParaCatalogo]);
      setFormEdicion(prev => ({
        ...prev,
        autoresIds: [...prev.autoresIds, nuevoId]
      }));

      setNuevoAutor({ nombre: '', ap_paterno: '', ap_materno: '' });
      setMostrarNuevoAutorForm(false);
    })
    .catch(err => {
      console.error(err);
      alert('Error al agregar el nuevo autor.');
    })
    .finally(() => setGuardandoAutor(false));
  };

  // ENVÍO DE ACTUALIZACIÓN CON RE-INSCRIPCIÓN DE AUTORES
  const handleGuardarCambiosReferencia = (e) => {
    e.preventDefault();
    setErrorFormulario(null);

    const { 
      tipo_fuente, titulo, anio_publicacion, editorial, url, 
      doi, volumen, numero, paginas, ciudad_pais, fecha_consulta, 
      id_asignatura, autoresIds 
    } = formEdicion;

    // Validaciones de Integridad Estricta
    if (!titulo.trim() || !id_asignatura || autoresIds.length === 0) {
      setErrorFormulario('El título, la asignatura y al menos un autor son estrictamente requeridos.');
      return;
    }

    if (tipo_fuente === 'libro' && (!anio_publicacion.trim() || !editorial.trim() || !ciudad_pais.trim())) {
      setErrorFormulario("Las fuentes de tipo 'libro' requieren año, editorial y ciudad/país.");
      return;
    }
    if (tipo_fuente === 'articulo' && (!anio_publicacion.trim() || !volumen || !numero || !paginas.trim())) {
      setErrorFormulario("Las fuentes de tipo 'articulo' requieren año, volumen, número y rango de páginas.");
      return;
    }
    if (tipo_fuente === 'pagina_web' && (!url.trim() || !anio_publicacion.trim())) {
      setErrorFormulario("Las fuentes de tipo 'pagina_web' requieren URL válida y año de publicación.");
      return;
    }

    setGuardando(true);
    const idUsuarioSesion = localStorage.getItem('id_usuario') ? parseInt(localStorage.getItem('id_usuario'), 10) : 1;

    // Construcción del Payload para PATCH
    const payload = {
      tipo_fuente,
      titulo: titulo.trim(),
      anio_publicacion: anio_publicacion.trim() || 's.f.',
      editorial: editorial.trim() || null,
      url: url.trim() || null,
      doi: doi.trim() || null,
      volumen: volumen ? parseInt(volumen, 10) : null,
      numero: numero ? parseInt(numero, 10) : null,
      paginas: paginas.trim() || null,
      ciudad_pais: ciudad_pais.trim() || null,
      fecha_consulta: fecha_consulta || null,
      id_asignatura: parseInt(id_asignatura, 10),
      id_usuario: idUsuarioSesion,
      autores: autoresIds // Se envía completo tal como requiere tu backend para re-escribir la tabla intermedia
    };

    api.patch(`/referencias/${referenciaSeleccionadaId}`, payload)
      .then(() => {
        cargarInformacionAdministrativa(); // Actualizar tabla administrativa completa
        cerrarModalEdicion();
      })
      .catch(err => {
        console.error(err);
        setErrorFormulario(err.response?.data?.msg || 'Ocurrió un error al procesar la actualización en el servidor.');
      })
      .finally(() => setGuardando(false));
  };

  const cerrarModalEdicion = () => {
    setModalEdicionAbierto(false);
    setReferenciaSeleccionadaId(null);
    setMostrarNuevoAutorForm(false);
  };

  if (cargando) return <div className="text-slate-500 font-medium p-4">Cargando consola de administración...</div>;
  if (error) return <div className="text-red-500 font-medium p-4 bg-red-50 border border-red-200 rounded-xl">{error}</div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* BANNER PRINCIPAL DE CONTROL */}
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Consola de Administración</span>
          <h3 className="text-2xl font-bold tracking-tight">Control Maestro de Referencias</h3>
        </div>
        <div className="text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl">
          Registros Activos: {referencias.length}
        </div>
      </div>

      {/* TABLA DE ADMINISTRACIÓN DE DATOS */}
      {referencias.length === 0 ? (
        <div className="p-6 bg-slate-50 text-center text-slate-500 rounded-2xl border border-slate-200 border-dashed">
          No hay referencias almacenadas en el sistema para administrar.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">ID</th>
                  <th className="p-4">Título y Datos Generales</th>
                  <th className="p-4">Asignatura</th>
                  <th className="p-4">Autores Vinculados</th>
                  <th className="p-4">Subido Por</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {referencias.map((ref) => (
                  <tr key={ref.id_referencia} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-400 text-center">{ref.id_referencia}</td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-800 leading-tight mb-1">{ref.titulo}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="capitalize">{ref.tipo_fuente?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{ref.anio_publicacion}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">
                        {ref.asignatura?.nombre || <span className="text-slate-400 italic">No asignada</span>}
                      </div>
                      {ref.asignatura?.clave && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                          {ref.asignatura.clave}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600 max-w-xs">
                      {formatearNombresAutores(ref.autor_referencia)}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-500">
                      {ref.usuario ? `${ref.usuario.nombre} ${ref.usuario.ap_paterno}` : 'Sistema'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEdicion(ref)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-blue-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarReferencia(ref.id_referencia)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN MAESTRA */}
      {modalEdicionAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden transform transition-all">
            
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-slate-800">Modificar Referencia Bibliográfica</h4>
                <p className="text-xs text-slate-400 font-medium">ID de Modificación: {referenciaSeleccionadaId}</p>
              </div>
              <button onClick={cerrarModalEdicion} className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleGuardarCambiosReferencia} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {errorFormulario && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">{errorFormulario}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Fuente *</label>
                  <select name="tipo_fuente" value={formEdicion.tipo_fuente} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium cursor-pointer">
                    <option value="libro">Libro 📘</option>
                    <option value="articulo">Artículo Científico / Revista 📄</option>
                    <option value="pagina_web">Página Web 🌐</option>
                    <option value="video">Video / Multimedia 🎥</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asignatura Relacionada *</label>
                  <select name="id_asignatura" value={formEdicion.id_asignatura} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium cursor-pointer">
                    <option value="" disabled>-- Selecciona la materia --</option>
                    {asignaturas.map(asig => (
                      <option key={asig.id_asignatura} value={asig.id_asignatura}>[{asig.clave}] {asig.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Obra / Recurso *</label>
                <input type="text" name="titulo" value={formEdicion.titulo} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
              </div>

              {/* SECCIÓN AVANZADA DE AUTORES (SE REINSCRIBEN COMPLETOS AL GUARDAR) */}
              <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Autores Vinculados *</label>
                    <p className="text-[10px] text-slate-400 font-medium">Tu backend actualizará todas las relaciones según los cambios hechos aquí.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setMostrarNuevoAutorForm(!mostrarNuevoAutorForm)}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    {mostrarNuevoAutorForm ? '← Volver' : '+ Registrar nuevo autor'}
                  </button>
                </div>

                {!mostrarNuevoAutorForm ? (
                  <div>
                    <select 
                      onChange={handleAnadirAutorExistente}
                      defaultValue=""
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="" disabled>-- Añadir autor del catálogo general --</option>
                      {autoresCatalogo.map(aut => (
                        <option key={aut.id_autor} value={aut.id_autor}>
                          {aut.ap_paterno} {aut.ap_materno || ''}, {aut.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                    <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide block">Alta express de nuevo autor</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" placeholder="Nombre(s)" value={nuevoAutor.nombre} onChange={(e) => setNuevoAutor(prev => ({ ...prev, nombre: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Ap. Paterno" value={nuevoAutor.ap_paterno} onChange={(e) => setNuevoAutor(prev => ({ ...prev, ap_paterno: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Ap. Materno" value={nuevoAutor.ap_materno} onChange={(e) => setNuevoAutor(prev => ({ ...prev, ap_materno: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setMostrarNuevoAutorForm(false)} className="px-3 py-1.5 text-xs text-slate-500 font-semibold hover:bg-slate-100 rounded-lg">Cancelar</button>
                      <button type="button" onClick={handleCrearAutorEnLinea} disabled={guardandoAutor} className="px-3 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg disabled:bg-purple-400">
                        {guardandoAutor ? 'Creando...' : 'Crear y Vincular'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mostrar badges de los autores seleccionados para re-inscripción */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {formEdicion.autoresIds.length === 0 ? (
                    <span className="text-xs text-amber-600 font-medium italic">¡Peligro! Debes vincular por lo menos un autor.</span>
                  ) : (
                    formEdicion.autoresIds.map(id => {
                      const autorObj = autoresCatalogo.find(a => a.id_autor === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                          {autorObj ? `${autorObj.ap_paterno}, ${autorObj.nombre}` : `ID: ${id}`}
                          <button 
                            type="button" 
                            onClick={() => removerAutorDeEdicion(id)}
                            className="text-blue-400 hover:text-red-500 font-bold ml-0.5 transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CAMPOS CONTEXTUALES SEGÚN TIPO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año Publicación</label>
                  <input type="text" name="anio_publicacion" value={formEdicion.anio_publicacion} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>

                {formEdicion.tipo_fuente === 'libro' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Editorial *</label>
                      <input type="text" name="editorial" value={formEdicion.editorial} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad / País *</label>
                      <input type="text" name="ciudad_pais" value={formEdicion.ciudad_pais} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                  </>
                )}

                {formEdicion.tipo_fuente === 'articulo' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Volumen *</label>
                      <input type="number" name="volumen" value={formEdicion.volumen} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número *</label>
                      <input type="number" name="numero" value={formEdicion.numero} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Páginas *</label>
                      <input type="text" name="paginas" value={formEdicion.paginas} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                  </>
                )}

                {(formEdicion.tipo_fuente === 'pagina_web' || formEdicion.tipo_fuente === 'video') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Consulta</label>
                    <input type="date" name="fecha_consulta" value={formEdicion.fecha_consulta} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL del Recurso</label>
                  <input type="url" name="url" value={formEdicion.url} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DOI</label>
                  <input type="text" name="doi" value={formEdicion.doi} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={cerrarModalEdicion} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center" disabled={guardando}>
                  {guardando ? 'Actualizando Registro...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlReferencias;
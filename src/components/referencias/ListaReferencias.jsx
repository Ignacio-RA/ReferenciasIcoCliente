import { useEffect, useState } from 'react';
import api from '../../api/config';

function ListaReferencias() {
  const [referencias, setReferencias] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]); 
  const [autoresCatalogo, setAutoresCatalogo] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros activos en el cliente utilizando tus rutas de API
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroAutor, setFiltroAutor] = useState('');

  // Estados independientes por tarjeta (Manejados de forma segura con el ID de la referencia)
  const [formatos, setFormatos] = useState({});
  const [fechas, setFechas] = useState({});
  const [copiadoId, setCopiadoId] = useState(null);

  // Estados del Modal y Formulario Principal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);

  const [formReferencia, setFormReferencia] = useState({
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
    fecha_consulta: new Date().toISOString().split('T')[0],
    id_asignatura: '',
    autoresIds: [] 
  });

  // Microformulario de "Crear Autor en línea"
  const [mostrarNuevoAutorForm, setMostrarNuevoAutorForm] = useState(false);
  const [nuevoAutor, setNuevoAutor] = useState({ nombre: '', ap_paterno: '', ap_materno: '' });
  const [guardandoAutor, setGuardandoAutor] = useState(false);

  // CARGA DE DATOS (Adaptable a filtros por ruta)
  const cargarDatos = async (urlEspecifica = '/referencias') => {
    setCargando(true);
    try {
      // Cargamos las asignaturas y autores solo la primera vez si ya están poblados
      const promesas = [api.get(urlEspecifica)];
      if (asignaturas.length === 0) promesas.push(api.get('/asignaturas'));
      if (autoresCatalogo.length === 0) promesas.push(api.get('/autores').catch(() => ({ data: { autores: [] } })));

      const [resReferencias, resAsignaturas, resAutores] = await Promise.all(promesas);
      
      setReferencias(resReferencias.data.referencias || []);
      
      if (resAsignaturas) setAsignaturas(resAsignaturas.data.asignaturas || []);
      if (resAutores) setAutoresCatalogo(resAutores.data.autores || []);
      
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos en el sistema:', err);
      setError('No se pudieron recuperar las referencias del repositorio.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (filtroMateria) {
      setFiltroAutor(''); // Reseteamos el otro filtro para evitar colisiones
      cargarDatos(`/referencias/asignatura/${filtroMateria}`);
    } else if (filtroAutor) {
      setFiltroMateria('');
      cargarDatos(`/referencias/autor/${filtroAutor}`);
    } else {
      cargarDatos();
    }
  }, [filtroMateria, filtroAutor]);

  const handleFormatChange = (id, format) => {
    setFormatos(prev => ({ ...prev, [id]: format }));
  };

  const handleDateChange = (id, date) => {
    setFechas(prev => ({ ...prev, [id]: date }));
  };

  // FORMATO DE AUTORES EN TARJETAS
  const formatearAutores = (autoresReferencia) => {
    if (!autoresReferencia || autoresReferencia.length === 0) return 'Autor desconocido';
    return autoresReferencia.map(({ autor }) => {
      if (!autor) return 'Autor anónimo';
      const p_apellido = autor.ap_paterno || '';
      const m_apellido = autor.ap_materno ? ` ${autor.ap_materno}` : '';
      const nombre = autor.nombre ? `, ${autor.nombre}` : '';
      return `${p_apellido}${m_apellido}${nombre}`.trim();
    }).join('; ');
  };

  // GENERACIÓN DE CITAS
  const generarCadenaCita = (ref) => {
    const formatoActual = formatos[ref.id_referencia] || 'APA';
    const fechaConsulta = fechas[ref.id_referencia] || new Date().toISOString().split('T')[0];
    const autores = formatearAutores(ref.autor_referencia);
    const anio = ref.anio_publicacion || 's.f.';

    if (formatoActual === 'APA') {
      return `${autores} (${anio}). ${ref.titulo}. Recuperado el ${fechaConsulta} de: ${ref.url || 'N/A'}`;
    } else if (formatoActual === 'IEEE') {
      return `${autores}, "${ref.titulo}," [En línea]. Disponible en: ${ref.url || 'N/A'}. [Consultado: ${fechaConsulta}].`;
    } else if (formatoActual === 'ACM') {
      return `${autores}. ${anio}. ${ref.titulo}. URL: ${ref.url || 'N/A'} (consultado el ${fechaConsulta}).`;
    }
    return '';
  };

  const copiarAlPortapapeles = (ref) => {
    const textoACopiar = generarCadenaCita(ref);
    navigator.clipboard.writeText(textoACopiar)
      .then(() => {
        setCopiadoId(ref.id_referencia);
        setTimeout(() => setCopiadoId(null), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormReferencia(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAutorExistente = (e) => {
    const idSeleccionado = parseInt(e.target.value, 10);
    if (!idSeleccionado) return;

    if (!formReferencia.autoresIds.includes(idSeleccionado)) {
      setFormReferencia(prev => ({
        ...prev,
        autoresIds: [...prev.autoresIds, idSeleccionado]
      }));
    }
    e.target.value = ""; 
  };

  const removerAutorId = (idParaQuitar) => {
    setFormReferencia(prev => ({
      ...prev,
      autoresIds: prev.autoresIds.filter(id => id !== idParaQuitar)
    }));
  };

  // REGISTRO DE NUEVO AUTOR EN LÍNEA
  const handleCrearAutorEnLinea = (e) => {
    e.preventDefault();
    if (!nuevoAutor.nombre.trim() || !nuevoAutor.ap_paterno.trim()) {
      alert('Nombre y Apellido Paterno son obligatorios para registrar al autor.');
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
      
      setFormReferencia(prev => ({
        ...prev,
        autoresIds: [...prev.autoresIds, nuevoId]
      }));

      setNuevoAutor({ nombre: '', ap_paterno: '', ap_materno: '' });
      setMostrarNuevoAutorForm(false);
    })
    .catch(err => {
      console.error(err);
      alert('Error al dar de alta al autor.');
    })
    .finally(() => setGuardandoAutor(false));
  };

  // ENVÍO DE LA REFERENCIA
  const handleGuardarReferencia = (e) => {
    e.preventDefault();
    setErrorFormulario(null);

    const { 
      tipo_fuente, titulo, anio_publicacion, editorial, url, 
      doi, volumen, numero, paginas, ciudad_pais, fecha_consulta, 
      id_asignatura, autoresIds 
    } = formReferencia;

    if (!titulo.trim() || !id_asignatura || autoresIds.length === 0) {
      setErrorFormulario('El título, la asignatura y al menos un autor son obligatorios.');
      return;
    }

    if (tipo_fuente === 'libro' && (!anio_publicacion.trim() || !editorial.trim() || !ciudad_pais.trim())) {
      setErrorFormulario("Para fuentes de tipo 'libro', el año, la editorial y el país/ciudad son obligatorios.");
      return;
    }
    if (tipo_fuente === 'articulo' && (!anio_publicacion.trim() || !volumen || !numero || !paginas.trim())) {
      setErrorFormulario("Para fuentes de tipo 'articulo', el año, volumen, número y páginas son obligatorios.");
      return;
    }
    if (tipo_fuente === 'pagina_web' && (!url.trim() || !fecha_consulta || !anio_publicacion.trim())) {
      setErrorFormulario("Para fuentes de tipo 'pagina_web', la URL, el año de publicación y la fecha de consulta son obligatorios.");
      return;
    }

    setGuardando(true);
    const idUsuarioSesion = localStorage.getItem('id_usuario') ? parseInt(localStorage.getItem('id_usuario'), 10) : 1;

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
      autores: autoresIds 
    };

    api.post('/referencias', payload)
      .then(() => {
        setFiltroMateria('');
        setFiltroAutor('');
        cargarDatos(); 
        cerrarModalPrincipal();
      })
      .catch(err => {
        console.error(err);
        setErrorFormulario(err.response?.data?.msg || 'Ocurrió un problema en el servidor al almacenar la referencia.');
      })
      .finally(() => setGuardando(false));
  };

  const cerrarModalPrincipal = () => {
    setModalAbierto(false);
    setFormReferencia({
      tipo_fuente: 'libro', titulo: '', anio_publicacion: '', editorial: '',
      url: '', doi: '', volumen: '', numero: '', paginas: '',
      ciudad_pais: '', fecha_consulta: new Date().toISOString().split('T')[0],
      id_asignatura: '', autoresIds: []
    });
    setMostrarNuevoAutorForm(false);
    setErrorFormulario(null);
  };

  const resetearFiltros = () => {
    setFiltroMateria('');
    setFiltroAutor('');
  };

  if (cargando && referencias.length === 0) return <div className="text-slate-500 font-medium p-4">Cargando repositorio de referencias...</div>;
  if (error) return <div className="text-red-500 font-medium p-4 bg-red-50 rounded-xl border border-red-200">{error}</div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* HEADER GLOBAL */}
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Repositorio Estudiantil</span>
          <h3 className="text-2xl font-bold tracking-tight">Referencias Bibliográficas</h3>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium border border-slate-700">
            Referencias visibles: {referencias.length}
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-xl text-sm shadow-xs hover:bg-green-700 transition-all cursor-pointer transform active:scale-95"
          >
            Nueva Referencia
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS DINÁMICOS */}
      <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 w-full sm:w-auto">Filtrar por:</div>
        
        <div className="w-full sm:w-1/3">
          <select 
            value={filtroMateria} 
            onChange={(e) => setFiltroMateria(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="">-- Todas las Asignaturas --</option>
            {asignaturas.map(asig => (
              <option key={asig.id_asignatura} value={asig.id_asignatura}>[{asig.clave}] {asig.nombre}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-1/3">
          <select 
            value={filtroAutor} 
            onChange={(e) => setFiltroAutor(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="">-- Todos los Autores --</option>
            {autoresCatalogo.map(aut => (
              <option key={aut.id_autor} value={aut.id_autor}>{aut.ap_paterno} {aut.ap_materno || ''}, {aut.nombre}</option>
            ))}
          </select>
        </div>

        {(filtroMateria || filtroAutor) && (
          <button 
            onClick={resetearFiltros}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer w-full sm:w-auto text-left sm:text-center"
          >
            Limpiar filtros ✕
          </button>
        )}
      </div>

      {/* REJILLA DE REFERENCIAS */}
      {cargando ? (
        <div className="text-center py-12 text-slate-500 font-medium">Actualizando vista...</div>
      ) : referencias.length === 0 ? (
        <div className="p-12 bg-slate-100 rounded-xl text-center text-slate-500 border border-dashed border-slate-300">
          No se encontraron referencias bajo el criterio seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {referencias.map((ref) => {
            const formatoSeleccionado = formatos[ref.id_referencia] || 'APA';
            const fechaSeleccionada = fechas[ref.id_referencia] || new Date().toISOString().split('T')[0];

            return (
              <div key={ref.id_referencia} className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-all">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {ref.tipo_fuente?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 truncate max-w-45">
                      {ref.asignatura?.nombre || 'General'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 leading-snug mb-2">{ref.titulo}</h4>
                  <p className="text-sm font-medium text-slate-600 mb-4">
                    ✍️ <span className="italic">{formatearAutores(ref.autor_referencia)}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>📅 Año: <span className="font-medium text-slate-700">{ref.anio_publicacion}</span></div>
                    <div>📄 Páginas: <span className="font-medium text-slate-700">{ref.paginas || 'N/A'}</span></div>
                    {ref.editorial && <div>🏢 Editorial: <span className="font-medium text-slate-700">{ref.editorial}</span></div>}
                    {ref.volumen && <div>🔢 Vol/Num: <span className="font-medium text-slate-700">{ref.volumen}({ref.numero || 0})</span></div>}
                    <div className="col-span-2 truncate">
                      🔗 URL: {ref.url ? <a href={ref.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{ref.url}</a> : <span className="text-slate-400">No contiene</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Consulta</label>
                      <input type="date" value={fechaSeleccionada} onChange={(e) => handleDateChange(ref.id_referencia, e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Formato</label>
                      <select value={formformatoSeleccionado => formatoSeleccionado} onChange={(e) => handleFormatChange(ref.id_referencia, e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-blue-500 font-medium">
                        <option value="APA">APA</option>
                        <option value="IEEE">IEEE</option>
                        <option value="ACM">ACM</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => copiarAlPortapapeles(ref)} className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${copiadoId === ref.id_referencia ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'}`}>
                    {copiadoId === ref.id_referencia ? '¡Copiado con éxito!' : 'Copiar Cita'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL MAESTRO: REGISTRO DE REFERENCIA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden transform transition-all">
            
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-800">Registrar Referencia Bibliográfica</h4>
              <button onClick={cerrarModalPrincipal} className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleGuardarReferencia} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {errorFormulario && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">{errorFormulario}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de Fuente */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Fuente *</label>
                  <select name="tipo_fuente" value={formReferencia.tipo_fuente} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium cursor-pointer">
                    <option value="libro">Libro 📘</option>
                    <option value="articulo">Artículo Científico / Revista 📄</option>
                    <option value="pagina_web">Página Web 🌐</option>
                    <option value="video">Video / Multimedia 🎥</option>
                  </select>
                </div>

                {/* Asignatura Relacionada */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asignatura Relacionada *</label>
                  <select name="id_asignatura" value={formReferencia.id_asignatura} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium cursor-pointer">
                    <option value="" disabled>-- Selecciona la materia --</option>
                    {asignaturas.map(asig => (
                      <option key={asig.id_asignatura} value={asig.id_asignatura}>[{asig.clave}] {asig.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Obra / Recurso *</label>
                <input type="text" name="titulo" value={formReferencia.titulo} onChange={handleInputChange} placeholder="Ej. El Imperio de los Datos" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
              </div>

              {/* SECCIÓN DE AUTORES */}
              <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Autores Vinculados *</label>
                  <button 
                    type="button" 
                    onClick={() => setMostrarNuevoAutorForm(!mostrarNuevoAutorForm)}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    {mostrarNuevoAutorForm ? '← Volver al catálogo' : '+ ¿No encuentras al autor? Regístralo'}
                  </button>
                </div>

                {!mostrarNuevoAutorForm ? (
                  <div>
                    <select 
                      onChange={handleSelectAutorExistente}
                      defaultValue=""
                      className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="" disabled>-- Busca y selecciona un autor para añadirlo --</option>
                      {autoresCatalogo.map(aut => (
                        <option key={aut.id_autor} value={aut.id_autor}>
                          {aut.ap_paterno} {aut.ap_materno || ''}, {aut.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                    <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide block">Rápido: Alta de nuevo autor</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" placeholder="Nombre(s)" value={nuevoAutor.nombre} onChange={(e) => setNuevoAutor(prev => ({ ...prev, nombre: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Ap. Paterno" value={nuevoAutor.ap_paterno} onChange={(e) => setNuevoAutor(prev => ({ ...prev, ap_paterno: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Ap. Materno" value={nuevoAutor.ap_materno} onChange={(e) => setNuevoAutor(prev => ({ ...prev, ap_materno: e.target.value }))} className="text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setMostrarNuevoAutorForm(false)} className="px-3 py-1.5 text-xs text-slate-500 font-semibold hover:bg-slate-100 rounded-lg">Cancelar</button>
                      <button type="button" onClick={handleCrearAutorEnLinea} disabled={guardandoAutor} className="px-3 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 font-semibold rounded-lg disabled:bg-purple-400">
                        {guardandoAutor ? 'Guardando...' : 'Confirmar e Insertar'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {formReferencia.autoresIds.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Ningún autor seleccionado todavía.</span>
                  ) : (
                    formReferencia.autoresIds.map(id => {
                      const autorObj = autoresCatalogo.find(a => a.id_autor === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                          {autorObj ? `${autorObj.ap_paterno}, ${autorObj.nombre}` : `ID: ${id}`}
                          <button 
                            type="button" 
                            onClick={() => removerAutorId(id)}
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

              {/* CAMPOS DINÁMICOS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año Publicación</label>
                  <input type="text" name="anio_publicacion" value={formReferencia.anio_publicacion} onChange={handleInputChange} placeholder="Ej. 2024 o s.f." className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>

                {formReferencia.tipo_fuente === 'libro' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Editorial *</label>
                      <input type="text" name="editorial" value={formReferencia.editorial} onChange={handleInputChange} placeholder="Alfaomega" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ciudad / País *</label>
                      <input type="text" name="ciudad_pais" value={formReferencia.ciudad_pais} onChange={handleInputChange} placeholder="México" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                  </>
                )}

                {formReferencia.tipo_fuente === 'articulo' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Volumen *</label>
                      <input type="number" name="volumen" value={formReferencia.volumen} onChange={handleInputChange} placeholder="Vol" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número *</label>
                      <input type="number" name="numero" value={formReferencia.numero} onChange={handleInputChange} placeholder="No." className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Páginas *</label>
                      <input type="text" name="paginas" value={formReferencia.paginas} onChange={handleInputChange} placeholder="Ej. 12-25" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                  </>
                )}

                {(formReferencia.tipo_fuente === 'pagina_web' || formReferencia.tipo_fuente === 'video') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Consulta *</label>
                    <input type="date" name="fecha_consulta" value={formReferencia.fecha_consulta} onChange={handleInputChange} className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                  </div>
                )}
              </div>

              {/* URL y DOI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL del Recurso {formReferencia.tipo_fuente === 'pagina_web' && '*'}</label>
                  <input type="url" name="url" value={formReferencia.url} onChange={handleInputChange} placeholder="https://..." className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DOI (Identificador Digital)</label>
                  <input type="text" name="doi" value={formReferencia.doi} onChange={handleInputChange} placeholder="Ej. 10.1000/xyz123" className="w-full text-sm bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={cerrarModalPrincipal} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center" disabled={guardando}>
                  {guardando ? 'Guardando Referencia...' : 'Guardar Referencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaReferencias;
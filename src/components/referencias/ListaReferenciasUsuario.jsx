import { useEffect, useState } from 'react';
import api from '../../api/config'; // Tu configuración de Axios

function ListaReferenciasUsuario() {
  const [referencias, setReferencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados locales por tarjeta para la interacción del usuario
  const [formatos, setFormatos] = useState({});
  const [fechas, setFechas] = useState({});
  const [copiadoId, setCopiadoId] = useState(null);

  useEffect(() => {
    setCargando(true);
    // Recuperamos el ID directamente del localStorage
    const idUsuarioLogueado = localStorage.getItem('id_usuario')

    // Validación por seguridad: si no existe, puedes redirigir al login o mostrar un error
    if (!idUsuarioLogueado) {
        setError('No se encontró una sesión activa. Por favor, inicia sesión.');
        setCargando(false);
        return;
    }

    // Petición a tu ruta específica de historial por usuario
    api.get(`/referencias/usuario/${idUsuarioLogueado}`)
      .then(response => {
        const datosRef = response.data.referencias || [];
        setReferencias(datosRef);

        // MAPEO DE FECHAS: Inicializamos el estado 'fechas' con lo que traiga la API
        const fechasIniciales = {};
        datosRef.forEach(ref => {
          if (ref.fecha_consulta) {
            // Si la API trae fecha (ej: "2026-05-20T00:00:00.000Z"), la recortamos a "YYYY-MM-DD" para el input date
            fechasIniciales[ref.id_referencia] = ref.fecha_consulta.split('T')[0];
          } else {
            // Si viene null, le asignamos la fecha del día de hoy como respaldo por defecto
            fechasIniciales[ref.id_referencia] = new Date().toISOString().split('T')[0];
          }
        });
        setFechas(fechasIniciales);
        
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al obtener el historial de referencias:', err);
        setError('No se pudo recuperar tu historial de referencias bibliográficas.');
        setCargando(false);
      });
  }, []);

  const handleFormatChange = (id, format) => {
    setFormatos(prev => ({ ...prev, [id]: format }));
  };

  const handleDateChange = (id, date) => {
    setFechas(prev => ({ ...prev, [id]: date }));
  };

  // Mismo formateador que respeta tu estructura: "ApellidoP ApellidoM, Nombre"
  const formatearAutores = (autoresReferencia) => {
    if (!autoresReferencia || autoresReferencia.length === 0) return 'Autor desconocido';

    return autoresReferencia.map(({ autor }) => {
      const p_apellido = autor.ap_paterno || '';
      const m_apellido = autor.ap_materno ? ` ${autor.ap_materno}` : '';
      const nombre = autor.nombre ? `, ${autor.nombre}` : '';
      return `${p_apellido}${m_apellido}${nombre}`.trim();
    }).join('; ');
  };

  const generarCadenaCita = (ref) => {
    const formatoActual = formatos[ref.id_referencia] || 'APA';
    // Usamos la fecha del estado local (que ya tiene el valor de la API o el fallback de hoy)
    const fechaConsulta = fechas[ref.id_referencia]; 
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

  if (cargando) {
    return <div className="text-slate-500 font-medium p-4">Cargando tu historial de referencias...</div>;
  }

  if (error) {
    return <div className="text-red-500 font-medium p-4 bg-red-50 rounded-xl border border-red-200">{error}</div>;
  }

  if (referencias.length === 0) {
    return (
      <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
        Aún no has registrado ninguna referencia en tu historial.
      </div>
    );
  }

  // Obtenemos el nombre del usuario directamente del JSON de respuesta para personalizar la vista
  const nombreUsuario = referencias[0]?.usuario?.nombre || 'Usuario';

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      {/* HEADER PERSONALIZADO */}
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-green-400">Mi Espacio de Trabajo</span>
          <h3 className="text-2xl font-bold tracking-tight">Historial de Citas de {nombreUsuario}</h3>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium border border-slate-700">
          Guardadas: {referencias.length}
        </div>
      </div>

      {/* GRID DE REFERENCIAS PROPIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {referencias.map((ref) => {
          const formatoSeleccionado = formatos[ref.id_referencia] || 'APA';
          const fechaSeleccionada = fechas[ref.id_referencia] || '';

          return (
            <div 
              key={ref.id_referencia}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* CUERPO DE LA TARJETA */}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {ref.tipo_fuente?.replace('_', ' ')}
                  </span>
                  
                  {/* Badge de la asignatura a la que pertenece */}
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 truncate max-w-45">
                    {ref.asignatura?.nombre || 'General'}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-800 leading-snug mb-2">
                  {ref.titulo}
                </h4>

                <p className="text-sm font-medium text-slate-600 mb-4">
                  ✍️ <span className="italic">{formatearAutores(ref.autor_referencia)}</span>
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>📅 Año: <span className="font-medium text-slate-700">{ref.anio_publicacion}</span></div>
                  <div>📄 Páginas: <span className="font-medium text-slate-700">{ref.paginas || 'N/A'}</span></div>
                  <div className="col-span-2 truncate">
                    🔗 URL: <a href={ref.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{ref.url || 'No contiene'}</a>
                  </div>
                </div>
              </div>

              {/* FOOTER INTERACTIVO */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha Consulta</label>
                    <input 
                      type="date"
                      value={fechaSeleccionada}
                      onChange={(e) => handleDateChange(ref.id_referencia, e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Formato</label>
                    <select
                      value={formatoSeleccionado}
                      onChange={(e) => handleFormatChange(ref.id_referencia, e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="APA">APA</option>
                      <option value="IEEE">IEEE</option>
                      <option value="ACM">ACM</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => copiarAlPortapapeles(ref)}
                  className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    copiadoId === ref.id_referencia
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {copiadoId === ref.id_referencia ? '¡Copiado con éxito!' : 'Copiar Cita'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ListaReferenciasUsuario;
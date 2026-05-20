import { useEffect, useState } from 'react';
import api from '../../api/config';

function ListaReferencias() {
  const [referencias, setReferencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados independientes por tarjeta usando el id_referencia como llave
  const [formatos, setFormatos] = useState({});
  const [fechas, setFechas] = useState({});
  const [copiadoId, setCopiadoId] = useState(null);

  // PETICIÓN DIRECTA A LA API
  useEffect(() => {
    setCargando(true);
    
    // Llamada limpia a tu ruta global de referencias
    api.get('/referencias')
      .then(response => {
        setReferencias(response.data.referencias || []);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al obtener el catálogo de referencias:', err);
        setError('No se pudieron recuperar las referencias del sistema.');
        setCargando(false);
      });
  }, []); // Se ejecuta una sola vez al montar la vista

  // Manejadores de los selectores por tarjeta
  const handleFormatChange = (id, format) => {
    setFormatos(prev => ({ ...prev, [id]: format }));
  };

  const handleDateChange = (id, date) => {
    setFechas(prev => ({ ...prev, [id]: date }));
  };

  // Formateador: "ApellidoPérz ApellidoM, Nombre"
  const formatearAutores = (autoresReferencia) => {
    if (!autoresReferencia || autoresReferencia.length === 0) return 'Autor desconocido';

    return autoresReferencia.map(({ autor }) => {
      const p_apellido = autor.ap_paterno || '';
      const m_apellido = autor.ap_materno ? ` ${autor.ap_materno}` : '';
      const nombre = autor.nombre ? `, ${autor.nombre}` : '';
      return `${p_apellido}${m_apellido}${nombre}`.trim();
    }).join('; ');
  };

  // Generador dinámico de texto para el portapapeles
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

  if (cargando) {
    return <div className="text-slate-500 font-medium p-4">Cargando repositorio de referencias...</div>;
  }

  if (error) {
    return <div className="text-red-500 font-medium p-4 bg-red-50 rounded-xl border border-red-200">{error}</div>;
  }

  if (referencias.length === 0) {
    return (
      <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
        No se encontraron referencias registradas en el sistema.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      {/* HEADER GLOBAL */}
      <div className="mb-6 bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Repositorio Global</span>
          <h3 className="text-2xl font-bold tracking-tight">Referencias Bibliográficas</h3>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl text-xs font-medium border border-slate-700">
          📋 Total del sistema: {referencias.length}
        </div>
      </div>

      {/* REJILLA DE TARJETAS */}
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
                  
                  {/* Muestra la asignatura vinculada directamente en la tarjeta */}
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 truncate max-w-[180px]">
                    📚 {ref.asignatura?.nombre || 'General'}
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

              {/* FOOTER DE LA TARJETA */}
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
                  {copiadoId === ref.id_referencia ? '📋 ¡Copiado con éxito!' : '🔗 Copiar Cita'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ListaReferencias;
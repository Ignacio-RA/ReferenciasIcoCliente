import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import ListaAsignaturas from '../components/asignatura/ListaAsignaturas'
import ControlAsignaturas from '../components/asignatura/ControlAsignaturas';
import ListaAreas from '../components/area/ListaAreas'
import ListaAutores from '../components/autor/ListaAutores'
import ControlAutores from '../components/autor/ControlAutores'
import ListaReferencias from '../components/referencias/ListaReferencias'
import ListaReferenciasUsuario from '../components/referencias/ListaReferenciasUsuario'
import ControlReferencias from '../components/referencias/ControlReferencias';
import ControlUsuarios from '../components/usuario/ControlUsuario';

function Dashboard() {
  const navigate = useNavigate()
  // Estado para saber qué pestaña está activa. Por defecto iniciamos en 'panel'
  const [vistaActiva, setVistaActiva] = useState('panel')
  // Recuperamos el valor del localStorage. Si es la cadena 'true', el estado será verdadero (boolean)
  const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  // Función para cerrar sesión
  const handleLogout = () => {
    // Borramos el token y la información de admin guardada en el localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('id_usuario')
    // Lo mandamos de vuelta al Login
    navigate('/');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* 1. MENÚ LATERAL (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-5 shadow-xl">
        <div>
          {/* Logo / Título del Sistema */}
          <div className="mb-8 px-2">
            <h1 className="text-xl font-bold text-white tracking-wide">RefManager</h1>
            <p className="text-xs text-slate-400">Sistema de Referencias</p>
          </div>

          {/* Lista de Acciones con cambio de estado */}
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setVistaActiva('panel')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
                vistaActiva === 'panel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Panel Principal
            </button>

            <button 
              onClick={() => setVistaActiva('asignaturas')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
                vistaActiva === 'asignaturas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Asignaturas
            </button>

            <button 
              onClick={() => setVistaActiva('autores')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
                vistaActiva === 'autores' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Autores
            </button>

            <button 
              onClick={() => setVistaActiva('generar')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
                vistaActiva === 'generar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
             Citas
            </button>

            <button 
              onClick={() => setVistaActiva('historial')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
                vistaActiva === 'historial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Historial
            </button>

            {/* ACCIÓN CONDICIONADA: Solo visible si el usuario es Administrador */}
            {isAdmin && (
              <button 
                onClick={() => setVistaActiva('controlAreas')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer border border-dashed border-amber-500/30 ${
                  vistaActiva === 'controlAreas' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Control de Áreas
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setVistaActiva('controlAsignaturas')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer border border-dashed border-amber-500/30 ${
                  vistaActiva === 'controlAsignaturas' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Control de Asignaturas
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setVistaActiva('controlAutores')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer border border-dashed border-amber-500/30 ${
                  vistaActiva === 'controlAutores' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Control de Autores 
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setVistaActiva('controlReferencias')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer border border-dashed border-amber-500/30 ${
                  vistaActiva === 'controlReferencias' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Control de Referencias 
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setVistaActiva('controlUsuarios')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer border border-dashed border-amber-500/30 ${
                  vistaActiva === 'controlUsuarios' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                Control de Usuarios
              </button>
            )}

          </nav>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 font-medium py-3 px-4 rounded-xl transition-all cursor-pointer text-left flex items-center gap-3"
        >
          Cerrar Sesión
        </button>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL DINÁMICA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {vistaActiva === 'panel' && 'Bienvenido al Panel'}
            {vistaActiva === 'asignaturas' && 'Lista de asignaturas'}
            {vistaActiva === 'autores' && 'Lista de autores'}
            {vistaActiva === 'generar' && 'Generador de Referencias'}
            {vistaActiva === 'historial' && 'Historial de Consultas'}
            {vistaActiva === 'controlAreas' && 'Control de Áreas'}
            {vistaActiva === 'controlAsignaturas' && 'Control de Asignaturas'}
            {vistaActiva === 'controlAutores' && 'Control de Autores'}
            {vistaActiva === 'controlReferencias' && 'Control de Referencias'}
            {vistaActiva === 'controlUsuarios' && 'Control de Usuarios'}
          </h2>
          
          {/* ETIQUETA DINÁMICA: Cambia el diseño y texto según el rol */}
          {isAdmin ? (
            <span className="text-sm bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full shadow-xs border border-amber-200">
              Administrador
            </span>
          ) : (
            <span className="text-sm bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full">
              Alumno
            </span>
          )}
        </header>

        {/* RENDERIZADO CONDICIONAL: Dependiendo de 'vistaActiva' mostramos una cosa u otra */}
        <div className="animate-fade-in">
          
          {/* VISTA: PANEL PRINCIPAL CON RECUADROS DE ACCESO DIRECTO */}
          {vistaActiva === 'panel' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                <p className="text-slate-600 font-medium">
                  Selecciona una de las siguientes secciones para empezar a gestionar tus referencias bibliográficas:
                </p>
              </div>

              {/* Grid de Cards Navegables */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card Asignaturas */}
                <button 
                  onClick={() => setVistaActiva('asignaturas')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-500 transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-slate-400 group-hover:text-blue-600 font-bold transition-all">→</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Asignaturas</h3>
                    <p className="text-xs text-slate-500">Explora el catálogo de materias disponibles en el sistema.</p>
                  </div>
                </button>

                {/* Card Autores */}
                <button 
                  onClick={() => setVistaActiva('autores')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-slate-400 group-hover:text-emerald-600 font-bold transition-all">→</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Autores</h3>
                    <p className="text-xs text-slate-500">Consulta los investigadores y escritores registrados.</p>
                  </div>
                </button>

                {/* Card Generar Citas */}
                <button 
                  onClick={() => setVistaActiva('generar')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-violet-500 transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-slate-400 group-hover:text-violet-600 font-bold transition-all">→</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Generar Citas</h3>
                    <p className="text-xs text-slate-500">Crea o obten fichas y referencias bibliográficas en formatos oficiales.</p>
                  </div>
                </button>

                {/* Card Historial */}
                <button 
                  onClick={() => setVistaActiva('historial')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-slate-400 group-hover:text-indigo-600 font-bold transition-all">→</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Historial</h3>
                    <p className="text-xs text-slate-500">Revisa tus consultas generadas anteriormente.</p>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* Si está en 'asignaturas', inyectamos las Cards de asignaturas*/}
          {vistaActiva === 'asignaturas' && (
            <ListaAsignaturas />
          )}

          {/* Si está en 'autores', inyectamos las Cards de autores*/}
          {vistaActiva === 'autores' && (
            <ListaAutores />
          )}

          {/* Vistas temporales para las otras opciones */}
          {vistaActiva === 'generar' && (
            <ListaReferencias />
          )}

          {vistaActiva === 'historial' && (
            <ListaReferenciasUsuario />
          )}

          {vistaActiva === 'controlAreas' && (
            <ListaAreas />
          )}

          {vistaActiva === 'controlAsignaturas' && (
            <ControlAsignaturas />
          )}

          {vistaActiva === 'controlAutores' && (
            <ControlAutores />
          )}

          {vistaActiva === 'controlReferencias' && (
            <ControlReferencias />
          )}

          {vistaActiva === 'controlUsuarios' && (
            <ControlUsuarios />
          )}

        </div>
      </main>

    </div>
  );
}

export default Dashboard;
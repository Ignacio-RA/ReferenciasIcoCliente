import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import ListaAsignaturas from '../components/ListaAsignaturas'
import ListaAreas from '../components/area/ListaAreas'
import ListaAutores from '../components/autor/ListaAutores'
import ListaReferencias from '../components/referencias/ListaReferencias'

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
              📊 Panel Principal
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
          
          {/* Si está en 'panel', muestra el mensaje de bienvenida o lo que vayas a diseñar ahí */}
          {vistaActiva === 'panel' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-600">
                Este es tu panel principal. Aquí podrás ver estadísticas, tus últimas citas generadas o un resumen general del sistema próximamente.
              </p>
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
            <div className="text-slate-500">Historial de referencias generadas por el usuario (Próximamente).</div>
          )}

        </div>
      </main>

    </div>
  );
}

export default Dashboard;
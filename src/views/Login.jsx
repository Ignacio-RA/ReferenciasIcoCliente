import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config'; // Tu configuración de Axios

function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para manejar el estado de la petición
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Enviar las credenciales a la API para autenticación
      const response = await api.post('usuarios/login', {
        correo,
        password
      });

      // Extraer el token e informacion de admin de la respuesta
      const token = response.data.token;
      const isAdmin = response.data.usuario.admin;
      const id_usuario = response.data.usuario.id_usuario;

      if (token) {
        // Guardar el JWT y la información de admin en el localStorage del navegador
        localStorage.setItem('token', token);
        localStorage.setItem('isAdmin', isAdmin);
        localStorage.setItem('id_usuario', id_usuario);

        // Redirigir con éxito al Dashboard
        navigate('/dashboard');
      } else {
        setError('La API no devolvió un token válido.');
      }

    } catch (err) {
      console.error('Error en el inicio de sesión:', err);
      // Capturar el mensaje de error que configuraste en tu backend (ej: "Contraseña incorrecta")
      const mensajeError = err.response?.data?.msg || 'Error al conectar con el servidor. Inténtalo más tarde.';
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-slate-100 font-sans p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">¡Bienvenido!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Ingresa tus credenciales para acceder al Sistema de Referencias
          </p>
        </div>

        {/* Alerta de Error de tu API */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Campo de Correo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              disabled={cargando}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 placeholder-slate-400 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-600">Contraseña</label>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={cargando}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 placeholder-slate-400 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Botón de Acción */}
          <button 
            type="submit" 
            disabled={cargando}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-blue-200 hover:shadow-none transition-all duration-200 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <span>¿No tienes una cuenta? </span>
          <span>Contacta con un administrador para crear una.</span>
          {/* <a href="#registro" className="text-blue-600 font-medium hover:underline">Regístrate aquí</a> */}
        </div>

      </div>
    </div>
  );
}

export default Login;
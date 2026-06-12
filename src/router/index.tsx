import { createBrowserRouter } from 'react-router-dom';

import App from '../App';
import { Inicio } from '../pages/Inicio';
import Rotas from '../pages/rotas';
import Notificacoes from '../pages/notificacoes';
import { Perfil } from '../pages/Perfil';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/option',
    element: <Inicio />,
  },
  {
    path: '/rotas',
    element: <Rotas />,
  },
  {
    path: '/notificacoes',
    element: <Notificacoes />,
  },
  {
    path: '/perfil',
    element: <Perfil />,
  },
]);

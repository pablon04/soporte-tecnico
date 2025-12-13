import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Solo prerenderizar rutas estáticas sin parámetros
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/log-in',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/sign-up',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/password-recovery',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/update-password',
    renderMode: RenderMode.Prerender
  },
  // Todo lo demás usar Client Side Rendering para Vercel
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];

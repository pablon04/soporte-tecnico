import { Routes } from '@angular/router';



import { privateGuard, publicGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'auth',
        canActivate: [publicGuard],
        loadChildren: () => import('./auth/features/auth-shell/auth-routing')   
    },
    {
        path: 'ticket',
        canActivate: [privateGuard],
        loadChildren: () => import('./tickets/tickets.routes')
    },
    {
        path: '',
        redirectTo: '/ticket',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/ticket'
    }
];

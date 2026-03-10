import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./features/ticket-list/ticket-list')
    },
    {
        path: 'create',
        loadComponent: () => import('./features/create-ticket/create-ticket')
    },
    {
        path: 'settings',
        loadComponent: () => import('./features/profile-settings/profile-settings')
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin-dashboard/admin-dashboard')
    },
    {
        path: ':id',
        loadComponent: () => import('./features/ticket-detail/ticket-detail')
    }
] as Routes;
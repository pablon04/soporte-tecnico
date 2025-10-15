import { Routes } from "@angular/router"; 
import path from "path";

export default[
    {
        path: 'sign-up',
        loadComponent: () => import('../sign-up/sign-up')
    },
    {
        path: 'log-in',
        loadComponent: () => import('../log-in/log-in')
    },
    {
        path: 'password-recovery',
        loadComponent: () => import('../password-recovery/password-recovery')
    },
    {
        path: 'update-password',
        loadComponent: () => import('../update-password/update-password')
    },
    {
        path: '**',
        redirectTo: 'log-in'
    }
] as Routes;
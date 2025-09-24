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
        path: '**',
        redirectTo: 'log-in'
    }
] as Routes;
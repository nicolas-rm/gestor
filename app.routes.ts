import { Routes } from '@angular/router';


/* Auth */
const auth: Routes = [
    { path: '', title: 'Gestor Inmobiliario', loadComponent: () => import('./auth/login/login.component') },
    { path: 'registro', title: 'Registrar', loadComponent: () => import('./auth/register/register.component') },
    { path: 'suspencion', title: 'Pantalla Bloqueo', loadComponent: () => import('./auth/lockscreen/lockscreen.component') }
]


/* Dashboard */
const dashboard: Routes = [
    {
        path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./pages/page.component'),
        children: [
            { path: '', title: 'Inicio', loadComponent: () => import('./pages/seccion/seccion.component') },
            { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
        ]
    }
]
export const routes: Routes = [
    /* Rutas de autenticacion */
    ...auth,
    /* Rutas del dashboard */
    ...dashboard,
    /*  Redireccionamiento a cualquier ruta que no exista, en cualquier nivel */
    { path: '**', loadComponent: () => import('./pages/not-found/not-found.component') }
];

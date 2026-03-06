import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/data-access/auth.service';
import { TicketService, Ticket } from '../../data-access/ticket.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.css'
})
export default class TicketList implements OnInit {
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _ticketService = inject(TicketService);
  private _cdr = inject(ChangeDetectorRef);

  tickets: Ticket[] = [];
  isLoading = false;
  error: string | null = null;
  currentUser: User | null = null;
  showProfileMenu = false;

  // Propiedades de filtro
  filter = {
    title: '',
    estado: '',
    departamento: ''
  };

  // Computed property para obtener tickets filtrados
  get filteredTickets(): Ticket[] {
    return this.tickets.filter(ticket => {
      let matches = true;

      // Filtrar por título
      if (this.filter.title) {
        matches = matches && ticket.title.toLowerCase().includes(this.filter.title.toLowerCase());
      }

      // Filtrar por estado
      if (this.filter.estado && this.filter.estado !== '') {
        matches = matches && ticket.status === this.filter.estado;
      }

      // Filtrar por departamento
      if (this.filter.departamento && this.filter.departamento !== '') {
        matches = matches && ticket.department === this.filter.departamento;
      }

      return matches;
    });
  }

  async ngOnInit() {
    await this.loadTickets();
    this.currentUser = await this._authService.getUserProfile();
  }

  get userInitial(): string {
    const name = this.currentUser?.user_metadata?.['full_name'] || this.currentUser?.email || '';
    return name.charAt(0).toUpperCase();
  }

  get userDisplayName(): string {
    return this.currentUser?.user_metadata?.['full_name'] || this.currentUser?.email || 'Usuario';
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  goToSettings() {
    this.showProfileMenu = false;
    this._router.navigateByUrl('/ticket/settings');
  }

  async loadTickets(forceReload: boolean = false) {
    try {
      this.isLoading = true;
      this.error = null;
      this.tickets = [];
      
      const { data, error } = await this._ticketService.getTickets(!forceReload);
      
      if (error) {
        throw error;
      }
      
      this.tickets = data || [];
      
    } catch (error: any) {
      console.error('Error cargando tickets:', error);
      this.error = error?.message || 'Error al cargar los tickets. Por favor intenta de nuevo.';
      this.tickets = [];
    } finally {
      this.isLoading = false;
      this._cdr.detectChanges();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Abierto':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'En progreso':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Cerrado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  getDepartmentClass(department: string): string {
    switch (department) {
      case 'Soporte Técnico':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Recursos Humanos':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Contabilidad':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Ventas':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Marketing':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'Administración':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'Desarrollo':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'General':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  // Lista de departamentos para el filtro
  departments = [
    'Soporte Técnico',
    'Recursos Humanos',
    'Contabilidad', 
    'Ventas',
    'Marketing',
    'Administración',
    'Desarrollo',
    'General'
  ];

  async logout() {
    try {
      await this._authService.signOut();
      this._router.navigateByUrl('/auth/log-in');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  onFilterTickets() {
    // Este método se ejecuta cuando el usuario hace submit del formulario de filtros
    // Como usamos getter computed, no necesitamos hacer nada aquí
    // pero podríamos agregar lógica adicional si es necesario
  }

  onRefreshTickets() {
    this.loadTickets(true);
  }
}
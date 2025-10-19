import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../auth/data-access/auth.service';
import { TicketService, Ticket } from '../../data-access/ticket.service';

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, DatePipe],
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

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets(forceReload: boolean = false) {
    try {
      this.isLoading = true;
      this.error = null;
      this.tickets = [];
      
      const { data, error } = await this._ticketService.getUserTickets(!forceReload);
      
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

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  async logout() {
    try {
      await this._authService.signOut();
      this._router.navigateByUrl('/auth/log-in');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  onRefreshTickets() {
    this.loadTickets(true);
  }
}
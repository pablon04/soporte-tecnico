import { Component, inject, OnInit } from '@angular/core';
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

  tickets: Ticket[] = [];
  isLoading = true;
  error: string | null = null;

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    try {
      this.isLoading = true;
      this.error = null;
      
      const { data, error } = await this._ticketService.getUserTickets();
      
      if (error) throw error;
      
      this.tickets = data || [];
    } catch (error) {
      console.error('Error loading tickets:', error);
      this.error = 'Error al cargar los tickets. Por favor intenta de nuevo.';
    } finally {
      this.isLoading = false;
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
}
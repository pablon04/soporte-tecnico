import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../auth/data-access/auth.service';
import { TicketService, Ticket } from '../../data-access/ticket.service';
import { User } from '@supabase/supabase-js';

interface DeptStats {
  name: string;
  abiertos: number;
  enProgreso: number;
  cerrados: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html'
})
export default class AdminDashboard implements OnInit {
  private _authService = inject(AuthService);
  private _ticketService = inject(TicketService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);

  tickets: Ticket[] = [];
  isLoading = false;
  error: string | null = null;
  currentUser: User | null = null;

  readonly departments = [
    'Soporte Técnico',
    'Recursos Humanos',
    'Contabilidad',
    'Ventas',
    'Marketing',
    'Administración',
    'Desarrollo',
    'General'
  ];

  async ngOnInit() {
    this.currentUser = await this._authService.getUserProfile();

    if (this.currentUser?.user_metadata?.['department'] !== 'General') {
      this._router.navigateByUrl('/ticket');
      return;
    }

    await this.loadTickets();
  }

  async loadTickets() {
    try {
      this.isLoading = true;
      const { data, error } = await this._ticketService.getTickets(false);
      if (error) throw error;
      this.tickets = data || [];
    } catch (err: any) {
      this.error = err?.message || 'Error al cargar los tickets.';
    } finally {
      this.isLoading = false;
      this._cdr.detectChanges();
    }
  }

  getDeptStats(): DeptStats[] {
    return this.departments.map(dept => ({
      name: dept,
      abiertos: this.tickets.filter(t => t.department === dept && t.status === 'Abierto').length,
      enProgreso: this.tickets.filter(t => t.department === dept && t.status === 'En progreso').length,
      cerrados: this.tickets.filter(t => t.department === dept && t.status === 'Cerrado').length
    }));
  }
}

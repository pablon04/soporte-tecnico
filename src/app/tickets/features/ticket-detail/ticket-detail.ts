import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TicketService, Ticket, TicketComment } from '../../data-access/ticket.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css'
})
export default class TicketDetail implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _ticketService = inject(TicketService);
  private _formBuilder = inject(FormBuilder);
  
  ticket: Ticket | null = null;
  comments: TicketComment[] = [];
  ticketId: string | null = null;
  isLoading = true;
  error: string | null = null;
  isUpdatingStatus = false;
  isAddingComment = false;

  // Formulario para comentarios
  commentForm = this._formBuilder.group({
    message: ['', [Validators.required, Validators.minLength(5)]]
  });

  async ngOnInit() {
    this.ticketId = this._route.snapshot.paramMap.get('id');
    if (this.ticketId) {
      await this.loadTicket(this.ticketId);
      await this.loadComments(this.ticketId);
    } else {
      this._router.navigateByUrl('/ticket');
    }
  }

  async loadTicket(id: string) {
    try {
      this.isLoading = true;
      this.error = null;

      const { data, error } = await this._ticketService.getTicketById(id);
      
      if (error) throw error;
      
      if (!data) {
        this._router.navigateByUrl('/ticket');
        return;
      }
      
      this.ticket = data;
    } catch (error) {
      console.error('Error loading ticket:', error);
      this.error = 'Error al cargar el ticket.';
    } finally {
      this.isLoading = false;
    }
  }

  async loadComments(ticketId: string) {
    try {
      const { data, error } = await this._ticketService.getTicketComments(ticketId);
      
      if (error) throw error;
      
      this.comments = data || [];
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async updateTicketStatus(newStatus: 'Abierto' | 'En progreso' | 'Cerrado') {
    if (!this.ticket || !this.ticketId) return;

    try {
      this.isUpdatingStatus = true;
      
      const { data, error } = await this._ticketService.updateTicket(this.ticketId, {
        status: newStatus
      });

      if (error) throw error;

      if (data) {
        this.ticket = { ...this.ticket, ...data };
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      this.error = 'Error al actualizar el estado del ticket.';
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  async addComment() {
    if (this.commentForm.invalid || !this.ticketId) return;

    try {
      this.isAddingComment = true;
      
      const { data, error } = await this._ticketService.createComment({
        ticket_id: this.ticketId,
        message: this.commentForm.value.message!
      });

      if (error) throw error;

      if (data) {
        this.comments.push(data);
        this.commentForm.reset();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      this.error = 'Error al agregar el comentario.';
    } finally {
      this.isAddingComment = false;
    }
  }

  async deleteTicket() {
    if (!this.ticketId || !confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await this._ticketService.deleteTicket(this.ticketId);

      if (error) throw error;

      this._router.navigateByUrl('/ticket');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      this.error = 'Error al eliminar el ticket.';
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
}
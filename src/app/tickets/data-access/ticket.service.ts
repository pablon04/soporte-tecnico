import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../shared/data-access/supabase.service';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Abierto' | 'En progreso' | 'Cerrado';
  priority: 'Baja' | 'Media' | 'Alta';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta';
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: 'Abierto' | 'En progreso' | 'Cerrado';
  priority?: 'Baja' | 'Media' | 'Alta';
}

export interface CreateCommentData {
  ticket_id: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private _supabase = inject(SupabaseService).supabaseClient;

  // =================== TICKETS ===================
  
  // Obtener todos los tickets del usuario
  async getUserTickets(): Promise<{ data: Ticket[] | null; error: any }> {
    return await this._supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
  }

  // Obtener un ticket específico
  async getTicketById(id: string): Promise<{ data: Ticket | null; error: any }> {
    const { data, error } = await this._supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  // Crear nuevo ticket
  async createTicket(ticketData: CreateTicketData): Promise<{ data: Ticket | null; error: any }> {
    const { data: { user } } = await this._supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'Usuario no autenticado' } };
    }

    const newTicket = {
      ...ticketData,
      user_id: user.id,
      status: 'Abierto' as const
    };

    const { data, error } = await this._supabase
      .from('tickets')
      .insert([newTicket])
      .select()
      .single();

    return { data, error };
  }

  // Actualizar ticket
  async updateTicket(id: string, updateData: UpdateTicketData): Promise<{ data: Ticket | null; error: any }> {
    const { data, error } = await this._supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  // Eliminar ticket
  async deleteTicket(id: string): Promise<{ error: any }> {
    const { error } = await this._supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    return { error };
  }

  // =================== COMENTARIOS ===================

  // Obtener comentarios de un ticket
  async getTicketComments(ticketId: string): Promise<{ data: TicketComment[] | null; error: any }> {
    return await this._supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
  }

  // Crear comentario
  async createComment(commentData: CreateCommentData): Promise<{ data: TicketComment | null; error: any }> {
    const { data: { user } } = await this._supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'Usuario no autenticado' } };
    }

    const newComment = {
      ...commentData,
      author_id: user.id,
      author_name: user.email || 'Usuario'
    };

    const { data, error } = await this._supabase
      .from('ticket_comments')
      .insert([newComment])
      .select()
      .single();

    return { data, error };
  }

  // Eliminar comentario
  async deleteComment(id: string): Promise<{ error: any }> {
    const { error } = await this._supabase
      .from('ticket_comments')
      .delete()
      .eq('id', id);

    return { error };
  }
}
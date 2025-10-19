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
  async getUserTickets(useCache: boolean = true): Promise<{ data: Ticket[] | null; error: any }> {
    console.log('🔍 Servicio: Iniciando getUserTickets');
    
    try {
      // Verificar usuario autenticado
      const { data: { user } } = await this._supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No user found');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      console.log(`🎯 Obteniendo tickets para usuario: ${user.id}`);

      // Ejecutar consulta optimizada - solo campos necesarios
      const { data, error } = await this._supabase
        .from('tickets')
        .select('id, title, description, status, priority, user_id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); // Reducir a 20 para cargar más rápido

      if (error) {
        console.error('❌ Error en consulta:', error);
        return { data: null, error };
      }

      console.log(`✅ ${data?.length || 0} tickets encontrados`);
      return { data, error: null };
      
    } catch (error) {
      console.error(`❌ Exception:`, error);
      return { data: null, error };
    }
  }

  // Obtener un ticket específico
  async getTicketById(id: string): Promise<{ data: Ticket | null; error: any }> {
    console.log('🔍 Buscando ticket con ID:', id);
    
    try {
      // Verificar usuario autenticado primero
      const { data: { user } } = await this._supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      console.log(`👤 Usuario autenticado: ${user.id}`);
      
      // Quitar el filtro user_id ya que RLS se encarga de la seguridad
      const { data, error } = await this._supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ Error obteniendo ticket:', error);
        return { data: null, error };
      }
      
      console.log('✅ Ticket encontrado:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception obteniendo ticket:', error);
      return { data: null, error };
    }
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
    console.log('📝 Actualizando ticket:', id, 'con datos:', updateData);
    
    try {
      const { data, error } = await this._supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando ticket:', error);
        return { data: null, error };
      }

      console.log('✅ Ticket actualizado:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception actualizando ticket:', error);
      return { data: null, error };
    }
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
    console.log('🔍 Buscando comentarios para ticket:', ticketId);
    
    try {
      const { data, error } = await this._supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error obteniendo comentarios:', error);
        return { data: null, error };
      }
      
      console.log('✅ Comentarios encontrados:', data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception obteniendo comentarios:', error);
      return { data: null, error };
    }
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
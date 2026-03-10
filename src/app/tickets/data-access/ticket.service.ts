import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../shared/data-access/supabase.service';
import { environment } from '../../../environments/environment';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Abierto' | 'En progreso' | 'Cerrado';
  department: string;
  origin_department?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export interface CreateTicketData {
  title: string;
  description: string;
  department: string;
  origin_department?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: 'Abierto' | 'En progreso' | 'Cerrado';
  department?: string;
}

export interface CreateCommentData {
  ticket_id: string;
  message: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private _supabase = inject(SupabaseService).supabaseClient;
  private readonly _attachmentsBucket = environment.SUPABASE_ATTACHMENTS_BUCKET || 'ticket-attachments';

  async uploadAttachment(file: File, folder: 'tickets' | 'comments'): Promise<{ path: string; url: string } | null> {
    if (!file) {
      return null;
    }

    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;
    const sanitizedName = file.name.replace(/\s+/g, '-').toLowerCase();
    const fullPath = `${folder}/${uniqueId}-${sanitizedName}`;

    const { error } = await this._supabase
      .storage
      .from(this._attachmentsBucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo adjunto:', error);
      throw error;
    }

    const { data } = this._supabase
      .storage
      .from(this._attachmentsBucket)
      .getPublicUrl(fullPath);

    return {
      path: fullPath,
      url: data.publicUrl
    };
  }

  // =================== TICKETS ===================
  
  // Obtener tickets según el rol del usuario (departamento o admin)
  async getTickets(useCache: boolean = true): Promise<{ data: Ticket[] | null; error: any }> {
    console.log('🔍 Servicio: Iniciando getTickets');
    
    try {
      // Verificar usuario autenticado
      const { data: { user } } = await this._supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No user found');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      console.log(`🎯 Obteniendo tickets para usuario: ${user.id}`);
      console.log('👤 Metadata del usuario:', user.user_metadata);

      const userDepartment = user.user_metadata?.['department'];
      
      let query = this._supabase
        .from('tickets')
        .select('id, title, description, status, department, user_id, created_at, updated_at, attachment_url, attachment_name')
        .order('created_at', { ascending: false })
        .limit(50);

      // Si el usuario tiene un departamento específico (no es admin), 
      // solo mostrar tickets de su departamento o tickets creados por él
      if (userDepartment && userDepartment !== 'General') {
        query = query.or(`department.eq.${userDepartment},user_id.eq.${user.id}`);
      }

      const { data, error } = await query;

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

  // Obtener todos los tickets del usuario (método original mantenido para compatibilidad)
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
        .select('id, title, description, status, department, user_id, created_at, updated_at, attachment_url, attachment_name')
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
      status: 'Abierto' as const,
      origin_department: ticketData.origin_department ?? user.user_metadata?.['department'] ?? null
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
    console.log('💬 Servicio: Creando comentario...', commentData);
    
    try {
      const { data: { user } } = await this._supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      console.log('👤 Usuario autenticado:', user.id, user.email);

      // Usar el nombre del metadata si existe, si no usar el email
      const authorName = user.user_metadata?.['name'] || user.email || 'Usuario';

      const newComment = {
        ...commentData,
        author_id: user.id,
        author_name: authorName
      };

      console.log('📝 Datos del comentario a insertar:', newComment);

      const { data, error } = await this._supabase
        .from('ticket_comments')
        .insert([newComment])
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando comentario:', error);
        return { data: null, error };
      }

      console.log('✅ Comentario creado exitosamente:', data);
      return { data, error: null };
      
    } catch (error) {
      console.error('❌ Exception creando comentario:', error);
      return { data: null, error };
    }
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

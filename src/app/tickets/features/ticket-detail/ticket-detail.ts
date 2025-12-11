import { Component, ElementRef, ViewChild, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  private _cdr = inject(ChangeDetectorRef);
  @ViewChild('commentAttachmentInput') commentAttachmentInput?: ElementRef<HTMLInputElement>;
  
  ticket: Ticket | null = null;
  comments: TicketComment[] = [];
  ticketId: string | null = null;
  isLoading = true;
  error: string | null = null;
  isUpdatingStatus = false;
  isAddingComment = false;
  commentAttachmentFile: File | null = null;
  commentAttachmentPreview: { name: string; size: number } | null = null;
  commentAttachmentError: string | null = null;
  readonly maxAttachmentSize = 10 * 1024 * 1024; // 10MB

  // Formulario para comentarios
  commentForm = this._formBuilder.group({
    message: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    // Exponer método de debug globalmente
    (window as any).debugComments = () => this.debugComments();
  }

  async ngOnInit() {
    this.ticketId = this._route.snapshot.paramMap.get('id');
    console.log('🎯 Ticket Detail - ID recibido:', this.ticketId);
    
    if (this.ticketId) {
      // Cargar ticket primero
      await this.loadTicket(this.ticketId);
      
      // Solo cargar comentarios si el ticket se cargó correctamente
      if (this.ticket) {
        await this.loadComments(this.ticketId);
      }
    } else {
      console.error('❌ No se encontró ID del ticket en la ruta');
      this._router.navigateByUrl('/ticket');
    }
  }

  async loadTicket(id: string) {
    console.log('📂 Cargando ticket:', id);
    
    try {
      this.isLoading = true;
      this.error = null;

      const { data, error } = await this._ticketService.getTicketById(id);
      
      if (error) {
        console.error('❌ Error del servicio:', error);
        throw error;
      }
      
      if (!data) {
        console.error('❌ No se encontró el ticket');
        this.error = 'Ticket no encontrado';
        return;
      }
      
      console.log('✅ Ticket cargado exitosamente:', data);
      this.ticket = data;
      this._cdr.detectChanges(); // Forzar detección de cambios
    } catch (error) {
      console.error('❌ Error loading ticket:', error);
      this.error = 'Error al cargar el ticket. Puede que no exista o no tengas permisos.';
      this._cdr.detectChanges();
    } finally {
      this.isLoading = false;
      console.log('🏁 Carga de ticket terminada - isLoading:', this.isLoading, 'ticket:', !!this.ticket);
      this._cdr.detectChanges(); // Asegurar que la UI se actualiza
    }
  }

  async loadComments(ticketId: string) {
    console.log('💬 Cargando comentarios para ticket:', ticketId);
    
    try {
      // Limpiar comentarios existentes
      this.comments = [];
      this._cdr.detectChanges();
      
      const { data, error } = await this._ticketService.getTicketComments(ticketId);
      
      if (error) {
        console.error('❌ Error cargando comentarios:', error);
        throw error;
      }
      
      console.log('💬 Datos de comentarios recibidos:', data);
      console.log('💬 Tipo de datos:', typeof data);
      console.log('💬 Es array:', Array.isArray(data));
      
      // Asignación directa de comentarios
      this.comments = data || [];
      
      console.log('✅ Comentarios cargados y asignados:', this.comments.length);
      if (this.comments.length > 0) {
        console.log('📝 Primer comentario:', this.comments[0]);
      }
      
      // Forzar detección de cambios
      this._cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      this.comments = [];
      this._cdr.detectChanges();
    }
  }

  async updateTicketStatus(newStatus: 'Abierto' | 'En progreso' | 'Cerrado') {
    if (!this.ticket || !this.ticketId) return;

    console.log('🔄 Cambiando estado del ticket a:', newStatus);
    
    try {
      this.isUpdatingStatus = true;
      this._cdr.detectChanges();
      
      const { data, error } = await this._ticketService.updateTicket(this.ticketId, {
        status: newStatus
      });

      if (error) {
        console.error('❌ Error actualizando estado:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Estado actualizado exitosamente:', data);
        this.ticket = { ...this.ticket, ...data };
        this._cdr.detectChanges();
      }
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
      this.error = 'Error al actualizar el estado del ticket.';
      this._cdr.detectChanges();
    } finally {
      this.isUpdatingStatus = false;
      this._cdr.detectChanges();
    }
  }

  async addComment() {
    if (this.commentForm.invalid || !this.ticketId) return;

    console.log('💬 Agregando comentario al ticket:', this.ticketId);
    
    try {
      this.isAddingComment = true;
      this._cdr.detectChanges();
      this.commentAttachmentError = null;
      
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (this.commentAttachmentFile) {
        const uploadResult = await this._ticketService.uploadAttachment(this.commentAttachmentFile, 'comments');
        attachmentUrl = uploadResult?.url ?? null;
        attachmentName = this.commentAttachmentFile.name;
      }
      
      const { data, error } = await this._ticketService.createComment({
        ticket_id: this.ticketId,
        message: this.commentForm.value.message!,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName
      });

      if (error) {
        console.error('❌ Error agregando comentario:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Comentario agregado:', data);
        this.comments.push(data);
        this.commentForm.reset();
        this.clearCommentAttachment();
        this._cdr.detectChanges();
        
        // Opcional: recargar todos los comentarios para asegurar sincronización
        // await this.loadComments(this.ticketId);
      }
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      this.error = 'Error al agregar el comentario.';
      this._cdr.detectChanges();
    } finally {
      this.isAddingComment = false;
      this._cdr.detectChanges();
    }
  }

  onCommentAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.commentAttachmentError = null;

    if (file && file.size > this.maxAttachmentSize) {
      this.commentAttachmentError = 'El archivo supera el límite de 10MB.';
      this.clearCommentAttachment(false);
      this._cdr.detectChanges();
      return;
    }

    this.commentAttachmentFile = file;
    this.commentAttachmentPreview = file ? { name: file.name, size: file.size } : null;
    this._cdr.detectChanges();
  }

  clearCommentAttachment(resetError: boolean = true) {
    this.commentAttachmentFile = null;
    this.commentAttachmentPreview = null;
    if (resetError) {
      this.commentAttachmentError = null;
    }
    if (this.commentAttachmentInput) {
      this.commentAttachmentInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
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

  // Método de debug para comentarios
  debugComments() {
    console.log('🐛 Debug Comments:');
    console.log('- comments array:', this.comments);
    console.log('- comments.length:', this.comments.length);
    console.log('- ticketId:', this.ticketId);
    console.log('- ticket:', this.ticket);
    
    if (this.ticketId) {
      this.loadComments(this.ticketId);
    }
  }
}

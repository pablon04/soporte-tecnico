import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TicketService, CreateTicketData } from '../../data-access/ticket.service';

interface CreateTicketForm {
  title: FormControl<null | string>;
  description: FormControl<null | string>;
  department: FormControl<string | null>;
}

@Component({
  selector: 'app-create-ticket',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './create-ticket.html',
  styleUrl: './create-ticket.css'
})
export default class CreateTicket {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _ticketService = inject(TicketService);
  @ViewChild('ticketAttachmentInput') ticketAttachmentInput?: ElementRef<HTMLInputElement>;

  message: string | null = null;
  isLoading = false;
  attachmentFile: File | null = null;
  attachmentError: string | null = null;
  attachmentPreview: { name: string; size: number } | null = null;
  readonly maxAttachmentSize = 10 * 1024 * 1024; // 10MB

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

  form = this._formBuilder.group<CreateTicketForm>({
    title: this._formBuilder.control(null, [Validators.required, Validators.minLength(2)]),
    description: this._formBuilder.control(null, [Validators.required, Validators.minLength(2)]),
    department: this._formBuilder.control(null, [Validators.required])
  });

  async submit() {
    if (this.form.invalid) return;

    try {
      this.isLoading = true;
      this.message = 'Creando ticket...';
      this.attachmentError = null;

      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (this.attachmentFile) {
        const uploadResult = await this._ticketService.uploadAttachment(this.attachmentFile, 'tickets');
        attachmentUrl = uploadResult?.url ?? null;
        attachmentName = this.attachmentFile.name;
      }

      const ticketData: CreateTicketData = {
        title: this.form.value.title!,
        description: this.form.value.description!,
        department: this.form.value.department!,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName
      };

      const { data, error } = await this._ticketService.createTicket(ticketData);

      if (error) throw error;

      this.message = 'Ticket creado exitosamente. Redirigiendo...';
      
      setTimeout(() => {
        this._router.navigateByUrl('/ticket');
      }, 1000);

      this.clearAttachment();

    } catch (error) {
      console.error('Error al crear ticket:', error);
      if (error instanceof Error) {
        this.message = `Error: ${error.message}`;
      } else {
        this.message = 'Error al crear el ticket. Por favor intenta de nuevo.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.attachmentError = null;

    if (file && file.size > this.maxAttachmentSize) {
      this.attachmentError = 'El archivo supera el límite de 10MB.';
      this.clearAttachment(false);
      return;
    }

    this.attachmentFile = file;
    this.attachmentPreview = file ? { name: file.name, size: file.size } : null;
  }

  clearAttachment(resetError: boolean = true) {
    this.attachmentFile = null;
    this.attachmentPreview = null;
    if (resetError) {
      this.attachmentError = null;
    }
    if (this.ticketAttachmentInput) {
      this.ticketAttachmentInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }
}

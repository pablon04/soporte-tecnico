import { Component, inject } from '@angular/core';
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

  message: string | null = null;
  isLoading = false;

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

      const ticketData: CreateTicketData = {
        title: this.form.value.title!,
        description: this.form.value.description!,
        department: this.form.value.department!
      };

      const { data, error } = await this._ticketService.createTicket(ticketData);

      if (error) throw error;

      this.message = 'Ticket creado exitosamente. Redirigiendo...';
      
      setTimeout(() => {
        this._router.navigateByUrl('/ticket');
      }, 1000);

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
}
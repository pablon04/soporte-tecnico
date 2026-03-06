import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../data-access/auth.service';

interface PasswordRecoveryForm {
  email: FormControl<null | string>;
}

@Component({
  selector: 'app-password-recovery',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.css'
})
export default class PasswordRecovery {
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);

  message = signal<string | null>(null);

  form = this._formBuilder.group<PasswordRecoveryForm>({
    email: this._formBuilder.control(null, [Validators.required, Validators.email]),
  });

  async resetPasswordForEmail() {
    if (this.form.invalid) return;

    try {
      this.message.set('Enviando...');

      const { error } = await this._authService.resetPasswordForEmail(
        this.form.value.email ?? ''
      );

      if (error) throw error;

      this.message.set('Si tu cuenta existe, hemos enviado un correo electrónico con las instrucciones para restablecer tu contraseña.');
      this.form.reset();
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        this.message.set('Hubo un error al procesar tu solicitud. Intenta de nuevo.');
      }
    }
  }
}

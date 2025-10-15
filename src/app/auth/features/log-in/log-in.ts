import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../data-access/auth.service';

interface LogInForm {
  email: FormControl<null | string>;
  password: FormControl<null | string>;
}
@Component({
  selector: 'app-log-in',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.css'
})
export default class LogIn {
  private _formBuilder = inject(FormBuilder);

  private _authService = inject(AuthService);

  private _router = inject(Router);

    message: string | null = null;
    isLoading = false;

    form = this._formBuilder.group<LogInForm>({
      email: this._formBuilder.control(null, [Validators.required, Validators.email]),
      password: this._formBuilder.control(null, [Validators.required]),

    });

  async submit() {
      if (this.form.invalid) return;

       try {
        this.isLoading = true;
        this.message = 'Iniciando sesión...';

      const { error } = await this._authService.logIn({
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
      });

      if (error) throw error;

      this.message = 'Sesión iniciada exitosamente. Redirigiendo...';
      
      setTimeout(() => {
        this._router.navigateByUrl('/');
      }, 1000);

    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid') || 
            error.message.includes('wrong') ||
            error.message.includes('incorrect')) {
          this.message = 'Credenciales inválidas. Por favor revisa tu email y contraseña.';
        } else if (error.message.includes('Email not confirmed')) {
          this.message = 'Debes confirmar tu email antes de iniciar sesión. Revisa tu correo electrónico.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          this.message = 'Error de conexión. Por favor intenta de nuevo.';
        } else {
          this.message = 'Error al iniciar sesión. Por favor intenta de nuevo.';
        }
      } else {
        this.message = 'Error inesperado. Por favor intenta de nuevo.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}

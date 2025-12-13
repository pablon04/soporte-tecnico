import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { AuthService } from '../../data-access/auth.service';

interface UpdatePasswordForm {
  newPassword: FormControl<null | string>;
  confirmPassword: FormControl<null | string>;
}

// Validador personalizado para confirmar contraseñas
function passwordMatchValidator(control: AbstractControl) {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  
  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-update-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css'
})
export default class UpdatePassword{
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  message: string | null = null;
  isLoading = false;

  form = this._formBuilder.group<UpdatePasswordForm>({
    newPassword: this._formBuilder.control(null, [
      Validators.required, 
      Validators.minLength(6)
    ]),
    confirmPassword: this._formBuilder.control(null, [Validators.required]),
  }, { validators: passwordMatchValidator });


  async checkSession() {
    try {
      const { data } = await this._authService.session();
      if (!data.session) {
        this.message = 'Tu enlace ha expirado. Por favor, solicita la recuperación de nuevo.';
        setTimeout(() => {
          this._router.navigateByUrl('/auth/password-recovery');
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      this.message = 'Error de sesión. Redirigiendo...';
      setTimeout(() => {
        this._router.navigateByUrl('/auth/log-in');
      }, 2000);
    }
  }

  async updateUser() {
    if (this.form.invalid) {
      if (this.form.errors?.['passwordMismatch']) {
        this.message = 'Las contraseñas no coinciden.';
      }
      return;
    }

    try {
      this.isLoading = true;
      this.message = 'Actualizando contraseña...';
      
      const { error } = await this._authService.updatePassword(
        this.form.value.newPassword ?? ''
      );

      if (error) throw error;

      this.message = 'Contraseña actualizada con éxito. Redirigiendo al login...';
      
      // Cerrar sesión y redirigir al login
      await this._authService.signOut();
      
      setTimeout(() => {
        this._router.navigateByUrl('/auth/log-in');
      }, 2000);

    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        if (error.message.includes('session')) {
          this.message = 'Tu enlace ha expirado. Por favor, solicita la recuperación de nuevo.';
          setTimeout(() => {
            this._router.navigateByUrl('/auth/password-recovery');
          }, 3000);
        } else {
          this.message = 'Error al actualizar la contraseña. Intenta de nuevo.';
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

  get passwordMismatch() {
    return this.form.errors?.['passwordMismatch'] && 
          this.form.get('confirmPassword')?.touched;
  }
}
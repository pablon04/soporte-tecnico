import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../data-access/auth.service';

interface SignUpForm {
  email: FormControl<null | string>;
  password: FormControl<null | string>;
}

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export default class SignUp {
  
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);

  message: string | null = null;
  isLoading = false;

  form = this._formBuilder.group<SignUpForm>({
    email: this._formBuilder.control(null, [Validators.required, Validators.email]),
    password: this._formBuilder.control(null, [Validators.required, Validators.minLength(6)]),
  });

 async submit() {
    if (this.form.invalid) return;

    try {
      this.isLoading = true;
      this.message = 'Creando cuenta...';

      const authResponse = await this._authService.signUp({
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
      });

      if (authResponse.error) throw authResponse.error;

      this.message = 'Cuenta creada exitosamente. Por favor revisa tu correo electrónico para confirmar tu cuenta.';
      this.form.reset();
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        if (error.message.includes('already registered')) {
          this.message = 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
        } else if (error.message.includes('weak password')) {
          this.message = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
        } else {
          this.message = 'Error al crear la cuenta. Por favor intenta de nuevo.';
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

}

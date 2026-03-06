import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../data-access/auth.service';

interface SignUpForm {
  name: FormControl<null | string>;
  email: FormControl<null | string>;
  password: FormControl<null | string>;
  department: FormControl<null | string>;
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

  form = this._formBuilder.group<SignUpForm>({
    name: this._formBuilder.control(null, [Validators.required, Validators.minLength(2)]),
    email: this._formBuilder.control(null, [Validators.required, Validators.email]),
    password: this._formBuilder.control(null, [Validators.required, Validators.minLength(6)]),
    department: this._formBuilder.control(null, [Validators.required]),
  });

 async submit() {
    if (this.form.invalid) return;

    try {
      this.isLoading = true;
      this.message = 'Creando cuenta...';

      const authResponse = await this._authService.signUp({
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
        options: {
          data: {
            name: this.form.value.name ?? '',
            department: this.form.value.department ?? ''
          }
        }
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
        } else if (error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
          this.message = 'Has excedido el límite de registros. Por favor espera unos minutos e inténtalo de nuevo.';
        } else {
          this.message = `Error al crear la cuenta: ${error.message}`;
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

}

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

    form = this._formBuilder.group<LogInForm>({
      email: this._formBuilder.control(null, [Validators.required, Validators.email]),
      password: this._formBuilder.control(null, [Validators.required]),

    });

  async submit() {
      if (this.form.invalid) return;

       try {
      const { error } = await this._authService.logIn({
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
      });

      if (error) throw error;

      this._router.navigateByUrl('/');
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
      }
    }

    }
}

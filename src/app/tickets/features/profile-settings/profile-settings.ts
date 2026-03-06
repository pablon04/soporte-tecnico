import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/data-access/auth.service';

@Component({
  selector: 'app-profile-settings',
  imports: [FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css'
})
export default class ProfileSettings implements OnInit {
  private _authService = inject(AuthService);
  private _router = inject(Router);

  fullName = '';
  email = '';
  newPassword = '';
  confirmPassword = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  async ngOnInit() {
    const user = await this._authService.getUserProfile();
    if (user) {
      this.fullName = user.user_metadata?.['full_name'] || '';
      this.email = user.email || '';
    }
  }

  async saveProfile() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const { error } = await this._authService.updateProfile({
        email: this.email,
        full_name: this.fullName
      });
      if (error) throw error;

      if (this.newPassword) {
        if (this.newPassword !== this.confirmPassword) {
          this.errorMessage = 'Las contraseñas no coinciden.';
          return;
        }
        const { error: passError } = await this._authService.updatePassword(this.newPassword);
        if (passError) throw passError;
        this.newPassword = '';
        this.confirmPassword = '';
      }

      this.successMessage = 'Perfil actualizado correctamente.';
    } catch (error: any) {
      this.errorMessage = error?.message || 'Error al actualizar el perfil.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this._router.navigateByUrl('/ticket');
  }
}

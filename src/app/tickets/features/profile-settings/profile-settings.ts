import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  private _cdr = inject(ChangeDetectorRef);

  // Datos actuales (modo vista)
  fullName = '';
  email = '';
  department = '';

  // Copia editable (modo edición)
  editFullName = '';
  editEmail = '';
  editDepartment = '';
  newPassword = '';
  confirmPassword = '';

  isEditing = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

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

  async ngOnInit() {
    const user = await this._authService.getUserProfile();
    if (user) {
      this.fullName = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || '';
      this.email = user.email || '';
      this.department = user.user_metadata?.['department'] || '';
    }
    this._cdr.detectChanges();
  }

  startEditing() {
    this.editFullName = this.fullName;
    this.editEmail = this.email;
    this.editDepartment = this.department;
    this.newPassword = '';
    this.confirmPassword = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.isEditing = true;
    this._cdr.detectChanges();
  }

  cancelEditing() {
    this.isEditing = false;
    this.successMessage = '';
    this.errorMessage = '';
    this._cdr.detectChanges();
  }

  async saveProfile() {
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const { error } = await this._authService.updateProfile({
        email: this.editEmail,
        full_name: this.editFullName,
        department: this.editDepartment
      });
      if (error) throw error;

      if (this.newPassword) {
        const { error: passError } = await this._authService.updatePassword(this.newPassword);
        if (passError) throw passError;
      }

      // Actualizar los datos de vista con los nuevos valores
      this.fullName = this.editFullName;
      this.email = this.editEmail;
      this.department = this.editDepartment;

      this.successMessage = 'Perfil actualizado correctamente.';
      this.isEditing = false;
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error: any) {
      this.errorMessage = error?.message || 'Error al actualizar el perfil.';
    } finally {
      this.isLoading = false;
      this._cdr.detectChanges();
    }
  }

  goBack() {
    this._router.navigateByUrl('/ticket');
  }
}

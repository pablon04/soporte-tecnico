import { inject, Injectable } from "@angular/core";
import { SupabaseService } from "../../shared/data-access/supabase.service";
import { SignUpWithPasswordCredentials } from "@supabase/supabase-js";

@Injectable({providedIn: 'root'})
export class AuthService {

    private _supabaseClient = inject(SupabaseService).supabaseClient;

    constructor() {
        this._supabaseClient.auth.onAuthStateChange((session) => {
            console.log(session);
        });
    }
    
    session() {
        return this._supabaseClient.auth.getSession();
    }

    signUp(credentials: SignUpWithPasswordCredentials) {
        return this._supabaseClient.auth.signUp(credentials);
    }

    logIn(credentials: SignUpWithPasswordCredentials) {
        return this._supabaseClient.auth.signInWithPassword(credentials);
    }

    signOut() {
        return this._supabaseClient.auth.signOut();
    }

    resetPasswordForEmail(email: string) {
        return this._supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`
        });
    }

    updatePassword(password: string) {
        return this._supabaseClient.auth.updateUser({ password });
    }

    async getUserProfile() {
        const { data: { user } } = await this._supabaseClient.auth.getUser();
        return user;
    }

    updateProfile(data: { email?: string; full_name?: string; department?: string }) {
        return this._supabaseClient.auth.updateUser({
            email: data.email,
            data: { full_name: data.full_name, department: data.department }
        });
    }
}
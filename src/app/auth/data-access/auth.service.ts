import { inject, Injectable } from "@angular/core";
import { SupabaseService } from "../../shared/data-access/supabase.service";
import { SignUpWithPasswordCredentials } from "@supabase/supabase-js";

@Injectable({providedIn: 'root'})
export class AuthService {

    private _supabaseClient = inject(SupabaseService).supabaseClient;

    session() {

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




}
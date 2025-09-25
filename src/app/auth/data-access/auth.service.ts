import { inject, Injectable } from "@angular/core";
import { SupabaseService } from "../../shared/data-access/supabase.service";

@Injectable({providedIn: 'root'})
export class AuthService {

    private _supabaseClient = inject(SupabaseService).supabaseClient;


}
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable , inject} from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userSettings = JSON.parse(localStorage.getItem('user_settings') || '{}');

  private http = inject(HttpClient);

  subirFoto(emailUsr: string, imagenBlob: Blob) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.userSettings.accessToken}`
    });
    const formData = new FormData();
    formData.append('file', imagenBlob, 'selfie.jpg');
    formData.append('email', emailUsr);
    return this.http.post(environment.urlHostSchool.concat(environment.urlServiceUploadPhoto), formData, {headers});
  }

  /*resetPassword(email: string, code: string, newPassword: string): Observable<any>{
        return this.httpClient.post<any>(environment.urlHostSchool.concat(environment.urlServiceResetPassword), {email, code, newPassword}).pipe(
          tap(response => {
            
          })
        )
      }*/
}

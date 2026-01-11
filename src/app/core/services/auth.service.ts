import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // private apiUrl = 'http://localhost:3000/api/auth'; // TO DO: Move to environment variable
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    if (user === 'undefined' || user === null) {
      return null;
    }
    return JSON.parse(user);
  }
}

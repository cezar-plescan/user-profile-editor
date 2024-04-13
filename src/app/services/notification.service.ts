import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  constructor() { }

  display(message: string) {
    this.snackBar.open(message, 'Close', {
      panelClass: '',
      duration: 3000
    });
  }
}

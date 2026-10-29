import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { IamStore } from '../../../../iam';


@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-shell',
  styleUrl: './shell.css',
  templateUrl: './shell.html',
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly iam = inject(IamStore);

  protected signOut(): void {
    this.iam.signOut();
    this.router.navigate(['sign-in']);
  }
}

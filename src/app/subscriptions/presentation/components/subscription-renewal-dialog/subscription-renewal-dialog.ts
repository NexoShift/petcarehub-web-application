import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

export interface SubscriptionRenewalDialogData {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-subscription-renewal-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule, TranslatePipe, Icon],
  templateUrl: './subscription-renewal-dialog.html',
  styleUrl: './subscription-renewal-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionRenewalDialog {
  protected readonly data = inject<SubscriptionRenewalDialogData>(MAT_DIALOG_DATA);
}

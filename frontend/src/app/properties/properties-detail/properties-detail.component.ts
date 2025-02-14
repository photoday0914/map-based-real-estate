import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ModalController,
  PopoverController,
  ToastController,
} from '@ionic/angular';

import { Property } from 'src/app/shared/interface/property';
import { PropertiesService } from '../properties.service';
import { ActionPopupComponent } from 'src/app/shared/components/action-popup/action-popup.component';
import { PropertiesEditComponent } from '../properties-edit-modal/properties-edit.component';
import { PropertiesUploadsComponent } from '../properties-uploads-modal/properties-uploads.component';
import { UserService } from 'src/app/user/user.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { PropertiesGalleryComponent } from '../properties-gallery/properties-gallery.component';
import { TransactionType } from 'src/app/shared/enums/property';

@Component({
  selector: 'app-properties-detail',
  templateUrl: './properties-detail.component.html',
  styleUrls: ['./properties-detail.component.scss'],
})
export class PropertiesDetailComponent implements OnInit, OnDestroy {
  @ViewChild('propertiesGallery') propertiesGallery: PropertiesGalleryComponent;
  public property = signal<Property | undefined>(undefined);
  public isOwner = false;
  public ready = false;
  public transactionType = TransactionType;
  private unsubscribe$ = new Subject<void>();

  constructor(
    public location: Location,
    private userService: UserService,
    private router: Router,
    private propertiesService: PropertiesService,
    private popoverCtrl: PopoverController,
    public modalController: ModalController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.propertiesService.property$
      .pipe(
        takeUntil(this.unsubscribe$),
        finalize(() => {
          this.property.set(undefined);
          this.propertiesService.property = null;
        })
      )
      .subscribe(async (property) => {
        this.property.set(property);
        if (!this.property()) {
          await this.propertiesService.fetchProperty(paramId);
        }
        this.ready = true;
        this.isOwner = this.userService.isPropertyOwner(this.property());
        if (this.propertiesGallery && this.property) {
          this.propertiesGallery.setImage();
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public async actionPopup() {
    const popover = await this.popoverCtrl.create({
      component: ActionPopupComponent,
      componentProps: {
        message: false,
        edit: this.isOwner,
        delete: this.isOwner,
      },
      translucent: true,
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (!data) {
      return;
    }
    if (data.action === 'delete') {
      this.propertiesService.removeProperty(this.property().property_id);
      this.presentToast('Success,property deleted');
      this.router.navigate(['/properties']);
    }
    if (data.action === 'edit') {
      this.editModal();
    }
    if (data.action === 'report') {
      this.presentToast('Success, we will take a look at this property.');
    }
  }

  public findInMap() {
    const { lat, lng } = this.property().position;
    this.router.navigate(['/map'], { queryParams: { lat, lng } });
  }

  public async editImages() {
    const modal = await this.modalController.create({
      component: PropertiesUploadsComponent,
      componentProps: {
        property: this.property,
      },
    });
    modal.present();
  }

  private async editModal() {
    const modal = await this.modalController.create({
      component: PropertiesEditComponent,
    });
    return await modal.present();
  }

  private async presentToast(
    message: string,
    color = 'success',
    duration = 3000
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
    });
    toast.present();
  }
}

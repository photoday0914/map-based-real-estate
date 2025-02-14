import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Enquiry } from 'src/app/shared/interface/enquiry';
import { User } from 'src/app/shared/interface/user';
import { UserService } from 'src/app/user/user.service';
import { EnquiriesReplyModalComponent } from '../enquiries-reply-modal/enquiries-reply-modal.component';
import { EnquiriesService } from '../enquiries.service';

@Component({
  selector: 'app-enquiries-detail',
  templateUrl: './enquiries-detail.component.html',
  styleUrls: ['./enquiries-detail.component.scss'],
})
export class EnquiriesDetailComponent implements OnInit, OnDestroy {
  public enquiry: Enquiry | null;
  public user: User;
  public paramId: string;
  private unsubscribe$ = new Subject<void>();

  constructor(
    public location: Location,
    private router: Router,
    private enquiriesService: EnquiriesService,
    private userService: UserService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController
  ) { }

  async ngOnInit() {
    const loading = await this.loadingCtrl.create({
      message: 'Fetching enquiry details...',
      spinner: 'circular'
    });
    loading.present();

    this.route.paramMap.pipe(takeUntil(this.unsubscribe$)).subscribe(async (params) => {
      loading.present();
      this.paramId = params.get('id');
      await this.enquiriesService.fetchEnquiry(this.paramId);
    });

    this.enquiriesService.enquiry$.pipe(takeUntil(this.unsubscribe$)).subscribe(enquiry => {
      this.enquiry = enquiry;
      loading.dismiss();
    });
    this.userService.user$.subscribe(user => {
      if (user) { this.user = user; }
    });
  }

  ngOnDestroy(): void {
    this.enquiriesService.enquiry = null;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  async gotToProperty(propertyId: string) {
    await this.router.navigate(['/properties', propertyId]);
  }
  async goToEnquiry(enqId: string) {
    await this.router.navigate(['/enquiries', enqId]);
  }

  async ionViewDidEnter() {
    const userId = this.userService.user.user_id;
    if (!this.enquiry?.read && this.enquiry?.users?.to.user_id === userId) {
      this.enquiriesService.readEnquiry(this.enquiry.enquiry_id);
    }
  }

  public sentByMe(): boolean {
    if (this.user && this.enquiry) {
      return this.user.user_id === this.enquiry.users.from.user_id;
    }
    return false;
  }

  public async report(enqId: string) {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-alert-class',
      header: 'Report Message',
      // subHeader: 'Subtitle',
      message: 'Are you sure you want to Report this Message?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            // console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'REPORT',
          cssClass: 'alert-danger-text',
          role: 'delete',
          handler: () => {
            this.presentToast('Enquiry will be place for investigation.');
          }
        }
      ]
    });

    await alert.present();
  }

  public async delete(enqId: string) {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-alert-class',
      header: 'Delete Enquiry',
      // subHeader: 'Subtitle',
      message: 'Are you sure you want to delete this Enquiry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            // console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'DELETE',
          cssClass: 'alert-danger-text',
          role: 'delete',
          handler: () => {
            this.enquiriesService.removeEnquiry(enqId);
            this.router.navigate(['/enquiries']);
            this.presentToast('Enquiry is deleted successfully.');
          }
        }
      ]
    });

    await alert.present();
    // const { role } = await alert.onDidDismiss();
  }

  async presentToast(message: string, duration = 3000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'success'
    });
    toast.present();
  }

  async createEnquiryModal() {
    const modal = await this.modalCtrl.create({
      component: EnquiriesReplyModalComponent,
      componentProps: {
        title: 'Reply Enquiry',
        property: this.enquiry?.property,
        replyTo: {
          enquiry_id: this.enquiry.enquiry_id,
          title: this.enquiry.title,
          topic: this.enquiry.topic
        },
        userTo: this.enquiry.users?.from?.user_id
      }
    });
    return await modal.present();
  }
}

import { Component, signal } from '@angular/core';
import { User } from 'src/app/shared/interface/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {

  public imgUrl: any = './assets/images/avatar.png';
  public user: User;
  public isActivityActive = signal(true);

  constructor(private userService: UserService) {
    this.userService.user$.subscribe(data => this.user = data);
  }

  public toggleUpload() {
    const input = document.getElementById('image-upload');
    input.click();
  }

  public onSelectFile(event) { // called each time file input changes
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (ev) => { // called once readAsDataURL is completed
        this.imgUrl = ev.target.result;
        console.log(this.imgUrl);
      };
    }
  }
  public toggleActivityPropertyTab(): void {
    this.isActivityActive.set(!this.isActivityActive())
  }
}

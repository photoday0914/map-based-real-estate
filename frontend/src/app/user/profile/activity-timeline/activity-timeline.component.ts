import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActivitiesService } from 'src/app/activities/activities.service';
import { ActivityType } from 'src/app/shared/enums/activity';
import { Activity } from 'src/app/shared/interface/activities';

@Component({
  selector: 'app-activity-timeline',
  templateUrl: './activity-timeline.component.html',
  styleUrls: ['./activity-timeline.component.scss'],
})
export class ActivityTimelineComponent
  implements OnInit, AfterViewInit, OnDestroy {
  public action = ActivityType;
  public activities = signal<Activity[]>([]);
  private unSubscribe$ = new Subject<void>();

  constructor(
    private activitiesService: ActivitiesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.activitiesService.activities$
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe((events) => {
        this.activities.set(events);
      });
  }

  ngAfterViewInit(): void {
    if (!this.activities().length) {
      this.activitiesService.fetchActivities();
    }
  }

  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public viewProperty(activity: Activity): void {
    if (activity.property_id) {
      this.router.navigate(['properties', activity.property_id]);
    }
  }

  public viewEnquiry(activity: Activity): void {
    if (activity.enquiry_id) {
      this.router.navigate(['enquiries', activity.enquiry_id]);
    }
  }
}

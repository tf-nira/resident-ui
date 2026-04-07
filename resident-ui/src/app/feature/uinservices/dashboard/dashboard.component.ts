import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import { AutoLogoutService } from "src/app/core/services/auto-logout.service";
import { LogoutService } from 'src/app/core/services/logout.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { LocationStrategy } from '@angular/common';
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-uindashboard",
  templateUrl: "dashboard.component.html",
  styleUrls: ["dashboard.component.css"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  menuItems: any;
  subscriptions: Subscription[] = [];
  message: any;
  userPreferredLangCode = localStorage.getItem("langCode");
  sitealignment:string = localStorage.getItem('direction');


  constructor(
    private autoLogout: AutoLogoutService,
    private dataStorageService: DataStorageService,
    private translateService: TranslateService,
    private router: Router,
    private logoutService: LogoutService,
    private auditService: AuditService,
    private location: LocationStrategy,
    private fontSizeService: FontSizeService
  ) {
    history.pushState(null, null, window.location.href);  
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });  
  }

  async ngOnInit() {
    this.translateService.use(localStorage.getItem("langCode"));
    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.menuItems = response.menuItems;
      });

    const subs = this.autoLogout.currentMessageAutoLogout.subscribe(
      (message) => (this.message = message) //message =  {"timerFired":false}
    );

    this.subscriptions.push(subs);

    if (!this.message["timerFired"]) {
      this.autoLogout.getValues(this.userPreferredLangCode);
      this.autoLogout.setValues();
      this.autoLogout.keepWatching();
    } else {
      this.autoLogout.getValues(this.userPreferredLangCode);
      this.autoLogout.continueWatching();
    }
    
    this.dataStorageService.getNotificationCount().subscribe((response) => {
    });
  }

  @HostListener('window:popstate', ['$event'])
  PopState(event) {
    if (window.location.hash.includes("uinservices")) {
      if(window.location.hash.split("#")[1] === "/uinservices/dashboard"){
        history.pushState(null, null, window.location.href);
      }
    } else {
      history.pushState(null, null, window.location.href);
    }
  }

  get fontSize(): any {
    return this.fontSizeService.fontSize;
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  onItemSelected(item: any) {
    this.router.navigate([item]);
  }
}

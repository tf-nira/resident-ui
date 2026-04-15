import { Component, HostListener } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { AutoLogoutService } from 'src/app/core/services/auto-logout.service';
import { Subscription } from 'rxjs';
import { Event as NavigationEvent, Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LogoutService } from 'src/app/core/services/logout.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { MatKeyboardService } from 'ngx7-material-keyboard-ios';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import defaultJson from "src/assets/i18n/default.json";

import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';

export const MY_DATE_FORMATS = {
  display: {
    dateInput: 'DD/MMM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
  ],
})

export class AppComponent {
  title = 'resident-ui';
  subscriptions: Subscription[] = [];
  previousUrl: string;
  primaryLangCode: string = localStorage.getItem("langCode")||'eng';
  sitealignment;
  currentRoute: string;
  agent:any = window.navigator.userAgent.toLowerCase();
  isready: boolean = false; // Added flag

  constructor(
    private appConfigService: AppConfigService,
    private autoLogout: AutoLogoutService,
    private router: Router,
    private logoutService: LogoutService,
    private auditService: AuditService,
    private keyboardService: MatKeyboardService,
    private dataStorageService: DataStorageService,
    private dateAdapter: DateAdapter<Date>,
  ) {
    this.currentRoute = "";
    // router.events.subscribe((val) => {
    //     if (val instanceof NavigationStart) {
    //       this.currentRoute = val.url;
    //       if(localStorage.getItem("selectedfontsize")){
    //         if(localStorage.getItem("selectedfontsize") === "12"){
    //           // if(this.currentRoute === "/getuin" || this.currentRoute === "/verify"){
    //           //   document.body.style["zoom"] = "100%";
    //           //   document.body.style["transform"] = "scale(1, .9)";
    //           //   document.body.style["transformOrigin "] = "0 0";
    //           //   document.body.style["margin-top"] = "-5.2em";
    //           //   document.body.style["height"] = "100rem";
    //           // }else{
    //             // document.body.style["zoom"] = "90%";
    //           //   document.body.style.removeProperty('transform');
    //           //   document.body.style.removeProperty('transformOrigin');
    //           //   document.body.style.removeProperty('margin-top');
    //           //   document.body.style.removeProperty("height");
    //           // }
    //         }else if(localStorage.getItem("selectedfontsize") === "14"){
    //           // if(this.currentRoute === "/getuin" || this.currentRoute === "/verify"){
    //           //   document.body.style["zoom"] = "100%";
    //           //   document.body.style["transform"] = "scale(1, 1.0)";
    //           //   document.body.style["transformOrigin "] = "0 0";
    //           //   document.body.style["margin-top"] = "0%";
    //           //   document.body.style["height"] = "100rem";
    //           // }else{
    //             // document.body.style["zoom"] = "100%";
    //           //   document.body.style.removeProperty('transform');
    //           //   document.body.style.removeProperty('transformOrigin');
    //           //   document.body.style.removeProperty('margin-top');
    //           //   document.body.style.removeProperty("height");

    //           // }
    //         }else if(localStorage.getItem("selectedfontsize") === "16"){
    //           // if(this.currentRoute === "/getuin" || this.currentRoute === "/verify"){
    //           //   document.body.style["zoom"] = "100%";
    //           //   document.body.style["transform"] = "scale(1, 1.1)";
    //           //   document.body.style["transformOrigin "] = "0 0";
    //           //   document.body.style["margin-top"] = "5em";
    //           //   document.body.style["height"] = "100rem";
    //           // }else{
    //             // document.body.style["zoom"] = "110%";
    //           //   document.body.style.removeProperty('transform');
    //           //   document.body.style.removeProperty('transformOrigin');
    //           //   document.body.style.removeProperty('margin-top');
    //           //   document.body.style.removeProperty("height");
    //           // }
    //         }else if(localStorage.getItem("selectedfontsize") === "18"){
    //           // if(this.currentRoute === "/getuin" || this.currentRoute === "/verify"){
    //           //   document.body.style["zoom"] = "100%";
    //           //   document.body.style["transform"] = "scale(1, 1.2)";
    //           //   document.body.style["transformOrigin "] = "0 0";
    //           //   document.body.style["margin-top"] = "10em";
    //           //   document.body.style["height"] = "100rem";
    //           // }else{
    //             // document.body.style["zoom"] = "120%";
    //           //   document.body.style.removeProperty('transform');
    //           //   document.body.style.removeProperty('transformOrigin');
    //           //   document.body.style.removeProperty('margin-top');
    //           //   document.body.style.removeProperty("height");
    //           // }
    //         }
    //       }
    //     }
    // });

    this.appConfigService.getConfig();
    if (this.primaryLangCode === "ara") {
      localStorage.setItem('direction','rtl')
    }else{
     if (!localStorage.getItem('direction')) {
        localStorage.setItem('direction', 'ltr');
      }
    }
    this.sitealignment = localStorage.getItem('direction');
    document.body.dir = this.sitealignment;
  }

  ngOnInit() {
    if (!localStorage.getItem("selectedfontsize")) {
      localStorage.setItem("selectedfontsize", "14");
    }
    try {
      if (defaultJson.keyboardMapping && defaultJson.keyboardMapping[this.primaryLangCode]) {
        this.dateAdapter.setLocale(defaultJson.keyboardMapping[this.primaryLangCode]);
      } else {
        this.dateAdapter.setLocale('en-GB');
      }
    } catch (e) {
      this.dateAdapter.setLocale('en-GB');
    }
    this.isready = true;
    this.checkAuthentication();

    this.subscriptions.push(this.autoLogout.currentMessageAutoLogout.subscribe(() => {}));
    this.autoLogout.changeMessage({ timerFired: false });
    this.routerType();
  }

  private checkAuthentication() {
    this.dataStorageService.isAuthenticated().subscribe(
      (response) => {
        if (response && response["response"]) {
          // If already on uinservices, stay there, otherwise go to dashboard
          if (!window.location.href.includes('uinservices')) {
            this.router.navigate(['uinservices/dashboard']);
          }
        } else {
          // Not authenticated
          this.handleNotAuthenticated();
        }
      },
      (error) => {
        // Error in auth service (likely after logout)
        this.handleNotAuthenticated();
      }
    );
  }

  private handleNotAuthenticated() {
    if (window.location.href.includes('error=invalid_transaction')) {
      this.router.navigate(['error']);
    } else {
      // If we are deep inside uinservices but not authed, kick back to main dashboard
      if (window.location.href.includes('uinservices')) {
        this.router.navigate(['dashboard']);
      }
    }
  }

  routerType() {
    this.subscriptions.push(
      this.router.events
        .pipe(filter((event: NavigationEvent) => event instanceof NavigationStart))
        .subscribe((event: NavigationStart) => {
          if (event.restoredState) {
           // this.configService.navigationType = 'popstate';
            //this.preventBack();
          }
          if (this.keyboardService.isOpened) {
            this.keyboardService.dismiss();
          }
        })
    );
  }

  preventBack() {
    window.history.forward();
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.keyboardService.isOpened) {
      this.keyboardService.dismiss();
    }
  }

  @HostListener("blur", ["$event"])
  @HostListener("focusout", ["$event"])
  private _hideKeyboard() {
    if (this.keyboardService.isOpened) {
      this.keyboardService.dismiss();
    }
  }

  @HostListener('mouseover')
  @HostListener('document:mousemove', ['$event'])
  @HostListener('keypress')
  @HostListener('click')
  @HostListener('document:keypress', ['$event'])
  onMouseClick() {
    this.autoLogout.setisActive(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()});
  }
}

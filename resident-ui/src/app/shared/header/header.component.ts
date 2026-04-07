import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { TranslateService } from '@ngx-translate/core';
import defaultJson from "src/assets/i18n/default.json";
import { AppConfigService } from 'src/app/app-config.service';
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { DomSanitizer } from '@angular/platform-browser';
import { LogoutService } from './../../core/services/logout.service';
import { HeaderService } from 'src/app/core/services/header.service';
import { AuditService } from 'src/app/core/services/audit.service';
import { map, filter } from 'rxjs/operators'
import { MatDialog } from '@angular/material';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { AuthService } from 'src/app/core/services/authservice.service';
/*import { MatMenuModule } from '@angular/material/menu';*/
import { InteractionService } from "src/app/core/services/interaction.service";
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  flag = false;
  subscription: Subscription;
  userPreferredLang: string;
  textDir = localStorage.getItem("dir");
  defaultJsonValue: any;
  selectedLanguage: any;
  selectLanguagesArr: any = [];
  zoomLevel:any = [{"fontSize":"12", "label":"Small"},{"fontSize":"14", "label":"Normal"},{"fontSize":"16", "label":"Large"},{"fontSize":"18", "label":"Huge"}];
  fullName: string;
  lastLogin: string;
  userImage:any;
  notificationCount:any="";
  notificationList:any;
  langCode = localStorage.getItem("langCode");
  popupMessages:any;
  langJson:any;
  page = 1;
  selector: string = "#notificationMenu";
  clickEventSubscription: Subscription;
  sitealignment:string = localStorage.getItem('direction');
  activeUrl:string;
  agent:any = window.navigator.userAgent.toLowerCase();
  selectedfontsize:any = localStorage.getItem('selectedfontsize');
  selectedLangData:any;
  isAuthorized:boolean = false;
  showLangDropDown:any;
  isUinServicesPage: boolean = false;
  routeSubscription: Subscription;

  constructor(
    private router: Router,
    private appConfigService: AppConfigService,
    private translateService: TranslateService, 
    private dataStorageService: DataStorageService,
    private sanitizer: DomSanitizer,
    private logoutService: LogoutService,
    private headerService: HeaderService,
    private auditService: AuditService,
    private dialog: MatDialog,
    private authService: AuthService,
    private interactionService: InteractionService,
    private fontSizeService: FontSizeService
  ) {
    this.clickEventSubscription = this.interactionService.getClickEvent().subscribe((id) => {
      if (id === "logOutBtn") {
        this.logoutService.logout();
      }
      if(id === "changeLanguage"){
        this.selectedLanguage = this.selectedLangData.nativeName;
        localStorage.setItem("langCode", this.selectedLangData.code);
        window.location.reload();
      }
      
    }) 
  }

  getConfigData(){
      let allSupportedLanguages = this.appConfigService.getConfig()['supportedLanguages'].split(','); 
      let uniqueSupportedLanguages = allSupportedLanguages.filter((item, index) => allSupportedLanguages.indexOf(item) === index);
      this.showLangDropDown = uniqueSupportedLanguages.length > 1 ? true : false;
      
      if(uniqueSupportedLanguages.length > 1){
        uniqueSupportedLanguages.forEach((language) => {
          this.selectLanguagesArr.push({
           code: language.trim(),
           value: defaultJson.languages[language.trim()].nativeName,
          });
        });
      }

      this.translateService.use(localStorage.getItem("langCode")); 
      this.textDir = localStorage.getItem("dir");
      return
  }

  async ngOnInit() {
    this.defaultJsonValue = defaultJson;
    let self = this;
    this.getConfigData();

    this.selectedLanguage =  defaultJson["languages"][this.langCode].nativeName;
    self.getProfileInfo();

    await  this.translateService
    .getTranslation(localStorage.getItem("langCode"))
    .subscribe(response => {
      this.popupMessages = response;
      this.langJson = response.genericmessage
    });
    
    if(localStorage.getItem("redirectURL") === window.location.href){
      this.showMessage("logIn")
      localStorage.removeItem('redirectURL');

    } 

    if(localStorage.getItem("InactiveLogOut") === "true"){
      this.showInactiveLogOutMsg()
      localStorage.removeItem("logOut")
      localStorage.removeItem("InactiveLogOut")
    }
    
    if(localStorage.getItem("logOut") === 'true'){
      this.showMessage("logout")
      localStorage.removeItem('logOut');
    }
    this.activeUrl = window.location.hash
    this.selectedfontsize= localStorage.getItem('selectedfontsize')
    this.fontSizeService.setFontSize(this.selectedfontsize);
    
    // Initial check
    this.checkIfUinServicesPage();
    
    // Subscribe to router events to detect route changes
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeUrl = window.location.hash;
        this.checkIfUinServicesPage();
      });
  }

  checkIfUinServicesPage(): void {
    // Method 1: Check window.location.hash
    const isUinFromHash = window.location.hash.includes('/uinservices');
    
    // Method 2: Check router.url
    const isUinFromRouter = this.router.url.includes('uinservices');
    
    // Method 3: Check activeUrl property
    const isUinFromActive = this.activeUrl && this.activeUrl.includes('uinservices');
    
    // Use any of the methods that returns true
    this.isUinServicesPage = isUinFromHash || isUinFromRouter || isUinFromActive;
    
    console.log('isUinServicesPage:', this.isUinServicesPage);
    console.log('Hash:', window.location.hash);
    console.log('Router URL:', this.router.url);
    console.log('Active URL:', this.activeUrl);
  }

  getNotificationInfo(){
    this.dataStorageService
    .getNotificationCount()
    .subscribe((response) => {
      if(response["response"])
        if(parseInt(response["response"].unreadCount) < 100){          
          this.notificationCount = response["response"].unreadCount;
        }else{
          this.notificationCount = "99+";
        }
    });
  }

  loadNotificationData(){
    this.dataStorageService
    .updateNotificationTime()
    .subscribe((response) => {
    });
    
    this.dataStorageService
    .getNotificationData(this.langCode)
    .subscribe((response) => {
      if(response["response"])     
        this.notificationList = response["response"]["data"];
    });

    this.auditService.audit('RP-001', 'Notification section', 'RP-Notification', 'Notification section', 'User clicks on "notification" icon after logging in to UIN services', '');
    this.getNotificationInfo();
  }

  viewDetails(data:any){
    this.router.navigateByUrl(`uinservices/trackservicerequest?eid=`+data.eventId);
  }

  getProfileInfo(){
    let self = this;
    this.dataStorageService
    .getProfileInfo(this.langCode)
    .subscribe((response) => {
      if(response["response"]){
        this.isAuthorized = true;
        let autonotificationcall = self.appConfigService.getConfig()['resident.ui.notification.update.interval.seconds'];
        let timeperiod = autonotificationcall*1000;

        self.subscription = timer(0, timeperiod).pipe( map(() => { 
            this.getNotificationInfo();
          }) 
        ).subscribe();   
        this.fullName = response["response"].fullName;
        this.lastLogin = response["response"].lastLogin;
        if(response["response"].photo.data){
          this.userImage = this.sanitizer.bypassSecurityTrustResourceUrl(response["response"].photo.data);
        }else{
          this.userImage = "../assets/profile.png";
        }
        this.headerService.setUsername(this.fullName);
        this.getNotificationInfo();
      }  
    });  

   
  }

  textDirection() {
    return localStorage.getItem("dir");
  }

  setFontSize(size: any): void {
    localStorage.setItem("selectedfontsize", size.fontSize);
    this.selectedfontsize= localStorage.getItem('selectedfontsize')
    this.fontSizeService.setFontSize(size.fontSize);
  }

  onlanguagechange(item:any) {    
    if(window.location.href.includes('/uinservices/updatedemographic')){
      this.selectedLangData = item;
      this.showMsgForChangeLang();
    }else{
      this.selectedLanguage = item.nativeName;
      localStorage.setItem("langCode", item.code);
      window.location.reload();
    }
  }

  // Getter method for template - always check current state
  get showLogoutBtn(): boolean {
    const isUinPage = window.location.href.includes('/uinservices') || 
                      window.location.hash.includes('uinservices') || 
                      this.router.url.includes('uinservices');
    console.log('showLogoutBtn getter called, result:', isUinPage);
    return isUinPage;
  }

  godashboard() {
    console.log("this.authService.isAuthenticated()>>>"+this.fullName);
    if (this.fullName) {
      console.log("session exist>>>");
      this.router.navigate(["uinservices/dashboard"]);
    } else {
      console.log("session doesn't exist>>>");
      this.router.navigate(["dashboard"]);
    }
  }

  onHome() {
    this.router.navigate([
      localStorage.getItem("langCode"),
      "dashboard",
    ]);
  }

  get fontSize(): any {
    return this.fontSizeService.fontSize;
  }

  doLogout() {
    this.auditService.audit('RP-002', 'Logout', 'RP-Logout', 'Logout', 'User clicks on "logout" button after logging in to UIN services', '');
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '500px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.warningLabel,
        message: this.popupMessages.genericmessage.logoutconfirmMessage,
        clickYesToProceed: this.popupMessages.genericmessage.clickYesToProceed,
        yesBtnFor:"logOutBtn",
        btnTxt: this.popupMessages.genericmessage.yesButton,
        isYes:"Yes",
        btnTxtNo: this.popupMessages.genericmessage.noButton,
        isNo:"No"
      }
    });
    return dialogRef;
  }

  showUinServicesLogoutPopup() {
    if (confirm("Are you sure want to leave the page. you will be logged out automatically if you press OK?")) {
      this.auditService.audit('RP-002', 'Logout', 'RP-Logout', 'Logout', 'User clicks on "logout" button after logging in to UIN services','');
      this.logoutService.logout();
    } else {
      history.pushState(null, null, window.location.href);
      return false;
    }
  }

  showMessage(message:any) {
    setTimeout(() => {
      if(message === "logIn"){
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '550px', 
          data: {
            case: 'LoginLogoutSuccessMessages',
            title: this.popupMessages.genericmessage.successLabel,
            message: this.popupMessages.genericmessage.SuccessLogin,
            dearResident:this.popupMessages.genericmessage.dearResident,
            btnTxt: this.popupMessages.genericmessage.successButton,
            isOk:'OK'
          }
        });
        return dialogRef;
      }else{
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '550px',
          data: {
            case: 'LoginLogoutSuccessMessages',
            title: this.popupMessages.genericmessage.successLabel,
            message: this.popupMessages.genericmessage.successLogout,
            clickHere: this.popupMessages.genericmessage.clickHere,
            dearResident:this.popupMessages.genericmessage.dearResident,
            clickHere2: this.popupMessages.genericmessage.clickHere2,
            relogin: this.popupMessages.genericmessage.relogin,
            btnTxt: this.popupMessages.genericmessage.successButton,
            isOk:'OK'
          }
        });
        return dialogRef;
      }
      
    },400)
   
  }
   
  showInactiveLogOutMsg(){
    setTimeout(() => {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        case: 'INACTIVELOGOUTPOPUP',
        title: this.popupMessages.genericmessage.errorLabel,
        message: this.popupMessages.autologout.post,
        clickHere: this.popupMessages.genericmessage.clickHere,
        dearResident:this.popupMessages.genericmessage.dearResident,
        clickHere2: this.popupMessages.genericmessage.clickHere2,
        relogin: this.popupMessages.genericmessage.relogin
      }
    });
    return dialogRef;
  },400)
  }

  showMsgForChangeLang(){
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        case: 'MESSAGEFORLANGCHANGE',
        message:this.popupMessages.genericmessage.langChgWarnText ,
        btnTxt: this.popupMessages.genericmessage.continue,
        btnTxtCanc: this.popupMessages.genericmessage.cancel
        
      }
    });
    return dialogRef;
  }

  onItemSelected(item: any) {
    /*const itemName = item.route.split('/')[item.route.split('/').length - 1];*/
    console.log("item>>>"+item);
    /*this.auditService.audit(1, item.auditEventId, itemName);
    if (this.screenResize < 840) {
      this.sideMenuService.closeNav();
      this.router.navigate([item.route]);
    } else {*/
      this.router.navigate([item]);
    /*}*/
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.clickEventSubscription.unsubscribe();
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    //window.removeEventListener('scroll', this.scroll, true);
  }

}
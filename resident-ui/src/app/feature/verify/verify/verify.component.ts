import { Component, OnInit, OnDestroy,Renderer2 } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { DataStorageService } from "src/app/core/services/data-storage.service";
import { AppConfigService } from 'src/app/app-config.service';
import Utils from 'src/app/app.utils';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { AuditService } from "src/app/core/services/audit.service";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-verify",
  templateUrl: "./verify.component.html",
  styleUrls: ["./verify.component.css"],
})
export class VerifyComponent implements OnInit, OnDestroy {
  verifyChannelData:any;
  transactionID: any;
  individualId: string = "";
  otp: string = "";
  otpChannel: any = [];
  popupMessages: any;
  showOtpPanel: boolean = false;
  siteKey: any;
  resetCaptcha: boolean;
  numBtnColors: string = "#909090";
  emailBtnColors: string = "#909090";
  resetBtnDisable: boolean = true;
  submitBtnDisable: boolean = true;
  otpTimeSeconds: any = "00";
  otpTimeMinutes: number;
  displaySeconds: any = this.otpTimeSeconds
  interval: any;
  message: string;
  errorCode: any;
  channelType: string;
  disableSendOtp: boolean = true;
  isPopUpShow:boolean = false;
  infoText:string;
  eventId:any;
  channelSelected:any = false;
  phoneIcon:boolean = false;
  mailIcon:boolean = false;
  captchaChecked:boolean = false;
  width : string;
  deviceSize:string = "";
  inputDisabled:boolean = false;
  captchaEnable: boolean = false;
  vidLength:string = "0";
  uinLength:string = "0";
  aidLength:string = "0";

  constructor(
    private router: Router,
    private dataStorageService: DataStorageService,
    private translateService: TranslateService,
    private appConfigService: AppConfigService,
    private dialog: MatDialog,
    private renderer: Renderer2,
    private auditService: AuditService, 
    private breakpointObserver: BreakpointObserver,
    private fontSizeService: FontSizeService
  ) {
    this.appConfigService = this.appConfigService.getConfig();
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge,
    ]).subscribe(result => {
      if (result.matches) {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.width = "100%";
          this.deviceSize = "XSmall";
        }
        if (result.breakpoints[Breakpoints.Small]) {
          this.width = "90%";
          this.deviceSize = "Small";
        }
        if (result.breakpoints[Breakpoints.Medium]) {
          this.width = "80%";
          this.deviceSize = "Medium";
        }
        if (result.breakpoints[Breakpoints.Large]) {
          this.width = "64%";
          this.deviceSize = "Large";
        }
        if (result.breakpoints[Breakpoints.XLarge]) {
          this.width = "35%";
          this.deviceSize = "XLarge";
        }
      }
    });
  }

  ngOnInit() {

    let self = this;
    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.verifyChannelData = response.verifyuinvid;
        this.popupMessages = response;
        this.infoText = response.InfomationContent.verifyChannel
      });
    setTimeout(() => {
      self.siteKey = self.appConfigService["mosip.resident.captcha.sitekey"];
      self.captchaEnable = JSON.parse(self.appConfigService["mosip.resident.captcha.enable"]); 
      self.vidLength = self.appConfigService["mosip.kernel.vid.length"];
      self.uinLength = self.appConfigService["mosip.kernel.uin.length"];
      self.aidLength = self.appConfigService["mosip.kernel.rid.length"];
    }, 1000);  
    /*this.captchaService.captchStatus.subscribe((status)=>{
      this.captchaStatus = status;
      if (status == false) {
          alert("Opps!\nCaptcha mismatch")
      } else if (status == true)  {
          alert("Success!\nYou are right")
      }
    });*/
    
  }



  captureOtpValue(value: string) {
    this.otp = value
    if (value !== "") {
      this.submitBtnDisable = false
    } else {
      this.submitBtnDisable = true
    }
  }

  /*loadRecaptchaSiteKey() {
    this.siteKey = "6LcM7OAeAAAAAChEa_jqFzlipTC7nf6hHG5eAGki";
  }*/

  radioChange(event: any) {
    this.channelSelected = true
    this.otpChannel = [];
    this.otpChannel.push(event);
    if (event === "PHONE") {
      this.numBtnColors = "#03A64A";
      this.emailBtnColors = "#909090";
      this.phoneIcon = true
      this.mailIcon = false
    } else {
      this.emailBtnColors = "#03A64A"
      this.numBtnColors = "#909090"
      this.mailIcon = true
      this.phoneIcon = false
    }
    if (this.channelSelected && this.individualId) {
      if(this.captchaEnable){
        if(this.captchaChecked){
          this.disableSendOtp = false
        }        
      }else{
        this.disableSendOtp = false
      }
    } else {
      this.disableSendOtp = true
    }
  }

  getCaptchaToken(event: Event) {
    this.captchaChecked = true
    if (this.channelSelected && (this.individualId.length == parseInt(this.vidLength) || this.individualId.length == parseInt(this.uinLength) || this.individualId.length == parseInt(this.aidLength))) {
      if(this.captchaEnable){
        if(this.captchaChecked){
          this.disableSendOtp = false
        }        
      }else{
        this.disableSendOtp = false
      }
    } else {
      this.disableSendOtp = true
    }
  }
  
  captureValue(event: any, formControlName: string) {
    this[formControlName] = event.target.value;
    if (this.channelSelected && (this.individualId.length == parseInt(this.vidLength) || this.individualId.length == parseInt(this.uinLength) || this.individualId.length == parseInt(this.aidLength))) {
      if(this.captchaEnable){
        if(this.captchaChecked){
          this.disableSendOtp = false
        }        
      }else{
        this.disableSendOtp = false
      }
    } else {
      this.disableSendOtp = true
    }
  }

  isNumberKey(event){
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)){
      return false;
    }else{
      return true;
    }
  }

  setOtpTime() {
    this.otpTimeMinutes = this.appConfigService['mosip.kernel.otp.expiry-time']/60;
    this.interval = setInterval(() => {
      if (this.otpTimeSeconds < 0 || this.otpTimeSeconds === "00") {
        this.otpTimeSeconds = 59
        this.otpTimeMinutes -= 1
      }
      if (this.otpTimeMinutes < 0 && this.displaySeconds === "00") {
        this.otpTimeSeconds = 0;
        this.otpTimeMinutes = 0;
        clearInterval(this.interval)
        this.displaySeconds = "00";
        this.resetBtnDisable = false;
        this.inputDisabled = true;
        this.submitBtnDisable = true;
        this.otp = "";
      }
      if (this.otpTimeSeconds < 10) {
        this.displaySeconds = "0" + this.otpTimeSeconds.toString()
      } else {
        this.displaySeconds = this.otpTimeSeconds
      }
      this.otpTimeSeconds -= 1
    }, 1000);
  }

  sendOtpBtn() {
    this.auditService.audit('RP-037', 'Verify phone number/email ID', 'RP-Verify phone number/email ID', 'Verify phone number/email ID', 'User clicks on "send OTP" button on verify phone number/email Id page', this.individualId);
    this.isVerifiedPhoneNumEmailId()
  }

  resendOtp() {
    this.auditService.audit('RP-039', 'Verify phone number/email ID', 'RP-Verify phone number/email ID', 'Verify phone number/email ID', 'User clicks on "resend OTP" button on verify phone number/email Id page', this.individualId);
    clearInterval(this.interval)
    this.otpTimeSeconds = "00"
    this.otpTimeMinutes = this.appConfigService['mosip.kernel.otp.expiry-time']/60
    setInterval(this.interval)
    this.resetBtnDisable = true;
    this.generateOTP()
  }

  submitOtp() {
    this.auditService.audit('RP-038', 'Verify phone number/email ID', 'RP-Verify phone number/email ID', 'Verify phone number/email ID', 'User clicks on the "submit button" on verify phone number/email Id page', this.individualId);
    this.verifyOTP()
  
  }

  generateOTP() {
    this.transactionID = window.crypto.getRandomValues(new Uint32Array(1)).toString();
    if (this.transactionID.length < 10) {
      let diffrence = 10 - this.transactionID.length;
      for(let i=0; i < diffrence; i++){
          this.transactionID = this.transactionID + i
      }
    } 
    let self = this;
    const request = {
      "id": self.appConfigService['mosip.resident.api.id.otp.request'],
      "version": self.appConfigService["mosip.resident.api.version.otp.request"],
      "transactionID": self.transactionID,
      "requestTime": Utils.getCurrentDate(),
      "individualId": self.individualId + "@nin",
      "otpChannel": self.otpChannel
    };
  
    this.dataStorageService.generateOTP(request).subscribe(response => {
      if (!response["errors"]) {
        if (this.otpChannel[0] === "PHONE") {
          this.channelType = response["response"].maskedMobile
        } else {
          this.channelType = response["response"].maskedEmail
        }
        self.showOtpPanel = true;
        self.setOtpTime();
        this.inputDisabled = false;
        this.disableSendOtp = true;
      } else {
        self.showErrorPopup(response["errors"]);
        self.showOtpPanel = false;
      }
    },
      error => {
        console.log(error);
      }
    );
  }

  isVerifiedPhoneNumEmailId() {
    this.dataStorageService.isVerified(this.otpChannel[0], this.individualId).subscribe(response => {
      if (!response["errors"]) {
        if (response["response"].verificationStatus) {
          this.showMessageWarning(response["response"]);
          this.router.navigate(["dashboard"]);
        } else {
          this.generateOTP()
          this.otpTimeMinutes = this.appConfigService['mosip.kernel.otp.expiry-time']/60
          this.otpTimeSeconds = "00"
          this.disableSendOtp = true;
        }
      } else {
        this.showErrorPopup(response["errors"])
      }
    })
  }

  verifyOTP() {
    let self = this;
    const request = {
      "id": self.appConfigService['mosip.resident.api.id.otp.request'],
      "version": self.appConfigService["mosip.resident.api.version.otp.request"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "transactionId": self.transactionID,
        "individualId": self.individualId + "@nin",
        "otp": self.otp
      }
    };
    this.dataStorageService.verifyOTP(request).subscribe(response => {
      self.eventId = response.headers.get("eventid")
      if (!response.body["errors"]) {
        this.router.navigate(["dashboard"])
        self.showMessage(response.body["response"],this.eventId);
        clearInterval(this.interval)
      } else {
        self.showErrorPopup(response.body["errors"]);
      }
    },
      error => {
        console.log(error);
      }
    );
  }

  showMessage(message: string,eventId:any) {
    if (this.otpChannel[0] === "PHONE") {
      this.message = this.popupMessages.genericmessage.verifyChannel.phoneSuccess.replace("$channel", this.channelType).replace("$eventId",eventId)
    } else {
      this.message = this.popupMessages.genericmessage.verifyChannel.emailSuccess.replace("$channel", this.channelType).replace("$eventId",eventId)
    }

    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        case: 'logInForTrackService',
        title: this.popupMessages.genericmessage.errorLabel,
        message: this.message,
        clickHere: this.popupMessages.genericmessage.clickHere,
        dearResident:this.popupMessages.genericmessage.dearResident,
        trackStatusForLogin:this.popupMessages.genericmessage.trackStatusForLogin,
        relogin: this.popupMessages.genericmessage.login,
        btnTxt: this.popupMessages.genericmessage.successButton
      }
    });
    return dialogRef;
  }

  showMessageWarning(message:any) {
    if (this.otpChannel[0] === "PHONE") {
      this.message = this.popupMessages.genericmessage.verifyChannel.warningMsgForPhone.replace("$userID", message.maskedUserId)
    } else {
      this.message = this.popupMessages.genericmessage.verifyChannel.warningMsgForEmail.replace("$userID", message.maskedUserId)
    }

    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.warningLabel,
        warningForChannel:this.popupMessages.genericmessage.warningForChannel,
        message: this.message,
        btnTxt: this.popupMessages.genericmessage.successButton,
        isOk:'OK'
      }
    });
    return dialogRef;
  }

  showErrorPopup(message: string) {
    this.errorCode = message[0]["errorCode"]
    if (this.errorCode === "RES-SER-410") {
      let messageType = message[0]["message"].split("-")[1].trim();
      this.message = this.popupMessages.serverErrors[this.errorCode][messageType]
    } else {
      this.message = this.popupMessages.serverErrors[this.errorCode]
    }
    if (this.errorCode === "IDA-MLC-009" || this.errorCode === 'IDA-OTA-002') {
      this.dialog
      .open(DialogComponent, {
        width: '550px',
        data: {
          case: 'errorMessageWithClickHere',
          title: this.popupMessages.genericmessage.errorLabel,
          dearResident: this.popupMessages.genericmessage.dearResident,
          message: this.message,
          clickHere2:this.popupMessages.genericmessage.clickHere2,
          clickHere:this.popupMessages.genericmessage.clickHere,
          btnTxt: this.popupMessages.genericmessage.successButton,
          toFindRegCen:this.popupMessages.genericmessage.toFindRegCen,
          isOk: "OK"
        },
        disableClose: true
      });
    } else {
      this.dialog
        .open(DialogComponent, {
          width: '550px',
          data: {
            case: 'MESSAGE',
            title: this.popupMessages.genericmessage.errorLabel,
            message: this.message,
            btnTxt: this.popupMessages.genericmessage.successButton,
            isOk: "OK"
          },
          disableClose: true
        });
    }
  }


  onItemSelected(item: any) {
    if (item === "home") {
      this.router.navigate(["dashboard"]);
    } else if (item === "back") {
      this.showOtpPanel = false;
      this.resetBtnDisable = true;
      this.submitBtnDisable = true;
      this.otp="";
    }
    clearInterval(this.interval)
    this.displaySeconds = "00"
  }

  get fontSize(): any {
    document.documentElement.style.setProperty('--fs', this.fontSizeService.fontSize.breadcrumb)
    return this.fontSizeService.fontSize;
  }

  ngOnDestroy(): void {
  }
 
}

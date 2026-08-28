import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import Utils from 'src/app/app.utils';
import { TranslateService } from "@ngx-translate/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { AppConfigService } from 'src/app/app-config.service';
import { saveAs } from 'file-saver';
import { AuditService } from 'src/app/core/services/audit.service';
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: 'app-bookappointment',
  templateUrl: './downloaduin.component.html',
  styleUrls: ['./downloaduin.component.css']
})
export class DownloadUinComponent implements OnInit {
  downloadUinData: any
  otp: string = ""
  transactionID: any;
  individualId: string = "";
  data: any;
  otpTimeMinutes: number;
  otpTimeSeconds: any = "00";
  displaySeconds: any = this.otpTimeSeconds
  showPopupForUidCard: boolean = false;
  popupMessages: any;
  interval: any;
  phoneNumber: any;
  emailId: any;
  resetBtnDisable: boolean = true;
  submitBtnDisable: boolean = true;
  errorCode: string;
  message: string = "";
  pdfSrc = "";
  eventId: any;
  isLoading:boolean = false;
  stage: any;
  aidStatus: any;

  userPreferredLangCode = localStorage.getItem("langCode");
  showNin: boolean;
  ninValue: any;

  constructor(
    private router: Router,
    private dataStorageService: DataStorageService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private appConfigService: AppConfigService,
    private auditService: AuditService,
    private fontSizeService: FontSizeService
  ) {
    if (this.router.getCurrentNavigation().extras.state) {
      this.data = this.router.getCurrentNavigation().extras.state.data
      this.transactionID = this.router.getCurrentNavigation().extras.state.response.transactionId
      this.phoneNumber = this.router.getCurrentNavigation().extras.state.response.response.maskedMobile
      this.emailId = this.router.getCurrentNavigation().extras.state.response.response.maskedEmail
      this.stage = this.router.getCurrentNavigation().extras.state.stage;
      this.aidStatus = this.router.getCurrentNavigation().extras.state.aidStatus;
    } else {
      this.router.navigate(["getuin"])
      clearInterval(this.interval)  
    }

  }
  
  ngOnInit() {
    this.translateService.getTranslation(this.userPreferredLangCode).subscribe(response => {
      this.downloadUinData = response.downloadUin,
        this.popupMessages = response;
    })
    this.setOtpTime()
  }

  setOtpTime() {
    this.otpTimeMinutes = this.appConfigService.getConfig()['mosip.kernel.otp.expiry-time']/60;
    this.interval = setInterval(() => {
      if (this.otpTimeSeconds < 0 || this.displaySeconds === "00") {
        this.otpTimeSeconds = 59
        this.otpTimeMinutes -= 1
      }
      if (this.otpTimeMinutes < 0 && this.displaySeconds === "00") {
        this.otpTimeSeconds = 0;
        this.otpTimeMinutes = 0;
        clearInterval(this.interval);
        this.displaySeconds = "00";
        this.resetBtnDisable = false;
        this.submitBtnDisable = true;
      }
      if (this.otpTimeSeconds < 10) {
        this.displaySeconds = "0" + this.otpTimeSeconds.toString()
      } else {
        this.displaySeconds = this.otpTimeSeconds;
      }
      this.otpTimeSeconds -= 1
    }, 1000);
  }

  captureValue(val: any) {
    this.otp = val
    if (this.otp.length > 0) {
      this.submitBtnDisable = false;
    } else {
      this.submitBtnDisable = true;
    }
  }

  submitOtp(){
    console.log("Submit to UIN download", this.stage, this.aidStatus);
    this.auditService.audit('RP-035', 'Get my UIN', 'RP-Get my UIN', 'Get my UIN', 'User clicks on the "submit button" on Get my UIN page', this.data);
    if(this.stage === "CARD_READY_TO_DOWNLOAD" && this.aidStatus === "SUCCESS") {
    this.validateUinCardOtp();
    } else if(this.stage === "CARD_READY_TO_DOWNLOAD" && this.aidStatus === "IN-PROGRESS") {
      this.ValidateOtpGetNin(this.stage, this.aidStatus);
    }
  }

  resendOtp(){
    this.auditService.audit('RP-036', 'Get my UIN', 'RP-Get my UIN', 'Get my UIN', 'User clicks on "resend OTP" button on Get my UIN page', this.data);
    clearInterval(this.interval)
    this.otpTimeMinutes = this.appConfigService.getConfig()['mosip.kernel.otp.expiry-time']/60;
    this.displaySeconds = "00";
    this.generateOTP(this.data)
    this.resetBtnDisable = true;
    this.setOtpTime();
  }

  generateOTP(data: any) {
    this.transactionID = window.crypto.getRandomValues(new Uint32Array(1)).toString();
    if (this.transactionID.length < 10) {
      let diffrence = 10 - this.transactionID.length;
      for(let i=0; i < diffrence; i++){
          this.transactionID = this.transactionID + i
      }
    } 

    let self = this;
    const request = {
      "id": "mosip.identity.otp.internal",
      "individualId": this.data,
      "metadata": {},
      "otpChannel": [
        "PHONE",
        "EMAIL"
      ],
      "transactionId": self.transactionID,
      "requestTime": Utils.getCurrentDate(),
      "version": this.appConfigService.getConfig()["resident.vid.version.new"]
    };
    this.dataStorageService.generateOTPForUid(request)
      .subscribe((response) => {
        if(response['response']){
          
        }
      },
        error => {
          console.log(error)
        }
      )
  }

  validateUinCardOtp() {
    this.isLoading = true;
    let self = this;
    const request = {
      "id": "mosip.resident.download.uin.card",
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "transactionId": self.transactionID,
        "individualId": self.data,
        "otp": self.otp
      }
    };
    
    self.dataStorageService.validateUinCardOtp(request)
    .subscribe(async (response: any) => {
      this.isLoading = false;
      const isJsonBlob = (data: any) => data instanceof Blob && data.type === "application/json";
      const responseData = isJsonBlob(response) ? await response.text() : response || {};
      const responseJson = (typeof responseData === "string") ? JSON.parse(responseData) : responseData;
      if (responseJson.body.type === "application/pdf") {
        this.eventId = response.headers.get("eventid")
        clearInterval(this.interval)
        var fileName = self.data + ".pdf";
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = fileNameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            fileName = matches[1].replace(/['"]/g, '');
          }
        }
        saveAs(response.body, fileName);
        this.router.navigate(["dashboard"])
        this.showMessage(response["response"], this.eventId);
      }else{
        var reader = new FileReader();
          reader.onloadend = function(e) {
          let failureResponse = JSON.parse((<any>e.target).result)
          self.showErrorMsgPopup(failureResponse.errors);
        }
        reader.readAsText(responseJson.body);
      }
    },
    error => {
      console.log(error)
    });   
  }

  ValidateOtpGetNin(stage: string, aidStatus: string) {
    this.isLoading = true;
    let self = this;
    const request = {
      "id": "mosip.resident.download.uin.card",
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "transactionId": self.transactionID,
        "individualId": self.data,
        "otp": self.otp
      }
    };
    
    self.dataStorageService.getNinFromRID(request)
    .subscribe(async (response: any) => {
      const responseData = response && response.body instanceof Blob
        ? await response.body.text()
        : response && response.body ? response.body : response;
      const responseJson = typeof responseData === "string"
        ? JSON.parse(responseData)
        : responseData;
      if (responseJson && responseJson["response"] && responseJson["response"].nin) {
        const nin = responseJson["response"].nin;
        console.log("NIN:", nin);
        console.log("responseJson: ", responseJson);
        this.router.navigate(["getuin"], {state: {showStatus: true, aid: this.data, statusResponse: responseJson, stage, aidStatus}});
      } else {
        this.showErrorMsgPopup(responseJson && responseJson["errors"] ? responseJson["errors"] : [{
          errorCode: "UNKNOWN",
          message: "Unable to retrieve NIN"
        }]);
      }
    }, error => {
      console.log(error);
    });
  }

  showMessage(message: string, eventId: any) {
    this.message = this.popupMessages.genericmessage.getMyUin.downloadedSuccessFully.replace("$eventId", eventId)
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
        btnTxt: this.popupMessages.genericmessage.successButton,
        isok:"OK",
        passwordCombinationHeading: this.popupMessages.genericmessage.passwordCombinationHeading,
        passwordCombination: this.popupMessages.genericmessage.passwordCombination
      }
    });
    return dialogRef;
  }

  showErrorMsgPopup(message: string) {
    this.errorCode = message[0]["errorCode"]
    if (this.errorCode === "RES-SER-410") {
      let errorType = message[0]["message"].split("-")[1].trim();
      this.message = this.popupMessages.serverErrors[this.errorCode][errorType]
    } else {
      this.message = this.popupMessages.serverErrors[this.errorCode]
    }
    this.dialog
      .open(DialogComponent, {
        width: '550px',
        data: {
          case: 'MESSAGE',
          title: this.popupMessages.genericmessage.errorLabel,
          message: this.message,
          btnTxt: this.popupMessages.genericmessage.successButton,
          isOk:'OK'
        },
        disableClose: true
      });
  }

  get fontSize(): any {
    return this.fontSizeService.fontSize;
  }

  onItemSelected(item: any) {
    if (item === "home") {
      this.router.navigate(["dashboard"])
    } else if (item === "back") {
      this.router.navigate(["getuin"])
      clearInterval(this.interval)
      this.displaySeconds = "00"
    }
  }

}

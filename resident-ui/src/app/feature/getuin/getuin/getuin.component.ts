import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { TranslateService } from "@ngx-translate/core";
import { AppConfigService } from 'src/app/app-config.service';
import { DataStorageService } from "src/app/core/services/data-storage.service";
import Utils from 'src/app/app.utils';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { AuditService } from 'src/app/core/services/audit.service';
import { BreakpointService } from "src/app/core/services/breakpoint.service";
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: 'app-getuin',
  templateUrl: './getuin.component.html',
  styleUrls: ['./getuin.component.css']
})
export class GetuinComponent implements OnInit {
  getUinData: any;
  transactionID: any;
  isChecked: boolean = true;
  otpChannel: any = [];
  siteKey:string = "";
  resetCaptcha: boolean;
  userPreferredLangCode = localStorage.getItem("langCode");
  errorCode:string;
  message:string = "";
  popupMessages:any;
  infoPopUpShow:boolean = false;
  infoText:string;
  isUinNotReady:boolean = false;
  getStatusData:any;
  aid:string;
  orderStatus:any;
  orderStatusIndex:any;
  width : string;
  stageKeys:any = [];
  disableSendOtp: boolean = true;
  aidStatus:string;
  captchaEnable: boolean = false;
  sitealignment:string = localStorage.getItem('direction');
  classes:any ={
    "SUCCESS": "processing-position-icon position-icon",
    "FAILURE":"failure-position-icon position-icon",
    "IN-PROGRESS":"inactive-position-icon position-icon"
  }
  vidLength:string;
  uinLength:string;
  aidLength:string;
  ninLength:string;
  isLoading:boolean = true;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private dataStorageService: DataStorageService,
    private appConfigService: AppConfigService,
    private dialog: MatDialog,
    private auditService: AuditService,
    private breakPointService: BreakpointService,
    private fontSizeService: FontSizeService
  ) {
    this.translateService.use(localStorage.getItem("langCode"));
    this.appConfigService.getConfig();
    this.breakPointService.isBreakpointActive().subscribe(active =>{
      if (active) {
        if(active === "extraSmall"){
          this.width = "90%";
        }
        if(active === "small"){
          this.width = "90%";
        }
        if(active === "medium"){
          this.width = "90%";
        }
        if(active === "large"){
          this.width = "40%";
        }
        if(active === "ExtraLarge"){
          this.width = "30%";
        }
      }
    });
  }

  getConfigData(){
    this.siteKey = this.appConfigService.getConfig()["mosip.resident.captcha.sitekey"];
    this.captchaEnable = JSON.parse(this.appConfigService.getConfig()["mosip.resident.captcha.enable"]);
    this.vidLength = this.appConfigService.getConfig()["mosip.kernel.vid.length"];
    this.uinLength = this.appConfigService.getConfig()["mosip.kernel.uin.length"];
    this.aidLength = this.appConfigService.getConfig()["mosip.kernel.rid.length"];
    this.ninLength = this.appConfigService.getConfig()["mosip.kernel.nin.length"];
    this.getLangData()
    this.isLoading = false;
  }

  getLangData(){
    this.translateService.use(localStorage.getItem("langCode"));    
    this.translateService
    .getTranslation(this.userPreferredLangCode)
      .subscribe(response => {
        this.getUinData = response.uinservices
        this.popupMessages = response
        this.infoText = response.InfomationContent.getUin.replace('$AID',this.aidLength).replace('$UIN',this.uinLength).replace('$VID',this.vidLength).replace('$NIN',this.ninLength)
        this.getStatusData = response.uinStatus
        this.stageKeys =  Object.keys(this.getStatusData.statusStages)
    });
  }

  ngOnInit() {
    this.getConfigData()
  }

  onItemSelected(item: any) {
    if (item === "home") {
      this.router.navigate(["dashboard"]);
    }else{
      this.isUinNotReady = false
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
  getUserID(event){
    this.aid = event.target.value
    if (this.captchaEnable) {
      if (grecaptcha.getResponse().length && (this.aid.length == parseInt(this.vidLength) || this.aid.length == parseInt(this.uinLength) || this.aid.length == parseInt(this.aidLength) || this.aid.length == parseInt(this.ninLength))) {
        this.disableSendOtp = false;
      } else {
        this.disableSendOtp = true;
      }
    }else{
      if (this.aid.length == parseInt(this.vidLength) || this.aid.length == parseInt(this.uinLength) || this.aid.length == parseInt(this.aidLength) || this.aid.length == parseInt(this.ninLength)) {
        this.disableSendOtp = false;
      }else{
        this.disableSendOtp = true;
      }
    }
  }
  
  getCaptchaToken(event: any) {
    if (event) {
      if(this.captchaEnable){
        if(this.aid.length == parseInt(this.vidLength) || this.aid.length == parseInt(this.uinLength) || this.aid.length == parseInt(this.aidLength) || this.aid.length == parseInt(this.ninLength)){
          this.disableSendOtp = false;
        }
      }else{
        this.disableSendOtp = false;
      }      
    } else {
      this.disableSendOtp = true;
    }
  }


  submitUserID() {
    this.auditService.audit('RP-034', 'Get my UIN', 'RP-Get my UIN', 'Get my UIN', 'User clicks on "send OTP" button on Get my UIN page',this.aid);
    if (this.aid !== undefined) {
      this.getStatus(this.aid)
    }
  }

  getStatus(data:any){
    this.dataStorageService.getStatus(data).subscribe(response =>{
      if(response["response"]){
        if(response["response"].transactionStage === "CARD_READY_TO_DOWNLOAD" && response["response"].aidStatus === "SUCCESS"){
          this.generateOTP(data);
        }else{
          this.isUinNotReady = true
          this.orderStatus = response["response"].transactionStage;
          this.aidStatus = response["response"].aidStatus;
          this.orderStatusIndex =  this.stageKeys.indexOf(this.orderStatus);
        }
        this.disableSendOtp = true;
      }else{
        this.showErrorPopup(response["errors"]);
      }
     
    })
  }

  generateOTP(data:any) {
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
      "individualId": data,
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
    .subscribe((response) =>{
      if(!response["errors"]){
        this.router.navigate(["downloadMyUin"],{state:{data,response}})
      }else{
        this.showErrorPopup(response["errors"])
      }
    },
    error =>{
      console.log(error)
    }
    )
  }

  showErrorPopup(message: any) {
    this.errorCode = message[0]["errorCode"]
    if (this.errorCode === "RES-SER-410") {
      let messageType = message[0]["message"].split("-")[1].trim();
      this.message = this.popupMessages.serverErrors[this.errorCode][messageType]
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
          isOk:"OK"
        },
        disableClose: true
      });
  }

  get fontSize(): any {
    document.documentElement.style.setProperty('--fs', this.fontSizeService.fontSize.breadcrumb)
    return this.fontSizeService.fontSize;
  }

  openPopup(){
    this.infoPopUpShow = !this.infoPopUpShow
  }

}



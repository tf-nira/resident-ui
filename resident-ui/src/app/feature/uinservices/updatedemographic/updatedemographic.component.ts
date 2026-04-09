import { Component, OnInit, OnDestroy, ViewChildren, ElementRef, HostListener } from "@angular/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import Utils from "src/app/app.utils";
import { InteractionService } from "src/app/core/services/interaction.service";
import { AuditService } from "src/app/core/services/audit.service";
import defaultJson from "src/assets/i18n/default.json";
import { AutoLogoutService } from "src/app/core/services/auto-logout.service";
import { BreakpointService } from "src/app/core/services/breakpoint.service";
import {
  MatKeyboardRef,
  MatKeyboardComponent,
  MatKeyboardService
} from 'ngx7-material-keyboard-ios';
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-demographic",
  templateUrl: "updatedemographic.component.html",
  styleUrls: ["updatedemographic.component.css"],
})

export class UpdatedemographicComponent implements OnInit, OnDestroy {
  userInfo: any;
  static actualData: any;
  schema: any;
  subscriptions: Subscription[] = [];
  buildJSONData: any = {};
  langCode: string = localStorage.getItem("langCode");
  dropDownValues: any = {};
  supportedLanguages: Array<string>;
  locationFieldNameList: string[] = [];
  locCode = 0;
  initialLocationCode: any = "";
  dynamicDropDown = {};
  files: any[] = [];
  filesPOA: any[] = [];
  proofOfIdentity: any = {};
  proofOfAddress: any = {};
  transactionID: any;
  userId: any;
  userIdEmail: string = "";
  userIdPhone: string = "";
  clickEventSubscription: Subscription;
  popupMessages: any;
  pdfSrc = "";
  pdfSrcPOA = "";
  confirmEmailContact: string = "";
  confirmPhoneContact: string = "";
  sendOtpDisable: boolean = true;
  showPreviewPage: boolean = false;
  userInfoClone: any = {};
  userInfoAddressClone: any = {};
  userPrefLang: any = {};
  buildCloneJsonData: any = [];
  uploadedFiles: any[] = [];
  previewDisabled: boolean = true;
  pdfSrcInPreviewPage = "";
  previewDisabledInAddress: boolean = true;
  selectedDate: any;
  message: any;
  errorCode: any;
  selectedLanguage: any;
  defaultJsonValue: any;
  newLangArr: any = [];
  perfLangArr: any = {};
  newNotificationLanguages: any;
  matTabLabel: string;
  matTabIndex: number = 0;
  contactTye: string = "";
  width: string;
  cols: number;
  message2: any;
  displayPOIUpload: boolean = false;
  displayPOAUpload: boolean = false;
  maxdate: Date = new Date();
  isValidFileFormatPOI: boolean = false;
  isValidFileFormatPOA: boolean = false;
  warningMessage: string;
  langJson: any;
  isLoading: boolean = true;
  showNotMatchedMessageEmail: boolean = false;
  showNotMatchedMessagePhone: boolean = false;
  email: any;
  phone: any;
  userInputValues: any = {};
  finalUserCloneData: any;
  updatingtype: string;
  sitealignment: string = localStorage.getItem('direction');
  transactionIDForPOI:string = "";
  transactionIDForPOA:string = "";
  getAllDocIds:any = {};
  isSelectedAllAddress:boolean = true;
  fieldName:string;
  oldKeyBoradIndex:number;
  getUserPerfLang = [this.langCode];
  getUserPerfLangString:string = "";
  attributeUpdateCountMaxLimit:any;
  attributeUpdateCountRemainLimit:any = {};
  selectedOptionData:any;
  oldSelectedIndex:any;
  isSameData: any = {};
  cancellable:boolean = false;
  draftsDetails:any = [];
  enteredOnlyNumbers:boolean = false;
  disablePrefLangBtn:boolean = false;
  firstInputLang:any = {};
  draftInterval: any;
  isDraftEmpty: boolean;


  private keyboardRef: MatKeyboardRef<MatKeyboardComponent>;
  @ViewChildren('keyboardRef', { read: ElementRef })
  private attachToElementMesOne: any;
  constructor(private autoLogout: AutoLogoutService, private interactionService: InteractionService,
    private dialog: MatDialog, private dataStorageService: DataStorageService,
    private translateService: TranslateService, private router: Router,
    private appConfigService: AppConfigService, private auditService: AuditService,
    private breakPointService: BreakpointService,
    private keyboardService: MatKeyboardService,
    private fontSizeService: FontSizeService) {
    this.clickEventSubscription = this.interactionService.getClickEvent().subscribe((id) => {
      if (id === "updateMyData") {
        this.updateDemographicData();
        if (this.updatingtype === "address") {
          this.auditService.audit('RP-028', 'Update my data', 'RP-Update my data', 'Update my data', 'User clicks on "submit" button in update my address', '');
        }else if(this.updatingtype === "identity"){
          this.auditService.audit('RP-027', 'Update my data', 'RP-Update my data', 'Update my data', 'User clicks on "submit" button in update my data', '');
        }
      } else if (id === "resend") {
        this.reGenerateOtp();
      } else if (id !== 'string' && id.type === 'otp') {
        this.verifyupdatedData(id.otp);
      }
    });
    this.breakPointService.isBreakpointActive().subscribe(active => {
      if (active) {
        if (active === "extraSmall") {
          this.cols = 1;
          this.width = "99%";
        }
        if (active === "ExtraLarge") {
          this.cols = 4;
          this.width = "40%";
        }
        if (active === "medium") {
          this.cols = 2;
          this.width = "75%";
        }
        if (active === "large") {
          this.cols = 4;
          this.width = "50%";
        }
        if (active === "small") {
          this.cols = 2;
          this.width = "95%";
        }
      }
    });
  }

  async ngOnInit() {
    this.defaultJsonValue = { ...defaultJson }
    this.initialLocationCode = this.appConfigService.getConfig()["resident.update-uin.machine-zone-code"];
    this.locCode = 5;
    this.translateService.use(localStorage.getItem("langCode"));
    this.supportedLanguages = ["eng"];
    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.langJson = response.updatedemographic
        this.popupMessages = response;
        this.matTabLabel = response.updatedemographic.contact;
      });

    await this.getMappingData();
    const subs = this.autoLogout.currentMessageAutoLogout.subscribe(
      (message) => (this.message2 = message) //message =  {"timerFired":false}
    );

    this.subscriptions.push(subs);

    if (!this.message2["timerFired"]) {
      this.autoLogout.getValues(this.langCode);
      this.autoLogout.setValues();
      this.autoLogout.keepWatching();
    } else {
      this.autoLogout.getValues(this.langCode);
      this.autoLogout.continueWatching();
    }

    this.getPendingDrafts();
  };

  getPendingDrafts(){
    const popupElement = document.getElementById('draftCancelPopup');
    this.dataStorageService.getPendingDrafts(this.langCode).subscribe((response) => {
      if(!this.schema)
        this.getUpdateMyDataSchema();
      if(response['response']){
        if(!response['response'].drafts.length){
          if( this.dialog){
            if(this.dialog && popupElement){
              this.dialog.closeAll();
            }
            clearTimeout(this.draftInterval);
          }
          this.isDraftEmpty = false;
        }else{
          this.draftInterval = setTimeout(() => {
            this.getPendingDrafts();
          }, 2000);
          this.isDraftEmpty = true;
          this.draftsDetails = response['response'].drafts;
          if(this.dialog && popupElement && (this.draftsDetails[0].cancellable && !this.cancellable)){
            this.dialog.closeAll();
            this.popupForInprogressData(false);
          }else if(this.dialog && popupElement && (!this.draftsDetails[0].cancellable && this.cancellable)){
            this.dialog.closeAll();
            this.popupForInprogressData(true);
            this.isDraftEmpty = false;
          }
          this.cancellable = this.draftsDetails[0].cancellable;
        }
      }else{
        this.showErrorPopup(response['errors']);
      };
    })
  }

  isUpdatedataInProgress(event, fieldType) {
    if(this.isDraftEmpty){
      this.popupForInprogressData(false);
      if(fieldType === 'textField'){
        document.getElementById(event.target.id).blur();
      }else if(fieldType === 'datePickerField'){
        event.close()
      }else if(fieldType === 'dropDownField'){
        event.close()
      }else if(fieldType === 'virtualKeyBoard'){
        document.getElementById(event).blur();
      }
    }else{
      if(fieldType === 'datePickerField'){
        event.open()
      }
    }
  }

  createTransactionIds() {
    let transactionID = window.crypto.getRandomValues(new Uint32Array(1)).toString();
    if (transactionID.length < 10) {
      let diffrence = 10 - transactionID.length;
      for (let i = 0; i < diffrence; i++) {
        transactionID = transactionID + i
      }
    }
    return transactionID
  }


  async getUpdateMyDataSchema() {
    this.isLoading = true;
    await new Promise((resolve) => {
      this.dataStorageService
        .getUpdateMyDataSchema('update-demographics')
        .subscribe((response) => {
          this.schema = response;
          this.getUserInfo();
        });
    })

  }


  getUserInfo() {
    this.dataStorageService
      .getUserInfo('update-demographics')
      .subscribe((response) => {
        if (response["response"]) {
          this.userInfo = response["response"];
          Object.keys(this.userInfo).forEach(item =>{
            if(typeof this.userInfo[item] !== 'string' && this.userInfo[item].length){
              if(this.getUserPerfLang.length){
                this.userInfo[item].forEach(eachItem=>{
                  this.getUserPerfLang.indexOf(eachItem.language) === -1 ? this.getUserPerfLang.push(eachItem.language) : ''
                })
              }
            }
          })
          UpdatedemographicComponent.actualData = response["response"];
          this.buildData()
          this.getSupportingLanguages()
        } else {
          this.showErrorPopup(response['errors'])
        }
      });
  }

  getSupportingLanguages(){
    this.dataStorageService.getPreferredLangs(this.langCode).subscribe((response) =>{
      if(response['response']){
        this.newNotificationLanguages = response['response'].values
      }
    })
  }

  async getMappingData(){
    this.dataStorageService.getMappingData().subscribe((response) =>{
      if(response){
        this.attributeUpdateCountMaxLimit = {...response['attributeUpdateCountLimit']}
        this.getUpdateDataCount();
      }
    })
  }

  async getUpdateDataCount(){
    this.dataStorageService.getUpdateDataCount().subscribe((response) =>{
      this.attributeUpdateCountRemainLimit = {...this.attributeUpdateCountMaxLimit}
      if(response['response']){
        response['response'].attributes.forEach(item =>{
          this.attributeUpdateCountRemainLimit[item.attributeName] = item.noOfUpdatesLeft
        })
      }
    })

  }

  buildData() {
    let count = 0;
    try {
      let self = this;
      for (var schema of self.schema['identity']) {
        if(schema.controlType === "textbox" || schema.controlType === "fileupload"){
          if(schema.controlType === "textbox"){
            if(typeof self.userInfo[schema.attributeName] === "string"){
              this.userInputValues[schema.attributeName] = "";
              this.buildJSONData[schema.attributeName] = {value:self.userInfo[schema.attributeName],index:count }
              count++
            }else{
              this.userInputValues[schema.attributeName] = {};
              if(this.userInfo[schema.attributeName]){
                this.buildJSONData[schema.attributeName] = self.userInfo[schema.attributeName].map(item =>{
                  item.index = count
                  count++
                  this.userInputValues[schema.attributeName][item.language] = '';
                  return item
                })
                 this.buildJSONData[schema.attributeName] = self.userInfo[schema.attributeName].map(item =>{
                  item.mobileIndex = count
                  count++
                  return item
                })
              }
            }
          }else{
            this.buildJSONData[schema.attributeName] = count
            count++
          }
        }else{
          if(typeof self.userInfo[schema.attributeName] === "string"){
            this.userInputValues[schema.attributeName] = "";
            this.buildJSONData[schema.attributeName] = {value:self.userInfo[schema.attributeName]}
          }else{
            this.userInputValues[schema.attributeName] = {};
            this.buildJSONData[schema.attributeName] = self.userInfo[schema.attributeName]
            if(this.userInfo[schema.attributeName]){
              self.userInfo[schema.attributeName].forEach(item =>{
                this.userInputValues[schema.attributeName][item.language] = ''
              })
            }
          }
        }
      }
      this.getGender();
      this.getLocationHierarchyLevel();
      this.getDocumentType("POI", "proofOfIdentity"); this.getDocumentType("POA", "proofOfAddress");
      this.isLoading = false;
    } catch (ex) {
      console.log("Exception>>>" + ex.message);
    }
    this.getUserPerfLang.forEach(item =>{
      this.getUserPerfLangString = this.getUserPerfLangString + item + ","
    })
    this.getUserPerfLangString = this.getUserPerfLangString.replace(/,\s*$/, "");
  }

  changedBuildData(finaluserInfoClone: any) {
    this.buildCloneJsonData = [];
    let self = this;
    for (var schema of self.schema['identity']) {
      Object.keys(finaluserInfoClone).map(attributeName => {
        if (schema.attributeName === attributeName) {
          this.buildCloneJsonData.push({
            'labelName': schema.labelName[this.langCode][1],
            'newData': finaluserInfoClone[attributeName]
          })
        }
      })
    }
  }

  addingAddessData(event: any, formControlName: string, fieldType: string, fieldName: string) {
    let locationCode = event.value
    if (fieldType !== 'string') {
      this.userInfoAddressClone[formControlName] = []
      this.getUserPerfLang.forEach(langCode => {
        let newData
        this.dynamicDropDown[fieldName][langCode].forEach(eachLocation => {
          if (eachLocation.code === locationCode) {
            newData = { "language": langCode, "value": eachLocation.name }
            this.userInputValues[formControlName][langCode] = eachLocation.code;
          }
        })
        this.userInfoAddressClone[formControlName].push(newData)
      })
    } else {
      this.dynamicDropDown[fieldName]['eng'].forEach(eachLocation => {
        if (eachLocation.code === locationCode) {
          this.userInfoAddressClone[formControlName] = eachLocation.name;
          this.userInfoAddressClone[formControlName] = eachLocation.code;
        }
      })
    }

  }

  previewBtn(issue: any) {
    if (issue === "address") {
      this.changedBuildData(this.userInfoAddressClone);
      this.finalUserCloneData = this.userInfoAddressClone;
      this.uploadedFiles = this.filesPOA;
    } else if (issue === "identity") {
      this.changedBuildData(this.userInfoClone);
      this.finalUserCloneData = this.userInfoClone;
      this.uploadedFiles = this.files;
    }
    this.showPreviewPage = true;
    this.updatingtype = issue;
    if(this.keyboardService.isOpened)
      this.keyboardService.dismiss();
  }


  getDocumentType(type: string, id: string) {
    this.dataStorageService.getDataForDropDown("/proxy/masterdata/documenttypes/" + type + "/" + localStorage.getItem("langCode")).subscribe(response => {
      if(response["response"]){
        this.dropDownValues[id] = response["response"]["documents"];
      }
    });
  }

  getGender() {
    this.dropDownValues["gender"] = {};
    this.getUserPerfLang.forEach((lang) => {
      this.dataStorageService
      .getDataForDropDown(`/auth-proxy/masterdata/dynamicfields/gender/${lang}?withValue=true`)
      .subscribe((response) => {
        if (response && response["response"]) {
          const res = response["response"];
          let data = res["values"] || res["fieldVal"];
          if (!data) {
            console.warn(`No values found for gender in ${lang}. Ensure DB is_active=true.`);
            return;
          }
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch (e) {
              console.error("JSON parse error", e);
            }
          }
          const finalArray = Array.isArray(data) ? data : [data];
          if (!this.dropDownValues["gender"][lang]) {
            this.dropDownValues["gender"][lang] = [];
          }
          this.dropDownValues["gender"][lang] = [...this.dropDownValues["gender"][lang], ...finalArray];
          console.log(`Gender Dropdown [${lang}] successfully loaded with:`, this.dropDownValues["gender"][lang]);
        }
      });
  });
}

  getLocationHierarchyLevel() {
    let self = this;
    self.locationFieldNameList = [];
    self.dataStorageService.getLocationHierarchyLevel('eng').subscribe(response => {
      response["response"]["locationHierarchyLevels"].forEach(function (value) {
        if (value.hierarchyLevel != 0)
          if (value.hierarchyLevel <= self.locCode)
            self.locationFieldNameList.push(value.hierarchyLevelName);
      });
      for (let value of self.locationFieldNameList) {
        self.dynamicDropDown[value] = [];
      }
      self.loadLocationDataDynamically("", 0, "", "");
    });
  }

  loadLocationDataDynamically(event: any, index: any, schemaFieldName: string, fieldType: string) {
    let unSelectedItems = this.locationFieldNameList.slice(index, this.locationFieldNameList.length)
    let locationCode = "";
    let fieldName = "";
    let self = this;
    if (event === "") {
      fieldName = this.locationFieldNameList[parseInt(index)];
      locationCode = this.initialLocationCode;
    } else {
      fieldName = this.locationFieldNameList[parseInt(index)];
      locationCode = event.value;
      this.isSelectedAllAddress = unSelectedItems.length ? false : true;
    }

    this.fieldName = fieldName
    if (fieldName) {
      this.dataStorageService.getImmediateChildren(locationCode, this.getUserPerfLangString)
        .subscribe(response => {
          if (response['response'])
            self.dynamicDropDown[fieldName] = response['response']['locations'];
        });
    }

    if (event !== '') {
      this.addingAddessData(event, schemaFieldName, fieldType, this.locationFieldNameList[parseInt(index) - 1]);
    }

    unSelectedItems.forEach(item => {
      this.dynamicDropDown[item] = [];
      let filedNameForuserInput = (item.charAt(0).toLocaleLowerCase() + item.slice(1)).replace(" ", "")
      if (typeof this.userInputValues[filedNameForuserInput] !== 'string') {
        this.getUserPerfLang.forEach(lang => {
          if(this.userInputValues[filedNameForuserInput])
            this.userInputValues[filedNameForuserInput][lang] = ''
        })
      } else {
        this.userInputValues[filedNameForuserInput] = ''
      }
    });
  }

  sendOTPBtn(id: any) {
    if (id === "email") {
      this.userIdPhone = "";
      this.confirmPhoneContact = "";
      this.auditService.audit('RP-029', 'Update my data', 'RP-Update my data', 'Update my data', 'User clicks on "Send OTP" button in update email Id', '');
    } else if (id === "phone") {
      this.userIdEmail = "";
      this.confirmEmailContact = "";
      this.auditService.audit('RP-030', 'Update my data', 'RP-Update my data', 'Update my data', 'User clicks on "Send OTP" button in update phone number', '');
    }

    this.generateOtp()
  }

  generateOtp() {
    this.transactionID = this.createTransactionIds()
    const request = {
      "id": "mosip.resident.contact.details.send.otp.id",
      "version": this.appConfigService.getConfig()['mosip.resident.request.response.version'],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "userId": this.userId,
        "transactionId": this.transactionID
      }
    }
    this.dataStorageService.generateOtpForDemographicData(request).subscribe(response => {
      if (response["response"]) {
        this.showOTPPopup()
      } else {
        this.showErrorPopup(response["errors"])
      }
    }, error => {
      console.log(error)
    })
  }

  reGenerateOtp() {
    this.transactionID = this.createTransactionIds();

    const request = {
      "id": "mosip.resident.contact.details.send.otp.id",
      "version": this.appConfigService.getConfig()['mosip.resident.request.response.version'],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "userId": this.userId,
        "transactionId": this.transactionID
      }
    }
    this.dataStorageService.generateOtpForDemographicData(request).subscribe(response => {
      if (response["response"]) {

      } else {
        this.showErrorPopup(response["errors"])
      }
    }, error => {
      console.log(error)
    })
  }

  verifyupdatedData(otp: any) {
    this.dialog.closeAll();
    this.isLoading = true;
    const request = {
      "id": this.appConfigService.getConfig()["resident.contact.details.update.id"],
      "version": this.appConfigService.getConfig()['mosip.resident.request.response.version'],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "userId": this.userId,
        "transactionId": this.transactionID,
        "otp": otp
      }
    }
    this.dataStorageService.verifyUpdateData(request).subscribe(response => {
      this.sendOtpDisable = true;
      if (response.body['response']) {
        let eventId = response.headers.get("eventid")
        this.message = this.contactTye === 'email' ? this.popupMessages.genericmessage.updateMyData.emailSuccessMsg.replace("$eventId", eventId) : this.popupMessages.genericmessage.updateMyData.phoneNumberSuccessMsg.replace("$eventId", eventId);
        this.isLoading = false;
        this.showMessage(this.message, eventId);
        this.contactTye = "";
        this.router.navigate(['uinservices/dashboard']);
      } else {
        this.isLoading = false;
        this.showErrorPopup(response.body["errors"]);
        this.contactTye = "";
      }
    }, error => {
      console.log(error);
    })
  }

  async translateUserInput(toLang: string, fromLang: string, input: string, formControlName: string, userInfoType: string) {
    let request = {
      "id": this.appConfigService.getConfig()["mosip.resident.transliteration.transliterate.id"],
      "version": this.appConfigService.getConfig()['mosip.resident.request.response.version'],
      "requesttime": "2023-09-20T10:43:08.864Z",
      "request": {
        "from_field_value": input,
        "from_field_lang": fromLang,
        "to_field_lang": toLang
      }
    }
    this.dataStorageService.translateUserInput(request).subscribe(response => {
      if (response['response']) {
        let value = response['response'].to_field_value
        this[userInfoType][formControlName].push({ "language": toLang, "value": value })
        this.userInputValues[formControlName][toLang] = value;
      } else {
        this[userInfoType][formControlName].push({ "language": toLang, "value": input })
        this.userInputValues[formControlName][toLang] = input;
      }
    })
  }

  captureValue(event: any, formControlName: string, language: string, currentValue: any) {
    if(!this.firstInputLang[formControlName] && event.target.value)
      this.firstInputLang[formControlName] = language;

    let userNewData = event.target.value.trim();
    let self = this;
    if (userNewData === "") {
      this.enteredOnlyNumbers = false;
      if (this.userInfoClone[formControlName]) {
        delete this.userInfoClone[formControlName]
      }
      this.getUserPerfLang.forEach(item => {
        if(this.userInputValues[formControlName])
          this.userInputValues[formControlName][item] = ''
      })
    } else {
      if (formControlName !== "proofOfIdentity") {
        if (userNewData.toLowerCase() !== currentValue.toLowerCase() && /^[A-Za-z]+(\s[A-Za-z]+)*$/.test(userNewData) && userNewData !== this.userInputValues[formControlName][language]) {
          this.isSameData[formControlName] = false;
          this.enteredOnlyNumbers = false;
          if(!this.userInfoClone[formControlName])
            this.userInfoClone[formControlName] = [];
          this.getUserPerfLang.forEach(item => {
            let newData
            if (item === language) {
              if(this.firstInputLang[formControlName] === language){
                newData = { "language": language, "value": userNewData }
                this.userInfoClone[formControlName].push(newData)
              }else{
                this.userInfoClone[formControlName].forEach(item =>{
                  if(item.language === language)
                    item.value = userNewData
                })
              }
              this.userInputValues[formControlName][language] = userNewData;
            } else {
              if(this.firstInputLang[formControlName] === language)
                this.translateUserInput(item, language, userNewData, formControlName, 'userInfoClone')
            }
          })
        } else {
          if(userNewData.toLowerCase() === currentValue.toLowerCase()){
            this.isSameData[formControlName] = true;
          }else if(!/^[A-Za-z]+(\s[A-Za-z]+)*$/.test(userNewData)){
            this.enteredOnlyNumbers = true;
          }

        }
      } else {
        self[formControlName]["documentreferenceId"] = userNewData;
        this.userInputValues[formControlName] = userNewData;
      }
    }

  }

  captureDatePickerValue(event: any, formControlName: string, currentValue: any) {
    let self = this;
    let dateFormat = new Date(event.target.value);
    let formattedDate = dateFormat.getFullYear() + "/" + ("0" + (dateFormat.getMonth() + 1)).slice(-2) + "/" + ("0" + dateFormat.getDate()).slice(-2);
    this.selectedDate = dateFormat;
    if (formattedDate !== currentValue) {
      self.userInfoClone[formControlName] = formattedDate;
      this.isSameData[formControlName] = false;
    } else {
      this.isSameData[formControlName] = true;
      delete this.userInfoClone["dateOfBirth"]
    }
    this.userInputValues[formControlName] = formattedDate;
  }

  captureDropDownValue(event: any, formControlName: string, language: string, currentValue: any) {
    let genders = this.dropDownValues.gender
    let currentValueCode
    genders[language].forEach(item => {
      currentValueCode = item.value === currentValue ? item.code : currentValue
    });

    let self = this;
    if (formControlName !== "proofOfIdentity") {
      if (event.value !== currentValueCode) {
        this.isSameData[formControlName] = false;
        this.userInfoClone[formControlName] = []
        this.getUserPerfLang.forEach(item => {
          let newData
          genders[item].forEach(eachGender => {
            if (eachGender.code.toLowerCase() === event.value.toLowerCase()) {
              newData = { "language": item, "value": eachGender.value }
              this.userInputValues[formControlName][item] = eachGender.code;
            }
          })
          this.userInfoClone[formControlName].push(newData)
        })
      } else {
        this.isSameData[formControlName] = true;
      }
    } else {
      if (formControlName === "proofOfIdentity") {
        this.displayPOIUpload = true;
      } else if (formControlName === "proofOfAddress") {
        this.displayPOAUpload = true;
      }
      self[formControlName]["documenttype"] = event.source.value;
    }
  }

  captureAddressValue(event: any, formControlName: string, language: string, currentValue: string) {
    if(!this.firstInputLang[formControlName] && event.target.value)
      this.firstInputLang[formControlName] = language;

    let self = this;
    let userNewData = event.target.value.trim();
    if (userNewData === "") {
      if (this.userInfoAddressClone[formControlName]) {
        delete this.userInfoAddressClone[formControlName]
      }
      this.getUserPerfLang.forEach(item => {
        this.userInputValues[formControlName][item] = ''
      })
    } else {
      if (formControlName !== "proofOfAddress") {
        if (userNewData.toLowerCase() !== currentValue.toLowerCase()) {
          this.isSameData[formControlName] = false;
          if(!this.userInfoAddressClone[formControlName])
            this.userInfoAddressClone[formControlName] = [];
          this.getUserPerfLang.forEach(item => {
            let newData
            if (item === language) {
              if(this.firstInputLang[formControlName] === language){
                newData = { "language": language, "value": userNewData }
                this.userInfoAddressClone[formControlName].push(newData)
              }else{
                this.userInfoAddressClone[formControlName].forEach(item =>{
                  if(item.language === language)
                    item.value = userNewData
                })
              }
              this.userInputValues[formControlName][language] = userNewData;
            } else {
              if(this.firstInputLang[formControlName] === language)
                this.translateUserInput(item, language, userNewData, formControlName, 'userInfoAddressClone')
            }
          })
        } else {
          if (this.userInfoAddressClone[formControlName]) {
            delete this.userInfoAddressClone[formControlName]
          }
          this.getUserPerfLang.forEach(item => {
            this.userInputValues[formControlName][item] = ''
          })
          this.isSameData[formControlName] = true;
        }
      } else {
        self[formControlName]["documentreferenceId"] = userNewData;
        this.userInputValues[formControlName] = userNewData;
      }
    }
  }


  captureAddressDropDownValue(event: any, formControlName: string) {
    let self = this;
    if (event.source.selected) {
      if (formControlName === "proofOfIdentity") {
        this.displayPOIUpload = true;
      } else if (formControlName === "proofOfAddress") {
        this.displayPOAUpload = true;
      }
      self[formControlName]["documenttype"] = event.source.value;
    }
    this.userInputValues[formControlName] = event.source.viewValue;
  }

  // captureContactValue(event: any, formControlName: any) {
  //   this.userId = event.target.value.trim();
  //   this.contactTye = formControlName.attributeName;

  //   if(new RegExp(formControlName.validators[0].validator).test(this.userId)){
  //     this.sendOtpDisable = false;
  //   }else{
  //     this.sendOtpDisable = true;
  //   }

  //   if(formControlName.attributeName === "email"){
  //     this.userIdEmail = this.userId
  //   }else{
  //     this.userIdPhone = this.userId
  //   }
  // }

  captureContactValue(event: any, formControlName: any) {
  const value = event.target.value.trim();

  this.userId = value;
  this.contactTye = formControlName.attributeName;

  let isValid = false;
   const regexMap: any = {
    email: /^(?=.{1,67}$)[A-Za-z0-9_\-]+(\.[A-Za-z0-9_]+)*@[A-Za-z0-9_-]+(\.[A-Za-z0-9_]+)*(\.[a-zA-Z]{2,})$/,
    phone: /^\d{9,11}$/
  };
  const regex = regexMap[formControlName.attributeName];

   if (regex) {
    isValid = regex.test(value);
    console.log("Validation Result:", isValid);
  } else {
    console.warn("No regex found for:", formControlName.attributeName);
  }
    this.sendOtpDisable = !isValid;

  if (formControlName.attributeName === "email") {
    this.userIdEmail = value;
  } else if (formControlName.attributeName === "phone") {
    this.userIdPhone = value;
  }
}


  capturePerfLang(event: any, formControlName: string) {
    this.userPrefLang[formControlName] = event.value;
    this.disablePrefLangBtn = true;
  }

  captureVirtualKeyboard(element: HTMLElement, index: number) {
    if (this.keyboardRef) {
      this.keyboardRef.instance.setInputInstance(this.attachToElementMesOne._results[index]);
    }
  }

  openKeyboard(inputId: any, langCode: string) {
    let finalLangCode = langCode ? langCode : "eng"
    if (this.oldKeyBoradIndex === inputId && this.keyboardService.isOpened) {
      this.keyboardService.dismiss();
      this.keyboardRef = undefined;
    } else {
      this.oldKeyBoradIndex = inputId;
      this.keyboardRef = this.keyboardService.open(defaultJson.keyboardMapping[finalLangCode]);
      document.getElementById(inputId).focus();
      this.isUpdatedataInProgress(inputId, 'virtualKeyBoard')
    }
  }

  updateBtn() {
    this.conditionsForupdateDemographicData();
  }

  uploadFiles(files, transactionID, docCatCode, docTypCode, referenceId) {
    this.dataStorageService.uploadfile(files, transactionID, docCatCode, docTypCode, referenceId).subscribe(response => {
      if (response['response']) {
        this.getAllDocIds[response['response'].docName] = response['response'].docId
      }
    });
  }

  deleteUploadedFile(docId, transactionID) {
    this.dataStorageService.deleteUploadedFile(docId, transactionID).subscribe(response => {
      console.log(response)
    })
  }

  finalUpdateDemographicData(transactionID: any) {
    const request = {
      "id": this.appConfigService.getConfig()["resident.updateuin.id"],
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "transactionID": transactionID,
        "consent": "Accepted",
        "identity": this.finalUserCloneData
      }
    };
    this.dataStorageService.updateuin(request).subscribe(response => {
      let eventId = response.headers.get("eventid");
      this.message = this.popupMessages.genericmessage.updateMyData.newDataUpdatedSuccessMsg.replace("$eventId", eventId).replace("$dataType", this.langJson[this.updatingtype].toLowerCase())
      if (response.body["response"]) {
        this.isLoading = false;
        this.showMessage(this.message, eventId);
        this.router.navigate(['uinservices/dashboard']);
      } else {
        this.isLoading = false;
        this.showErrorPopup(response.body["errors"])
      }
    }, error => {
      console.log(error)
    })
  }

  updateDemographicData() {
    this.isLoading = true;
    if (this.updatingtype === 'identity') {
      this.finalUpdateDemographicData(this.transactionIDForPOI)
    } else {
      this.finalUpdateDemographicData(this.transactionIDForPOA)
    }
  }

  updatenotificationLanguage() {
    this.auditService.audit('RP-031', 'Update my data', 'RP-Update my data', 'Update my data', 'User clicks on "submit" button in update notification language', '');
    this.disablePrefLangBtn = false;
    const request = {
      "id": this.appConfigService.getConfig()["resident.updateuin.id"],
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "transactionID": null,
        "consent": "Accepted",
        "identity": this.userPrefLang
      }
    };
    this.dataStorageService.updateuin(request).subscribe(response => {
      let eventId = response.headers.get("eventid");
      this.message = this.popupMessages.genericmessage.updateMyData.updateNotificationData.replace("$eventId", eventId)
      if (response.body["response"]) {
        this.showMessage(this.message, eventId);
        this.router.navigate(['uinservices/dashboard']);
      } else {
        this.showErrorPopup(response.body["errors"]);
        this.disablePrefLangBtn = true;
      }
    }, error => {
      console.log(error)
    })
  }

  conditionsForupdateDemographicData() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '650px',
      data: {
        id: "updateMyData",
        case: 'termsAndConditionsForUpdateMyData',
        title: this.popupMessages.genericmessage.termsAndConditionsLabel,
        conditions: this.popupMessages.genericmessage.conditionsForupdateDemographicData,
        agreeLabel: this.popupMessages.genericmessage.agreeLabelForUpdateData,
        btnTxt: this.popupMessages.genericmessage.submitButton
      }
    });
    return dialogRef;
  }
  /**
   * on file drop handler
   */
  onFileDropped($event, type) {
    if(this.getAllDocIds[$event[0].name]){
      type === 'POI' ? this.isValidFileFormatPOI = true : this.isValidFileFormatPOA = true;;
      this.warningMessage = this.langJson.sameFileUploading
    }else{
      this.isValidFileFormatPOI = false;
      this.prepareFilesList($event, type);
    }
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files, type) {
    if(this.getAllDocIds[files[0].name]){
      type === 'POI' ? this.isValidFileFormatPOI = true : this.isValidFileFormatPOA = true;;
      this.warningMessage = this.langJson.sameFileUploading
    }else{
      this.isValidFileFormatPOI = false;
      this.prepareFilesList(files, type);
    }

  }

  /**
   * Preview file from files list
   * @param index (File index)
   */
  previewFile(index: number, type: string,fileName:string) {
    if (type === "POI") {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pdfSrc = e.target.result;
        this.showPreviewImage(this.pdfSrc, fileName)
      };
      reader.readAsDataURL(this.files[index]);
    } else {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pdfSrcPOA = e.target.result;
        this.showPreviewImage(this.pdfSrcPOA,fileName)
      };
      reader.readAsDataURL(this.filesPOA[index]);
    }
  }

  previewFileInPreviewPage(index: number,fileName:string) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.pdfSrcInPreviewPage = e.target.result;
      this.showPreviewImage(this.pdfSrcInPreviewPage,fileName)
    };
    reader.readAsDataURL(this.uploadedFiles[index]);
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteFile(index: number, type: string) {
    if (type === "POI") {
      let documentName = this.files[index].name;
      let documentID = this.getAllDocIds[documentName]
      this.files.splice(index, 1);
      this.uploadedFiles = this.files
      this.deleteUploadedFile(documentID, this.transactionIDForPOI)
      delete this.getAllDocIds[documentName]
    } else {
      let documentName = this.filesPOA[index].name;
      let documentID = this.getAllDocIds[documentName]
      this.filesPOA.splice(index, 1);
      this.uploadedFiles = this.filesPOA
      this.deleteUploadedFile(documentID, this.transactionIDForPOA)
      delete this.getAllDocIds[documentName]
    }
    if (this.files.length < 1) {
      this.previewDisabled = true;
    }
    if (this.filesPOA.length < 1) {
      this.previewDisabledInAddress = true;
    }
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number, type: string) {
    setTimeout(() => {
      if (type === "POI") {
        if (index === this.files.length) {
          return;
        } else {
          if (this.files.length) {
            const progressInterval = setInterval(() => {
              if(this.files[index]){
                if (this.files[index].progress === 100) {
                  clearInterval(progressInterval);
                  this.uploadFilesSimulator(index + 1, type);
                } else {
                  this.files[index].progress += 20;
                }
              }
            }, 200);
          }
        }
      } else {
        if (index === this.filesPOA.length) {
          return;
        } else {
          const progressInterval = setInterval(() => {
            if (this.filesPOA[index].progress === 100) {
              clearInterval(progressInterval);
              this.uploadFilesSimulator(index + 1, type);
            } else {
              this.filesPOA[index].progress += 20;
            }
          }, 200);
        }
      }
    }, 1000);
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: Array<any>, type: string) {
    var allowedFiles = ["image/jpg", "image/jpeg", "image/png", "application/pdf"];
    var regex = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + allowedFiles.join('|') + ")$");
    let fileSize = (files[0].size) / 1048576;
    if (!allowedFiles.includes(files[0].type)) {
      if (type === "POI") {
        this.isValidFileFormatPOI = true
      } else {
        this.isValidFileFormatPOA = true
      }
      this.warningMessage = this.popupMessages.updatedemographic.InvalidFormatMsg
    } else {
      if (fileSize < 2.0) {
        if (type === "POI") {
          this.transactionIDForPOI = this.transactionIDForPOI || this.createTransactionIds();
          this.isValidFileFormatPOI = false;
          for (const item of files) {
            item.progress = 0;
            this.files.push(item);
            const formData = new FormData()
            formData.append('file', item);
            this.uploadFiles(formData, this.transactionIDForPOI, 'POI', this.proofOfIdentity['documenttype'], this.proofOfIdentity['documentreferenceId']);
          }
          this.uploadFilesSimulator(0, type);
          this.previewDisabled = false
        } else {
          this.transactionIDForPOA = this.transactionIDForPOA || this.createTransactionIds()
          this.isValidFileFormatPOA = false;
          for (const item of files) {
            item.progress = 0;
            this.filesPOA.push(item);
            const formData = new FormData()
            formData.append('file', item);
            this.uploadFiles(formData, this.transactionIDForPOA, 'POA', this.proofOfAddress['documenttype'], this.proofOfAddress['documentreferenceId']);
          }
          this.uploadFilesSimulator(0, type);
          this.previewDisabledInAddress = false
        }
      } else {
        if (type === "POI") {
          this.isValidFileFormatPOI = true
        } else {
          this.isValidFileFormatPOA = true
        }
        this.warningMessage = this.popupMessages.updatedemographic.InvalidFileSize
      }
    }
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */

  formatBytes(bytes, decimals) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  showOTPPopup() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        case: 'OTP',
        message: this.popupMessages.genericmessage.otpPopupDescription,
        newContact: this.userId,
        submitBtnTxt: this.popupMessages.genericmessage.submitButton,
        resentBtnTxt: this.popupMessages.genericmessage.resentBtn
      }
    });
    return dialogRef;
  }

  showMessage(message: string, eventId: any) {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.successLabel,
        trackStatusText: this.popupMessages.genericmessage.trackStatusText,
        clickHere: this.popupMessages.genericmessage.clickHere,
        message: message,
        eventId: eventId,
        clickHere2: this.popupMessages.genericmessage.clickHere2,
        dearResident: this.popupMessages.genericmessage.dearResident,
        btnTxt: this.popupMessages.genericmessage.successButton,
        isOk: 'OK'
      }
    });
    return dialogRef;
  }

  showErrorPopup(message: string) {
    this.errorCode = message[0]["errorCode"];
    setTimeout(() => {
      if (this.errorCode === "RES-SER-410") {
        let messageType = message[0]["message"].split("-")[1].trim();
        this.message = this.popupMessages.serverErrors[this.errorCode][messageType]
      } else {
        this.message = this.popupMessages.serverErrors[this.errorCode]
      }
      this.dialog
        .open(DialogComponent, {
          width: '650px',
          data: {
            case: 'MESSAGE',
            title: this.popupMessages.genericmessage.errorLabel,
            message: this.message,
            btnTxt: this.popupMessages.genericmessage.successButton,
            isOk: 'OK'
          },
          disableClose: true
        });
    }, 400)
  }

  showPreviewImage(pdfSrc: any,fileName:string) {
    this.dialog
      .open(DialogComponent, {
        width: '70%',
        data: {
          case: 'previewImage',
          imageLink: pdfSrc,
          fileName
        },
        disableClose: true
      });
  }

  popupForInprogressData(dataUpdated) {
    setTimeout(() => {
      let statusMsg = {};
      if(!dataUpdated){
        if(this.draftsDetails[0].cancellable){
          statusMsg = {
            descriptionDetails: this.langJson.pendingDrafts.descriptionDetails,
            warnMsg: this.langJson.pendingDrafts.warnMsg
          }
        }else{
          statusMsg = {
            descriptionDetails: this.langJson.pendingDrafts.descriptionDetailsTwo,
            warnMsg: this.langJson.pendingDrafts.warnMsgTwo
          }
        }
      }else{
        statusMsg = {
          warnMsg: this.langJson.pendingDrafts.warnMsgThree,
          successdesc: this.langJson.pendingDrafts.successdesc
        }
      }
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '750px',
        data: {
          case: 'updateMyDataInprogress',
          message: this.langJson.pendingDrafts,
          statusMsg,
          draftsDetails: this.draftsDetails,
          confirmBtn: this.popupMessages.genericmessage.confirm,
          cancelBtn: this.popupMessages.genericmessage.cancel
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          clearTimeout(this.draftInterval);
          this.isDraftEmpty = false;
          this.dataStorageService.discardPendingDrafts(res)
            .subscribe((response) => {
              if (response['response']) {
                this.message = this.langJson.draftCanceled
                this.showMessage(this.message, this.draftsDetails[0].eid);
                this.cancellable = false;
                this.draftsDetails = [];
              } else {
                this.showErrorPopup(response['errors'])
              }
            })
        }
      })
      return dialogRef;
    }, 400)
  }

  onItemSelected(item: any) {
    if (item === "matTabLabel") {
      this.showPreviewPage = false;
    } else {
      this.router.navigate([item]);
    }
  }

  typeOf(value: any) {
    return typeof value
  }

  backBtn() {
    this.showPreviewPage = false;
    this.pdfSrcInPreviewPage = '';
  }

  logChange(event: any) {
    this.matTabIndex = event.index;
    this.matTabLabel = event.tab.textLabel;
    if(this.keyboardService.isOpened)
      this.keyboardService.dismiss();
  }

  get fontSize(): any {
    document.documentElement.style.setProperty('--fs', this.fontSizeService.fontSize.tabs)
    return this.fontSizeService.fontSize;
  }

  // @HostListener("blur", ["$event"])
  // @HostListener("focusout", ["$event"])
  // private _hideKeyboard() {
  //   if (this.keyboardService.isOpened) {
  //     this.keyboardService.dismiss();
  //   }
  // }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.clickEventSubscription.unsubscribe();
  }
}

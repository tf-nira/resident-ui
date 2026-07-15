import { Component, OnInit, OnDestroy, ViewChildren, ElementRef, HostListener } from "@angular/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { saveAs } from 'file-saver';
import { InteractionService } from "src/app/core/services/interaction.service";
import { AuditService } from "src/app/core/services/audit.service";
import moment from 'moment';
import { BreakpointService } from "src/app/core/services/breakpoint.service";
import { AutoLogoutService } from "src/app/core/services/auto-logout.service";
import {
  MatKeyboardRef,
  MatKeyboardComponent,
  MatKeyboardService
} from 'ngx7-material-keyboard-ios';
import defaultJson from "src/assets/i18n/default.json";
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-sharewithpartner",
  templateUrl: "sharewithpartner.component.html",
  styleUrls: ["sharewithpartner.component.css"],
})
export class SharewithpartnerComponent implements OnInit, OnDestroy {
  langJSON: any;
  popupMessages: any;
  subscriptions: Subscription[] = [];
  schema: any;
  langCode: string = "";
  partnerDetails: any;
  partnerId: string = "";
  purpose: string = "";
  prn: string = "";
  prnValid: boolean = false;
  prnValidationMessage: string = "";
  prnCheckingLoading: boolean = false;
  sharableAttributes: any = {};
  showAcknowledgement: boolean = false;
  aidStatus: any;
  clickEventSubscription: Subscription;
  userInfo: any;
  message: any;
  formatData: any;
  eventId: any;
  shareBthDisabled: boolean = true;
  valuesSelected: any = [];
  previewWidth:string;
  cols: number;
  dataCols:number;
  previewCols:number;
  dataRow:number;
  previewRow:number;
  message2: any;
  totalCommentCount: number;
  remainingChars: number;
  purposeValidation:string;
  fullAddress: string = "";
  formatLabels: any;
  isLoading: boolean = true;
  selectedOprionsFormOptions: object = {};
  sitealignment:string = localStorage.getItem('direction');
  selectedFormats:string = "";

  private keyboardRef: MatKeyboardRef<MatKeyboardComponent>;
  @ViewChildren('keyboardRef', { read: ElementRef })
  private attachToElementMesOne: any;
  constructor(private autoLogout: AutoLogoutService, private interactionService: InteractionService, private dialog: MatDialog, private appConfigService: AppConfigService, private dataStorageService: DataStorageService, 
    private translateService: TranslateService, private router: Router, private auditService: AuditService, private breakPointService: BreakpointService,
    private keyboardService: MatKeyboardService,
    private fontSizeService: FontSizeService
    ) {
    this.clickEventSubscription = this.interactionService.getClickEvent().subscribe((id) => {
      if (id === "shareWithPartner") {
        this.shareInfo()
      }
    });

    this.breakPointService.isBreakpointActive().subscribe(active =>{
      if (active) {
        if(active === "ExtraLarge"){
          this.cols = 5;
          this.dataCols = 2;
          this.previewCols = 3;
          this.dataRow = 4;
          this.previewRow = 4;
          this.previewWidth = "28em"
        }
        if(active === "large" || active === "medium"){
          this.cols = 5;
          this.dataCols = 3;
          this.previewCols = 2;
          this.dataRow = 4;
          this.previewRow = 4;
        }
        if(active === "small" || active === "extraSmall"){
          this.cols = 1;
          this.dataCols = 1;
          this.previewCols = 1;
          this.dataRow = 3;
          this.previewRow = 4;
        }
        if(active === "large" || active === "small"){
          this.previewWidth = "28em"
        }
        if(active === "medium"){
          this.previewWidth = "23em"
        }
        if(active === "extraSmall"){
          this.previewWidth = "88vw"
        }
      }
    });
  }

  async ngOnInit() {
    this.showAcknowledgement = false;
    this.langCode = localStorage.getItem("langCode");

    this.translateService.use(localStorage.getItem("langCode"));

    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.langJSON = response;
        this.popupMessages = response;
      });

    this.getPartnerDetails();
    this.getUserInfo()
    this.getMappingData()
    // this.getshareMyDataSchema()

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

    setTimeout(() => {
      this.totalCommentCount = this.appConfigService.getConfig()["resident.grievance-redressal.comments.chars.limit"];
      this.purposeValidation = this.appConfigService.getConfig()["resident.purpose.allowed.special.char.regex"];
      this.remainingChars = this.totalCommentCount;
    }, 400)
  }

  getshareMyDataSchema(){
    this.dataStorageService
    .getUpdateMyDataSchema('share-credential')
    .subscribe((response) => {
      this.schema = response["identity"];
      const hasPhone = this.userInfo && this.userInfo.phone;
      if (hasPhone) {
        this.schema = this.schema.filter(
          item => item.attributeName !== 'nonLocalPhone'
        );
      } else {
        this.schema = this.schema.filter(
          item => item.attributeName !== 'phone'
        );
      }
      this.valuesSelected = [];
      this.schema.forEach(data => {
        this.valuesSelected.push(data.attributeName)
      })
    });

  }
  getMappingData() {
    this.dataStorageService
      .getMappingData()
      .subscribe((response) => {
        this.formatData = { "Address Format": response["identity"]["fullAddress"]["value"].split(","), "Name Format": response["identity"]["name"]["value"].split(","), "Date Format": response["identity"]["dob"]["value"].split(",") }
      })
  }

  getUserInfo() {
    this.dataStorageService
      .getUserInfo('share-credential')
      .subscribe((response) => {
        if (response['response']) {
          this.userInfo = response["response"];
          this.isLoading = false;
          this.getshareMyDataSchema();
        } else {
          this.showErrorPopup(response['errors'])
        }

      });
  }

  getpurpose(event: any) {
    this.purpose = event.target.value;
    let enterdChars = this.purpose.length
    this.remainingChars = this.totalCommentCount - enterdChars
  }


 resetPrnValidity() {
    this.prnValid = false;
    this.prnValidationMessage = "";
    this.prnCheckingLoading = false;
  }

  checkPrn() {
    const prnValue = (this.prn || "").trim();
    if (!prnValue) {
      this.prnValid = false;
      this.prnValidationMessage = this.popupMessages.genericmessage.sharewithpartner.prnRequired || "PRN is required to proceed.";
      return;
    }
    const isValidFormat = /^\d{13}$/.test(prnValue);
    if (!isValidFormat) {
      this.prnValid = false;
      this.prnValidationMessage = this.popupMessages.genericmessage.sharewithpartner.invalidPrn || "PRN must be 13 digits.";
      return;
    }
    this.prnCheckingLoading = true;
    const request = {
      "prn": prnValue
    };
    this.dataStorageService.checkPrnValidity(request).subscribe(
      (response: any) => {
        if (response.response && response.errors === null && response.response.presentInLogs === false) {
          this.validatePrnStatus(prnValue);
        } else if (response.errors && response.errors.length > 0) {
          this.prnCheckingLoading = false;
          this.prnValid = false;
          this.prnValidationMessage = response.errors[0].message || "PRN is invalid.";
        } else {
          this.prnCheckingLoading = false;
          this.prnValid = false;
          this.prnValidationMessage = "PRN validation failed.";
        }
      },
      err => {
        this.prnCheckingLoading = false;
        this.prnValid = false;
        this.prnValidationMessage = "Error checking PRN. Please try again.";
        console.error(err);
      }
    );
  }

  private validatePrnStatus(prnValue: string) {
    this.prnCheckingLoading = true;
    const statusRequest = { prn: prnValue };

    this.dataStorageService.checkPrnStatus(statusRequest).subscribe(
      (statusResponse: any) => {
        this.prnCheckingLoading = false;

        if (statusResponse.response && statusResponse.errors === null) {
          const status = statusResponse.response;
          const validTaxHead = status.taxHeadCode === 'CIP001';
          const validStatus = status.statusCode === 'A';

          if (validTaxHead && validStatus) {
            this.prnValid = true;
            this.prnValidationMessage = this.popupMessages.genericmessage.sharewithpartner.validPrn || 'PRN is valid.';
          } else {
            this.prnValid = false;
            this.prnValidationMessage = this.popupMessages.genericmessage.sharewithpartner.prnFinalValidationFailed || 'PRN did not pass the final validation.';
          }
        } else if (statusResponse.errors && statusResponse.errors.length > 0) {
          this.prnValid = false;
          this.prnCheckingLoading = false;
          this.prnValidationMessage = statusResponse.errors[0].message || 'No data found for supplied PRN';
        } else {
          this.prnValid = false;
          this.prnCheckingLoading = false;
          this.prnValidationMessage = 'PRN status validation failed.';
        }
      },
      err => {
        this.prnCheckingLoading = false;
        this.prnValid = false;
        this.prnValidationMessage = 'Error checking PRN status. Please try again.';
        console.error(err);
      }
    );
  }

  captureVirtualKeyboard(element: HTMLElement, index: number) {
    this.keyboardRef.instance.setInputInstance(this.attachToElementMesOne._results[index]);
  }

  openKeyboard() {
    if (this.keyboardService.isOpened) {
      this.keyboardService.dismiss();
      this.keyboardRef = undefined;
    } else {
      this.keyboardRef = this.keyboardService.open(defaultJson.keyboardMapping[this.langCode]);
      document.getElementById("sharingReasonPlaceholder").focus();
    }
  }

  getPartnerDetails() {
    this.dataStorageService
      .getPartnerDetails("Auth_Partner")
      .subscribe((response) => {
        this.partnerDetails = response["response"]["partners"];
      });
  }

  // Method to create default format preview data
  createDefaultValue(data: any) {
    let value = "";
    if (this.userInfo[data.attributeName]) {
      this.userInfo[data.attributeName].forEach(eachItem => {
        if (eachItem.language === this.langCode) {
          value = eachItem.value
        }
      });
    } else {
      value = this.createCheckedVal(data);
    }
    return value
  }

  // Method to create preview data with formates
  createCheckedVal(data:any){
    let finalvalue = "";
    this.selectedFormats = "";
    data.formatOption[this.langCode].forEach(item => {
      if (item.value !== data.attributeName && item.checked) {
        if (this.userInfo[item.value])
          if (typeof this.userInfo[item.value] === "string") {
            finalvalue += this.userInfo[item.value]
          } else {
            this.userInfo[item.value].forEach(eachVal => {
              if (eachVal.language === this.langCode)
                data.attributeName === 'fullAddress' ? finalvalue += eachVal.value + ", " : finalvalue += eachVal.value + " ";
            });
          }
      }
    })

    data.formatOption[this.langCode].forEach(item =>{
      if (item.checked && item.value !== 'fullAddress') {
        this.selectedFormats += item.value + ",";
      }
    })
    this.selectedFormats = this.selectedFormats.replace(/.$/, '');
    return finalvalue.replace(/[, \s]+$/, "");
  }

  // Method to Uncheck default value checkbox
  checkDefaultVal(data: any, $event:any) {
    let unCheckedValues = 0;
    let unCheckFullAddress = () => {
      data.formatOption[this.langCode].forEach(item => {
        if (item.value === data.attributeName) {
          item['checked'] = false;
        }
      })
    }

    for (let item of data.formatOption[this.langCode]) {
      if (!item.checked && item.value !== data.attributeName) {
        unCheckFullAddress();
        break;
      } else {
        item.checked = true;
      }
    }

    for (let eachItem of data.formatOption[this.langCode]) {
      if (!eachItem.checked) {
        unCheckedValues += 1
      }
    }
    if (unCheckedValues === data.formatOption[this.langCode].length) {
      data.checked = false;
      delete this.sharableAttributes[data.attributeName];
      data.formatOption[this.langCode].forEach(item => {
        item.checked = true;
      })
      $event.closeMenu();
    }
  }

  captureCheckboxValue($event: any, data: any, type: string) {
    if (type === "datacheck") {
      if (data.attributeName.toString() in this.sharableAttributes) {
        delete this.sharableAttributes[data.attributeName];
      } else {
        let value = "";
        if (typeof this.userInfo[data.attributeName] === "string") {
          if(data.attributeName === "dateOfBirth"){
            value = moment(this.userInfo[data.attributeName]).format(data["defaultFormat"]);
          }else{
            value = this.userInfo[data.attributeName];
          }
        } else {
          if (data.formatRequired) {
            value = this.createDefaultValue(data)
          } else {
            this.userInfo[data.attributeName].forEach(item =>{
              if(item.language === this.langCode){
                value = item.value
              }
            });
          }
        }
       
        if (data.formatRequired) {
          this.sharableAttributes[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": false, "format": data['defaultFormat'], "value": value };
        } else {
          this.sharableAttributes[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": false, "value": value };
        }
      }

      this.schema = this.schema.map(eachItem => {
        if (eachItem.attributeName === data.attributeName) {
          let newObj = { ...eachItem, checked: !eachItem.checked }
          if (!newObj.checked && newObj['formatOption']) {
            newObj['formatOption'][this.langCode] = this.selectedOprionsFormOptions[data.attributeName]
          }
          return newObj
        } else {
          return eachItem
        }
      })

    } else {
      if (!data.formatRequired) {
        let value;
        if (this.sharableAttributes[data.attributeName].value === this.userInfo[type]) {
          value = this.userInfo[data.attributeName];
        } else {
          value = this.userInfo[type];
        }
        this.sharableAttributes[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": !this.sharableAttributes[data.attributeName]['isMasked'], "value": value };
      } else {
        let value = "";
        
        if (typeof this.userInfo[data.attributeName] === "string") {
          data.formatOption[this.langCode].forEach(eachItem => {
            eachItem.checked = !eachItem.checked
            if (eachItem.checked) {
              value = moment(this.userInfo[data.attributeName]).format(eachItem["value"]);
              this.selectedFormats = type['label']
            }
          })
        } else {
          this.schema = this.schema.map(eachItem => {
            if (data['attributeName'] === eachItem['attributeName']) {
              eachItem['formatOption'][this.langCode].forEach(item => {
                if (item.value === type['value']) {
                  return item['checked'] = !item['checked']
                } else {
                  return item['checked']
                }
              })
            }
            return eachItem
          })

          if (type['value'] === data.attributeName) {
            value = this.createDefaultValue(data)
            data.formatOption[this.langCode].forEach(item => {
              item.checked = true
            })
          } else {
            value = this.createCheckedVal(data);
            this.checkDefaultVal(data, $event);
          }
        }
        if (data.checked) {
          this.sharableAttributes[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": false, "format": this.selectedFormats, "value": value };
        }
      }
    }
    $event.stopPropagation();
    if (Object.keys(this.sharableAttributes).length >= 3) {
      this.shareBthDisabled = false
    } else {
      this.shareBthDisabled = true
    }

    if (!data.checked && typeof type === "string") {
      if (data.formatRequired) {
        let formatOptions = data['formatOption'][this.langCode].map(eachItem => {
          return { ...eachItem }
        })
        this.selectedOprionsFormOptions[data['attributeName']] = formatOptions;
      }
    }

  }

  captureDropDownValue(event: any) {
    console.log(event.source.value)
    if (event.source.selected) {
      this.partnerId = event.source.value;
    }
  }

  shareInfoBtn() {
    this.auditService.audit('RP-033', 'Share credential with partner', 'RP-Share credential with partner', 'Share credential with partner', 'User clicks on "share" button on share credential page','');
    if (!this.partnerId) {
      this.message = this.popupMessages.genericmessage.sharewithpartner.needPartner
      this.showValidateMessage(this.message);
    } else if (!this.purpose) {
      this.message = this.popupMessages.genericmessage.sharewithpartner.needPurpose
      this.showValidateMessage(this.message);
    } else if (!this.purpose.match(this.purposeValidation)) {
      this.message = this.popupMessages.genericmessage.sharewithpartner.specialCharacters;
      this.showValidateMessage(this.message);
     } else if (!this.prnValid) {
      this.message = this.popupMessages.genericmessage.sharewithpartner.invalidPrn || "PRN must be 13 digits.";
      this.showValidateMessage(this.message);
    } else {
      this.consumePrnBeforeShare();
    }
  }

  consumePrnBeforeShare() {
    const regId = this.sharableAttributes['NIN'] ? this.sharableAttributes['NIN']['value'] : "";
    const prnValue = (this.prn || "").trim();

    if (!regId) {
      this.showValidateMessage("NIN is required to consume PRN. Please select NIN checkbox.");
      return;
    }

    if (!prnValue) {
      this.showValidateMessage("PRN is required to proceed.");
      return;
    }

    this.isLoading = true;
    const request = {
      "regId": regId,
      "prn": prnValue
    };
    this.dataStorageService.consumePrn(request).subscribe(
      (response: any) => {
        this.isLoading = false;
        // Check if there are no errors (errors can be null, undefined, or empty array)
        if (!response.errors || (Array.isArray(response.errors) && response.errors.length === 0)) {
          this.termAndConditions();
        } else if (response.errors && response.errors.length > 0) {
          const errorMsg = response.errors[0].message || "Failed to consume PRN.";
          this.showValidateMessage(errorMsg);
        } else {
          this.showValidateMessage("Failed to consume PRN. Please try again.");
        }
      },
      err => {
        this.isLoading = false;
        console.error(err);
        this.showValidateMessage("Error consuming PRN. Please try again.");
      }
    );
  }

  shareInfo() {
    this.isLoading = true;
    let sharableAttributes = [];
    for (const key in this.sharableAttributes) {
      sharableAttributes.push(this.sharableAttributes[key]);
    }
    let self = this;
    const request = {
      "id": "mosip.resident.share.credential",
      "version": "1.0",
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "partnerId": this.partnerId,
        "purpose": this.purpose,
        "consent": "Accepted",
        "sharableAttributes": sharableAttributes,
      }
    };
    this.dataStorageService
      .shareInfo(request)
      .subscribe(response => {
        this.eventId = response.headers.get("eventid")
        if (response.body["response"]) {
          this.isLoading = false;
          this.showMessage();
          this.router.navigate(["uinservices/dashboard"])
        } else {
          this.isLoading = false;
          this.showErrorPopup(response.body["errors"])
        }
      },
        err => {
          console.error(err);
        });
  }

  termAndConditions() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        id: "shareWithPartner",
        case: 'termsAndConditions',
        title: this.popupMessages.genericmessage.termsAndConditionsLabel,
        conditions: this.popupMessages.genericmessage.termsAndConditionsDescription,
        agreeLabel: this.popupMessages.genericmessage.agreeLabel,
        btnTxt: this.popupMessages.genericmessage.shareButton
      }
    });
    return dialogRef;
  }

  downloadAcknowledgement(eventId: string) {
    this.dataStorageService
      .downloadAcknowledgement(eventId)
      .subscribe(data => {
        var fileName = eventId + ".pdf";
        const contentDisposition = data.headers.get('Content-Disposition');
        if (contentDisposition) {
          const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = fileNameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            fileName = matches[1].replace(/['"]/g, '');
          }
        }
        saveAs(data.body, fileName);
      },
        err => {
          console.error(err);
        });
  }

  showMessage() {
    this.message = this.popupMessages.genericmessage.sharewithpartner.sharedSuccessfully.replace("$eventId", this.eventId)
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '550px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.successLabel,
        clickHere2: this.popupMessages.genericmessage.clickHere2,
        clickHere: this.popupMessages.genericmessage.clickHere,
        eventId: this.eventId,
        trackStatusText: this.popupMessages.genericmessage.trackStatusText,
        dearResident: this.popupMessages.genericmessage.dearResident,
        message: this.message,
        btnTxt: this.popupMessages.genericmessage.successButton,
        isOk:'OK'
      }
    });
    return dialogRef;
  }

  showErrorPopup(message: any) {
    let errorCode = message[0]['errorCode']
    setTimeout(() => {
        this.dialog
          .open(DialogComponent, {
            width: '550px',
            data: {
              case: 'MESSAGE',
              title: this.popupMessages.genericmessage.errorLabel,
              message: this.popupMessages.serverErrors[errorCode],
              btnTxt: this.popupMessages.genericmessage.successButton,
              isOk:'OK'
            },
            disableClose: true
          });
    }, 400)
  }

  showValidateMessage(message: string) {
    this.dialog
      .open(DialogComponent, {
        width: '550px',
        data: {
          case: 'MESSAGE',
          title: this.popupMessages.genericmessage.errorLabel,
          message: message,
          btnTxt: this.popupMessages.genericmessage.successButton,
          isOk:'OK'
        },
        disableClose: true
      });
  }


  viewDetails(eventId: any) {
    this.router.navigateByUrl(`uinservices/trackservicerequest?eid=` + eventId);
  }

  viewDetails2() {
    this.router.navigateByUrl('uinservices/viewhistory');
  }

  get fontSize(): any {
    return this.fontSizeService.fontSize;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.clickEventSubscription.unsubscribe()
  }

  onItemSelected(item: any) {
    this.router.navigate([item]);
  }

  @HostListener("blur", ["$event"])
  @HostListener("focusout", ["$event"])
  private _hideKeyboard() {
    if (this.keyboardService.isOpened) {
      this.keyboardService.dismiss();
    }
  }

}

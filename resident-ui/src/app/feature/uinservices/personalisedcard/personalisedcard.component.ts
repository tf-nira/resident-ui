import { Component, OnInit, OnDestroy } from "@angular/core";
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
import { AutoLogoutService } from "src/app/core/services/auto-logout.service";
import { BreakpointService } from "src/app/core/services/breakpoint.service";
import { FontSizeService } from "src/app/core/services/font-size.service";

@Component({
  selector: "app-personalisedcard",
  templateUrl: "personalisedcard.component.html",
  styleUrls: ["personalisedcard.component.css"],
})
export class PersonalisedcardComponent implements OnInit, OnDestroy {
  langJSON: any;
  popupMessages: any;
  subscriptions: Subscription[] = [];
  schema: any;
  langCode: string = "";
  userInfo: any;
  buildHTML: any;
  dataDisplay: any = {};
  message: string;
  formatData: any;
  nameFormatValues: string[];
  addressFormatValues: string[];
  eventId: any;
  givenNameBox: boolean = false;
  downloadBtnDisabled: boolean = true;
  valuesSelected: any = [];
  width: string;
  previewWidth:string;
  cols: number;
  dataCols:number;
  previewCols:number;
  message2: any;
  fullAddress: string = "";
  formatLabels: any;
  formatCheckBoxClicked: boolean = false;
  isLoading: boolean = true;
  selectedOptionsFromOptions: object = {};
  sitealignment:string = localStorage.getItem('direction');

  constructor(private autoLogout: AutoLogoutService, private interactionService: InteractionService,
    private dialog: MatDialog, private appConfigService: AppConfigService, private dataStorageService: DataStorageService, private translateService: TranslateService, private router: Router,
    private auditService: AuditService, private breakPointService: BreakpointService,private fontSizeService: FontSizeService) {
    this.breakPointService.isBreakpointActive().subscribe(active => {
      if (active) {
        if(active === "small" || active === "extraSmall"){
          this.cols = 1;
          this.dataCols = 1;
          this.previewCols = 1;
        }
        if(active === "ExtraLarge"){
          this.cols = 5;
          this.dataCols = 2;
          this.previewCols = 3;
          this.previewWidth = "28em"
        }
        if(active === "large" || active === "small"){
          this.previewWidth = "28em"
        }
        if(active === "extraSmall"){
          this.previewWidth = "88vw"
        }
        if(active === "large" || active === "medium"){
          this.cols = 5;
          this.dataCols = 3;
          this.previewCols = 2;
        }
        if(active === "medium"){
          this.previewWidth = "23em"
        }
      }
    });

  }

  async ngOnInit() {
    this.langCode = localStorage.getItem("langCode");

    this.translateService.use(localStorage.getItem("langCode"));

    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.langJSON = response;
        this.popupMessages = response;
      });

    this.getUserInfo();
    this.getMappingData();
    this.getPersonalizedCardSchema()

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

  }

  getMappingData() {
    this.dataStorageService
      .getMappingData()
      .subscribe((response) => {
        this.formatData = { "Address Format": response["identity"]["fullAddress"]["value"].split(","), "Name Format": response["identity"]["name"]["value"].split(","), "Date Format": response["identity"]["dob"]["value"].split(",") }
      })
  }


  getPersonalizedCardSchema(){
    this.dataStorageService
    .getUpdateMyDataSchema('personalized-card')
    .subscribe((response) => {
      this.schema = response["identity"];
      this.schema.forEach(data =>{
        this.valuesSelected.push(data.attributeName)
      })
    });
  }

  getUserInfo() {
    this.dataStorageService
      .getUserInfo('personalized-card')
      .subscribe((response) => {
        if (response['response']) {
          this.userInfo = response["response"];
          this.isLoading = false;
        } else {
          this.showErrorPopup(response['errors'])
        }

      });
  }

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
      delete this.dataDisplay[data.attributeName];
      data.formatOption[this.langCode].forEach(item => {
        item.checked = true;
      })
      $event.closeMenu();
    }
  }

  captureCheckboxValue($event: any, data: any, type: any) {
    this.buildHTML = "";
    if (type === "datacheck") {
      if (data.attributeName.toString() in this.dataDisplay) {
        delete this.dataDisplay[data.attributeName];
      } else {
        let value = "";
        if (typeof this.userInfo[data.attributeName] === "string") {
          if (data.attributeName === "dateOfBirth") {
            value = moment(this.userInfo[data.attributeName]).format(data["defaultFormat"]);
          } else {
            value = this.userInfo[data.attributeName];
          }
        } else {
          if (data.formatRequired) {
            value = this.createDefaultValue(data)
          } else {
            this.userInfo[data.attributeName].forEach(eachItem => {
              if (eachItem.language === this.langCode) {
                value = eachItem.value
              }
            });
          }
        }

        if (data.formatRequired) {
          this.dataDisplay[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": data['maskRequired'], "format": data['defaultFormat'], "value": value };
        } else {
          this.dataDisplay[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": data['maskRequired'], "value": value };
        }
      }

      this.schema = this.schema.map(item => {
        if (item.attributeName === data.attributeName) {
          let newItem = { ...item, checked: !item.checked }
          if (!newItem.checked && newItem['formatOption']) {
            newItem['formatOption'][this.langCode] = this.selectedOptionsFromOptions[data.attributeName]
          }
          return newItem
        } else {
          return item
        }
      })

    } else {
      if (!data.formatRequired) {
        let value;
        if (this.dataDisplay[data.attributeName].value === this.userInfo[type]) {
          value = this.userInfo[data.attributeName];
        } else {
          value = this.userInfo[type];
        }
        this.dataDisplay[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": $event.checked, "value": value };
      } else {
        let value = "";
        if (typeof this.userInfo[data.attributeName] === "string") {
          data.formatOption[this.langCode].forEach(item => {
            item.checked = !item.checked
            if (item.checked) {
              value = moment(this.userInfo[data.attributeName]).format(item["value"]);
            }
          })
        } else {
          this.schema = this.schema.map(item => {
            if (data['attributeName'] === item['attributeName']) {
              item['formatOption'][this.langCode].forEach(eachItem => {
                if (eachItem.value === type['value']) {
                  return eachItem['checked'] = !eachItem['checked']
                } else {
                  return eachItem['checked']
                }
              })
            }
            return item
          })

          if (type.value === data.attributeName) {
            data.formatOption[this.langCode].forEach(item => {
              item.checked = true
            })
            value = this.createDefaultValue(data);
          } else {
            value = this.createCheckedVal(data);
            this.checkDefaultVal(data, $event);
          }
        }
        if (data.checked) {
          this.dataDisplay[data.attributeName] = { "label": data.label[this.langCode], "attributeName": data['attributeName'], "isMasked": false, "format": type["value"], "value": value };
        }
      }
    }

    $event.stopPropagation()

    if (Object.keys(this.dataDisplay).length >= 3) {
      this.downloadBtnDisabled = false
    } else {
      this.downloadBtnDisabled = true
    }

    if (!data.checked && typeof type === "string") {
      if (data.formatRequired) {
        let formatOptions = data['formatOption'][this.langCode].map(eachItem => {
          return { ...eachItem }
        })
        this.selectedOptionsFromOptions[data['attributeName']] = formatOptions;
      }
    }
  }

  downloadFile() {
    this.auditService.audit('RP-032', 'Download personalised card', 'RP-Download personalised card', 'Download personalised card', 'User clicks on "download" button on download personalised card page', '');
    this.convertpdf();
  }

  getBase64Image(img: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    // Use naturalWidth/Height to get the full image resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  }

  convertpdf() {
    this.isLoading = true;
    let self = this;
    const cardElement = document.getElementById('seleted-details-card');
    const logoImg = cardElement.querySelector('#card_logo') as HTMLImageElement;
    let originalSrc = "";
    if (logoImg) {
      originalSrc = logoImg.src;
      logoImg.src = this.getBase64Image(logoImg);
    }
    let elementHtml = cardElement.outerHTML;
    if (logoImg) {
      logoImg.src = originalSrc;
    }
    let baseUrl = window.location.origin;
    this.buildHTML = `<!DOCTYPE html><html><head><base href="${baseUrl}/">
    <style>
      .seleted-details-card {
        min-height: 210px;
        width: 369px; /* Fixed card width */
        border: 2px solid #BCBCBC;
        border-radius: 5pt;
        padding: 8px;
        overflow: hidden;
        background-color: white;
        font-family: sans-serif;
      }
      table {
        width: 100%;
        table-layout: fixed; /* Crucial: ensures columns follow percentages */
        border-collapse: collapse;
      }
      td { vertical-align: top; padding: 2px; }
      .detailinfo { color: #000000; font-weight: 400; font-size: 13px; line-height: 1.2; }
      label { color: #666666; font-size: 11px; }
      #card_logo {
        width: 75px;
        height: 45px;
        object-fit: contain;
        display: block;
        margin-left: 75px;
      }
      .logo-cell {
        text-align: right;
      }
    </style></head><body>` + elementHtml + `</body></html>`;
    const request = {
      "id": this.appConfigService.getConfig()["mosip.resident.download.personalized.card.id"],
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "html":btoa(unescape(encodeURIComponent(this.buildHTML))),
        "attributes": Object.keys(this.dataDisplay)
      }
    };
    this.dataStorageService
      .convertpdf(request)
      .subscribe(async (response : any) => {
        const isJsonBlob = (data: any) => data instanceof Blob && data.type === "application/json";
        const responseData = isJsonBlob(response) ? await response.text() : response || {};
        const responseJson = (typeof responseData === "string") ? JSON.parse(responseData) : responseData;
        if (responseJson.body.type === "application/pdf") {
          let contentDisposition = response.headers.get('content-disposition');
          this.eventId = response.headers.get("eventid")
          this.isLoading = false;
          var fileName = ""
          if (contentDisposition) {
            const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = fileNameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
              fileName = matches[1].replace(/['"]/g, '');
            }
          }
          saveAs(response.body, fileName);
          this.showMessage()
          this.router.navigate(['uinservices/dashboard']);
        }else{
          var reader = new FileReader();
          reader.onloadend = function(e) {
            let failureResponse = JSON.parse((<any>e.target).result)
            self.showErrorPopup(failureResponse.errors)
          }
          reader.readAsText(responseJson.body);
          this.isLoading = false;
        }
      },
        err => {
          console.error(err);
        });
  }

  showErrorPopup(message: string) {
    let errorCode = message[0]['errorCode']
    setTimeout(() => {
      this.dialog
        .open(DialogComponent, {
          width: '650px',
          data: {
            case: 'MESSAGE',
            title: this.popupMessages.genericmessage.errorLabel,
            message: this.popupMessages.serverErrors[errorCode],
            btnTxt: this.popupMessages.genericmessage.successButton,
            isOk: 'OK'
          },
          disableClose: true
        });
    }, 400)
  }

  showMessage() {
    this.message = this.popupMessages.genericmessage.personalisedcardMessages.downloadedSuccessFully.replace("$eventId", this.eventId)
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '650px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.successLabel,
        clickHere: this.popupMessages.genericmessage.clickHere,
        clickHere2: this.popupMessages.genericmessage.clickHere2,
        eventId: this.eventId,
        passwordCombinationHeading: this.popupMessages.genericmessage.passwordCombinationHeading,
        passwordCombination: this.popupMessages.genericmessage.passwordCombination,
        trackStatusText: this.popupMessages.genericmessage.trackStatusText,
        dearResident: this.popupMessages.genericmessage.dearResident,
        message: this.message,
        btnTxt: this.popupMessages.genericmessage.successButton,
        isOk: 'OK'
      }
    });
    return dialogRef;
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


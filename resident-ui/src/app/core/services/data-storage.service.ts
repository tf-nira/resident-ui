import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from 'src/app/app-config.service';
import * as appConstants from "../../app.constants";
import { ConfigService } from "./config.service";

let headers: any = new Headers();
headers.append('Content-Type', 'application/json');
@Injectable({
  providedIn: 'root'
})
export class DataStorageService {

  constructor(private httpClient: HttpClient, public appService: AppConfigService, private configService: ConfigService,private appConfigService: AppConfigService) { }

  public BASE_URL = this.appService.getConfig().baseUrl;
  public version = this.appService.getConfig().version;

  getI18NLanguageFiles(langCode: string) {
    return this.httpClient.get(`./assets/i18n/` + langCode + `.json`);
  }

  getConfigFiles(fileName: string) {
    return this.httpClient.get(`./assets/` + fileName + `.json`);
  }

  getDocuments(langCode: string) {
    return this.httpClient.get(this.BASE_URL + '/proxy/masterdata/validdocuments/' + langCode);
  }

  getLocationHierarchyLevel(langCode: string) {
    return this.httpClient.get(this.BASE_URL + '/proxy/masterdata/locationHierarchyLevels/' + langCode);
  }

  recommendedCenters(
    langCode: string,
    locationHierarchyCode: number,
    data: string[]
  ) {
    //console.log(data);
    let url =
      this.BASE_URL +
      "/proxy" +
      appConstants.APPEND_URL.master_data +
      "registrationcenters/" +
      langCode +
      "/" +
      locationHierarchyCode +
      "/names";
    data.forEach((name) => {
      url += "?name=" + name;
      if (data.indexOf(name) !== data.length - 1) {
        url += "&";
      }
    });
    if (url.charAt(url.length - 1) === "&") {
      url = url.substring(0, url.length - 1);
    }
    //console.log(url);
    return this.httpClient.get(url);
  }

  getLocationInfoForLocCode(locCode: string, langCode: string) {
    let url =
      this.BASE_URL +
      "/proxy" +
      appConstants.APPEND_URL.master_data +
      "locations/info/" +
      locCode +
      "/" +
      langCode;
    //console.log(url);
    return this.httpClient.get(url);
  }

  getRegistrationCentersByNamePageWise(
    locType: string,
    text: string,
    pageNumber: number,
    pageSize: number
  ) {
    let url =
      this.BASE_URL +
      "/proxy" +
      appConstants.APPEND_URL.master_data +
      appConstants.APPEND_URL.registration_centers_by_name +
      "page/" +
      localStorage.getItem("langCode") +
      "/" +
      locType +
      "/" +
      encodeURIComponent(text) +
      "?" +
      "pageNumber=" +
      pageNumber +
      "&pageSize=" +
      pageSize +
      "&orderBy=desc&sortBy=createdDateTime";
    //console.log(url);
    return this.httpClient.get(url);
  }

  getNearbyRegistrationCenters(coords: any) {
    return this.httpClient.get(
      this.BASE_URL +
      "/proxy" +
      appConstants.APPEND_URL.master_data +
      appConstants.APPEND_URL.nearby_registration_centers +
      localStorage.getItem("langCode") +
      "/" +
      coords.longitude +
      "/" +
      coords.latitude +
      "/" + 
      this.appConfigService.getConfig()["resident.nearby.centers.distance.meters"]
      // this.configService.getConfigByKey(
      //   "resident.nearby.centers.distance.meters"
      // )
    );
  }

  getWorkingDays(registartionCenterId: string, langCode: string) {
    const url =
      this.BASE_URL +
      "/proxy" +
      appConstants.APPEND_URL.master_data +
      "workingdays/" +
      registartionCenterId +
      "/" +
      langCode;
    return this.httpClient.get(url);
  }

  generateOTP(request: any) {
    return this.httpClient.post(this.BASE_URL + '/req/otp', request);
  }

  verifyOTP(request: any) {
    return this.httpClient.post(this.BASE_URL + '/validate-otp', request, { observe: 'response' });
  }

  getSchema() {
    return this.httpClient.get(this.BASE_URL + '/proxy/config/ui-schema');
  }

  getDemographicdetail() {
    return this.httpClient.get(this.BASE_URL + '/identity/input-attributes/values');
  }

  getPolicy() {
    return this.httpClient.get(this.BASE_URL + '/vid/policy');
  }

  getVIDs() {
    return this.httpClient.get(this.BASE_URL + '/vids');
  }

  generateVID(request: any) {
    return this.httpClient.post(this.BASE_URL + '/generate-vid', request, { observe: 'response' });
  }

  revokeVID(request: any, vid: string) {
    return this.httpClient.patch(this.BASE_URL + '/revoke-vid/' + vid, request, { observe: 'response' });
  }

  getAuthlockStatus() {
    return this.httpClient.get(this.BASE_URL + '/auth-lock-status');
  }

  updateAuthlockStatus(request: any) {
    return this.httpClient.post(this.BASE_URL + '/auth-lock-unlock', request, { observe: 'response'});
  }

  getProfileInfo(langCode:any) {
    return this.httpClient.get(this.BASE_URL + '/profile' + '?languageCode=' + langCode);
  }

  getServiceHistory(request: any, filters: any,pageSize1:any) {
    let buildURL = "";
    if (request) {
      let pageSize = request.pageSize;
      let pageIndex = parseInt(request.pageIndex);
      buildURL = "?pageIndex=" + pageIndex + "&pageSize=" + pageSize;
      if (request) {
        buildURL = buildURL + "&" + filters;
      }
    }
    if (!request && filters) {
      buildURL = "?pageFetch=" + pageSize1 + "&" + filters;
    }
    return this.httpClient.get(this.BASE_URL + '/service-history' + "/" + localStorage.getItem("langCode") + buildURL);
  }

  pinData(eventId: string) {
    return this.httpClient.post(this.BASE_URL + '/pinned/' + eventId, "");
  }

  unpinData(eventId: string) {
    return this.httpClient.post(this.BASE_URL + '/unpinned/' + eventId, "");
  }

  getEIDStatus(eid: string) {
    return this.httpClient.get(this.BASE_URL + '/events' + "/" + eid + "?langCode=" + localStorage.getItem("langCode"));
  }

  getPartnerDetails(partnerType: string) {
    return this.httpClient.get(this.BASE_URL + '/auth-proxy/partners?partnerType=' + partnerType);
  }

  getUserInfo(type:string) {
    return this.httpClient.get(this.BASE_URL + '/identity/info/type/'+type);
  }

  convertpdf(request: any) {
    return this.httpClient.post<Blob>(this.BASE_URL + '/download/personalized-card', request, { observe: 'response', responseType: 'blob' as 'json' });
  }

  shareInfo(request: any) {
    return this.httpClient.post(this.BASE_URL + '/share-credential', request, { observe: 'response' });
  }

  private getPrnValidationUrl() {
    try {
      const parsed = new URL(this.BASE_URL);
      return parsed.origin + '/v1/payment/checkTranscLogs';
    } catch (error) {
      return this.BASE_URL.replace(/\/$/, '') + '/v1/payment/checkTranscLogs';
    }
  }

  private getPrnStatusUrl() {
    try {
      const parsed = new URL(this.BASE_URL);
      return parsed.origin + '/v1/payment/checkPrnStatus';
    } catch (error) {
      return this.BASE_URL.replace(/\/$/, '') + '/v1/payment/checkPrnStatus';
    }
  }

  checkPrnValidity(request: any) {
    return this.httpClient.post<any>(this.getPrnValidationUrl(), request);
  }

  checkPrnStatus(request: any) {
    return this.httpClient.post<any>(this.getPrnStatusUrl(), request);
  }

  downloadAcknowledgement(eventId: string) {
    return this.httpClient.get<Blob>(this.BASE_URL + '/ack/download/pdf/event/' + eventId + '/language/' + localStorage.getItem("langCode"), { observe: 'response', responseType: 'blob' as 'json' });
  }

  onLogout() {
    const url =
      this.BASE_URL +
      'v1' +
      appConstants.APPEND_URL.auth +
      appConstants.APPEND_URL.logout;
    return this.httpClient.post(url, "");
  }

  generateOTPForUid(reqData: any) {
    return this.httpClient.post(this.BASE_URL + '/individualId/otp', reqData)
  }

  isVerified(reqChannel: any, reqIndividualId: any) {
    return this.httpClient.get(`${this.BASE_URL}/channel/verification-status/?channel=${reqChannel}&individualId=${reqIndividualId}`)
  }

  validateUinCardOtp(reqData: any) {
   return this.httpClient.post(this.BASE_URL + '/download-card', reqData, {responseType: "blob", observe: 'response'})
  }


  downloadpdf(request: any) {
    return this.httpClient.get<Blob>(this.BASE_URL + '/download/personalized-card', { observe: 'response', responseType: 'blob' as 'json' });
  }

  downloadServiceHistory(filters: any) {
    let buildURL = "";
    if (filters) {
      buildURL = "?" + filters + "&languageCode=" + localStorage.getItem("langCode");
    }
    if (!filters) {
      buildURL = "?languageCode=" + localStorage.getItem("langCode");
    }
    return this.httpClient.get<Blob>(this.BASE_URL + '/download/service-history' + buildURL, { observe: 'response', responseType: 'blob' as 'json' });
  }

  getNotificationCount() {
    return this.httpClient.get(this.BASE_URL + '/unread/notification-count');
  }

  updateNotificationTime() {
    return this.httpClient.put(this.BASE_URL + '/bell/updatedttime', "");
  }

  getNotificationData(langCode:any) {
    return this.httpClient.get(this.BASE_URL + '/notifications/' + langCode);
  }

  getSupportingDocument() {
    return this.httpClient.get<Blob>(this.BASE_URL + '/download/supporting-documents?langcode=' + localStorage.getItem("langCode"), { responseType: 'blob' as 'json' });
  }

  downloadSupportingDocument() {
    return this.httpClient.get<Blob>(this.BASE_URL + '/download/supporting-documents?langcode=' + localStorage.getItem("langCode"), { observe: 'response', responseType: 'blob' as 'json' });
  }

  getMappingData() {
    return this.httpClient.get(this.BASE_URL + '/auth-proxy/config/identity-mapping')
  }

  sendGrievanceRedressal(request: any) {
    return this.httpClient.post(this.BASE_URL + '/grievance/ticket', request)
  }

  getDataForDropDown(apipath: string) {
    return this.httpClient.get(this.BASE_URL + apipath);
  }

  getImmediateChildren(locationCode: string, langCode: string) {
    // return this.httpClient.get(this.BASE_URL + '/proxy/masterdata/locations/immediatechildren/' + locationCode + '/' + langCode);
    return this.httpClient.get(this.BASE_URL + '/auth-proxy/masterdata/locations/immediatechildren/' + locationCode + '?languageCodes=' + langCode)
  }


  vidDownloadStatus(vid: any) {
    return this.httpClient.get(this.BASE_URL + '/request-card/vid/' + vid, { observe: 'response' })
  }

  downloadVidCardStatus(eventId: any) {
    return this.httpClient.get<Blob>(this.BASE_URL + '/download-card/event/' + eventId,  { observe: 'response', responseType: 'blob' as 'json' })
  }

  generateOtpForDemographicData(request: any) {
    return this.httpClient.post(this.BASE_URL + '/contact-details/send-otp', request)
  }

  verifyUpdateData(request: any) {
    return this.httpClient.post(this.BASE_URL + '/contact-details/update-data', request,{ observe: 'response' })
  }

  getStatus(individualId: any) {
    return this.httpClient.get(this.BASE_URL + '/aid-stage/' + individualId)
  }
  
  registrationCentersList(langcode: any,hierarchylevel:any,name:any) {
    return this.httpClient.get<Blob>(this.BASE_URL + `/download/registration-centers-list?langcode=${langcode}&hierarchylevel=${hierarchylevel}&name=${name}`, { observe: 'response', responseType: 'blob' as 'json' })
  }

  nearByRegistrationCentersList(langcode:any, coords:any){
    return this.httpClient.get<Blob>(this.BASE_URL + `/download/nearestRegistrationcenters?langcode=${langcode}&longitude=${coords.longitude}&latitude=${coords.latitude}&proximitydistance=${this.appConfigService.getConfig()["resident.nearby.centers.distance.meters"]}`, {observe: 'response',responseType: 'blob' as 'json'})
  }

  updateuin(request: any){
    return this.httpClient.patch(this.BASE_URL + '/update-uin', request,{ observe: 'response' });
  }

  uploadfile(request, transactionID, docCatCode, docTypCode, referenceId){
    return this.httpClient.post(this.BASE_URL + '/documents/'+transactionID+'?docCatCode='+docCatCode+'&docTypCode='+docTypCode+'&langCode='+localStorage.getItem("langCode")+'&referenceId='+referenceId, request);
  }

  deleteUploadedFile(docId:string, transactionID:string){
    return this.httpClient.delete(this.BASE_URL + '/documents/'+docId + "?transactionId=" + transactionID)
  }

  isAuthenticated(){
    return this.httpClient.get(this.BASE_URL+'/authorize/admin/validateToken');
  }

  getUpdateMyDataSchema(schemaType:any){
    return this.httpClient.get(this.BASE_URL+'/auth-proxy/config/ui-schema/'+schemaType)
  }

  translateUserInput(request:any){
    return this.httpClient.post(this.BASE_URL + '/transliteration/transliterate', request)
  }

  getUpdateDataCount(){
    return this.httpClient.get(this.BASE_URL + '/identity/update-count')
  }

  getPreferredLangs(langCode:string){
    return this.httpClient.get(this.BASE_URL + '/auth-proxy/masterdata/dynamicfields/preferredLang/' + langCode + '?withValue=true' )
  }

  getPendingDrafts(langCode:string){
    return this.httpClient.get(this.BASE_URL + '/identity/get-pending-drafts/' + langCode)
  }

  discardPendingDrafts(eid:string){
    return this.httpClient.post(this.BASE_URL + '/identity/discardPendingDraft/' + eid, '')
  }
}
